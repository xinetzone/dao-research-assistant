const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_API_URL = "https://api.enter.pro/code/api/v1/ai/messages";

// Simple web search via DuckDuckGo HTML (no API key needed)
async function webSearch(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const resp = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; DaoResearchBot/1.0)",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const html = await resp.text();
    const results: { title: string; url: string; snippet: string }[] = [];

    // Parse DuckDuckGo HTML results
    const resultBlocks = html.split('class="result__body"');
    for (let i = 1; i < Math.min(resultBlocks.length, 6); i++) {
      const block = resultBlocks[i];

      // Extract title
      const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)</);
      const title = titleMatch ? titleMatch[1].replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() : "";

      // Extract URL
      const urlMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/);
      const url = urlMatch ? decodeURIComponent(urlMatch[1]) : "";

      // Extract snippet
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      let snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim() : "";
      snippet = snippet.substring(0, 300);

      if (title && url) {
        results.push({ title, url, snippet });
      }
    }

    console.log(`[web-search] query="${query}" results=${results.length}`);
    return results;
  } catch (err) {
    console.error("[web-search] failed:", err);
    return [];
  }
}

function buildSearchContext(results: { title: string; url: string; snippet: string }[]): string {
  if (results.length === 0) return "";
  let ctx = "## Web Search Results\n\n";
  for (const r of results) {
    ctx += `### ${r.title}\nSource: ${r.url}\n${r.snippet}\n\n`;
  }
  return ctx;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_167c2bc1450e");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

    const { messages, model, system, enable_web_search } = await req.json();

    let finalSystem = system || "";
    let searchResults: { title: string; url: string; snippet: string }[] = [];

    // If web search is enabled, search for the latest user message
    if (enable_web_search) {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      if (lastUserMsg) {
        searchResults = await webSearch(lastUserMsg.content);
        const searchCtx = buildSearchContext(searchResults);
        if (searchCtx) {
          finalSystem = finalSystem
            ? `${finalSystem}\n\n${searchCtx}\nUse the web search results above to provide up-to-date information. Cite sources when relevant.`
            : `${searchCtx}\nUse the web search results above to provide up-to-date information. Cite sources when relevant.`;
        }
      }
    }

    const body: Record<string, unknown> = {
      model: model || "anthropic/claude-sonnet-4.5",
      messages,
      stream: true,
      max_tokens: 4096,
    };

    if (finalSystem) {
      body.system = finalSystem;
    }

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = "AI service error";
      let errorCode = "api_error";

      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        try {
          const errorData = JSON.parse(dataMatch[1]);
          errorMessage = errorData.error?.message || errorMessage;
          errorCode = errorData.error?.type || errorCode;
        } catch { /* use defaults */ }
      }

      const errorSSE = `event: error\ndata: ${JSON.stringify({
        type: "error",
        error: { type: errorCode, message: errorMessage },
      })}\n\n`;

      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // If we have search results, prepend them as a custom SSE event then stream AI response
    if (searchResults.length > 0) {
      const searchEvent = `event: search_results\ndata: ${JSON.stringify({
        type: "search_results",
        results: searchResults,
      })}\n\n`;

      const encoder = new TextEncoder();
      const searchChunk = encoder.encode(searchEvent);

      const upstreamBody = response.body!;
      const readable = new ReadableStream({
        async start(controller) {
          // First send search results
          controller.enqueue(searchChunk);
          // Then pipe the AI stream
          const reader = upstreamBody.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error("[stream] read error:", e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // No search results, just pipe through
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[ai-chat] error:", error);
    const errorSSE = `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "api_error", message: error.message },
    })}\n\n`;

    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
