
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Security response headers added to every non-OPTIONS response
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const AI_API_URL = "https://api.enter.pro/code/api/v1/ai/messages";

// Allowlist of permitted model identifiers
const ALLOWED_MODELS = new Set([
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-haiku-4-5",
  "anthropic/claude-opus-4-5",
  "google/gemini-2.5-pro",
  "google/gemini-2.0-flash",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
]);
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

// Input limits
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_SYSTEM_LENGTH = 200000;  // raised to support large user document contexts
const MAX_SEARCH_QUERY_LENGTH = 500;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Multiple search strategies for reliability
async function webSearch(query: string): Promise<SearchResult[]> {
  // Sanitize query
  const safeQuery = query.substring(0, MAX_SEARCH_QUERY_LENGTH).trim();

  // Strategy 1: DuckDuckGo HTML (same parser as standalone web-search function)
  try {
    const results = await duckduckgoSearch(safeQuery);
    if (results.length > 0) {
      console.log(`[web-search] ddg query="${safeQuery}" results=${results.length}`);
      return results;
    }
  } catch (err) {
    console.warn("[web-search] ddg failed:", (err as Error).message);
  }

  // Strategy 2: DuckDuckGo Lite fallback
  try {
    const results = await duckduckgoLiteSearch(safeQuery);
    if (results.length > 0) {
      console.log(`[web-search] ddg-lite query="${safeQuery}" results=${results.length}`);
      return results;
    }
  } catch (err) {
    console.warn("[web-search] ddg-lite failed:", (err as Error).message);
  }

  console.error(`[web-search] ALL strategies failed for query="${safeQuery}"`);
  return [];
}

async function duckduckgoSearch(query: string): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const resp = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    }
  );
  clearTimeout(timeout);

  const html = await resp.text();
  const results: SearchResult[] = [];

  // Parse result blocks: <div class="result...">...</div>
  const resultPattern = /<div class="result[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi;
  const matches = html.matchAll(resultPattern);

  for (const match of matches) {
    if (results.length >= 5) break;

    const resultHtml = match[1];

    // Extract title and href
    const titleMatch = resultHtml.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    // DDG uses redirect href like //duckduckgo.com/l/?uddg=<encoded-real-url>
    const rawHref = titleMatch[1];
    const uddgMatch = rawHref.match(/uddg=([^&"]+)/);
    const url = uddgMatch ? decodeURIComponent(uddgMatch[1]) : rawHref;

    const title = titleMatch[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    // Extract snippet
    const snippetMatch = resultHtml.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);
    const snippet = snippetMatch
      ? snippetMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ")
          .trim()
          .substring(0, 300)
      : "";

    if (url && title) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

async function duckduckgoLiteSearch(query: string): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const resp = await fetch(
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      signal: controller.signal,
    }
  );
  clearTimeout(timeout);

  const html = await resp.text();
  const results: SearchResult[] = [];

  const linkRegex = /class='result-link'[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const snippetRegex = /class="result-snippet">([^<]*)/g;

  const links: { url: string; title: string }[] = [];
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    links.push({ url: m[1], title: decodeHTMLEntities(m[2]).trim() });
  }

  const snippets: string[] = [];
  while ((m = snippetRegex.exec(html)) !== null) {
    snippets.push(decodeHTMLEntities(m[1]).trim().substring(0, 300));
  }

  for (let i = 0; i < Math.min(links.length, 5); i++) {
    if (links[i].title && links[i].url) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || "",
      });
    }
  }
  return results;
}

function decodeHTMLEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function buildSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return "";
  let ctx = "## Web Search Results\n\n";
  for (const r of results) {
    ctx += `### ${r.title}\nSource: ${r.url}\n${r.snippet}\n\n`;
  }
  return ctx;
}

function getLanguageInstruction(locale?: string): string {
  if (!locale) return "";
  if (locale.startsWith("zh")) {
    return "You MUST respond in Chinese (Simplified).";
  }
  if (locale.startsWith("en")) {
    return "You MUST respond in English.";
  }
  return `You MUST respond in the language matching locale: ${locale}.`;
}

function errorResponse(message: string, status: number): Response {
  const errorSSE = `event: error\ndata: ${JSON.stringify({
    type: "error",
    error: { type: "api_error", message },
  })}\n\n`;
  return new Response(errorSSE, {
    status,
    headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "text/event-stream" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_167c2bc1450e");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { messages, model, system, enable_web_search, locale } = body as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      system?: string;
      enable_web_search?: boolean;
      locale?: string;
    };

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse("messages must be a non-empty array", 400);
    }
    if (messages.length > MAX_MESSAGES) {
      return errorResponse(`Too many messages (max ${MAX_MESSAGES})`, 400);
    }
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return errorResponse("Each message must have role and content", 400);
      }
      if (!["user", "assistant", "system"].includes(msg.role)) {
        return errorResponse(`Invalid message role: ${msg.role}`, 400);
      }
      if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
        return errorResponse(`Message content exceeds max length of ${MAX_MESSAGE_LENGTH}`, 400);
      }
    }

    // Validate and sanitize model
    const safeModel = (typeof model === "string" && ALLOWED_MODELS.has(model))
      ? model
      : DEFAULT_MODEL;

    // Validate system prompt length
    if (system && typeof system === "string" && system.length > MAX_SYSTEM_LENGTH) {
      return errorResponse(`System prompt exceeds max length of ${MAX_SYSTEM_LENGTH}`, 400);
    }

    // Build system prompt: user-provided system + language instruction + search context
    const parts: string[] = [];

    if (system && typeof system === "string") {
      parts.push(system);
    }

    const langInstruction = getLanguageInstruction(typeof locale === "string" ? locale : undefined);
    if (langInstruction) {
      parts.push(langInstruction);
    }

    let searchResults: SearchResult[] = [];

    if (enable_web_search === true) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        searchResults = await webSearch(lastUserMsg.content);
        const searchCtx = buildSearchContext(searchResults);
        if (searchCtx) {
          parts.push(searchCtx);
          parts.push("IMPORTANT: You have access to the web search results above. Use them to provide accurate, up-to-date information. Always cite your sources by mentioning the source URL. Do NOT say you cannot access the internet or search the web — you already have the search results.");
        } else {
          parts.push("Note: A web search was attempted for the user's query but returned no results. Please answer based on your knowledge and let the user know the search returned no results.");
        }
      }
    }

    const finalSystem = parts.join("\n\n");

    const requestBody: Record<string, unknown> = {
      model: safeModel,
      messages,
      stream: true,
      max_tokens: 4096,
    };

    if (finalSystem) {
      requestBody.system = finalSystem;
    }

    console.log(`[ai-chat] model=${safeModel} web_search=${!!enable_web_search} search_results=${searchResults.length} system_len=${finalSystem.length}`);

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const responseHeaders = {
      ...corsHeaders,
      ...securityHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    };

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
          controller.enqueue(searchChunk);
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
      return new Response(readable, { headers: responseHeaders });
    }

    return new Response(response.body, { headers: responseHeaders });
  } catch (error) {
    console.error("[ai-chat] error:", error);
    return errorResponse((error as Error).message, 500);
  }
});
