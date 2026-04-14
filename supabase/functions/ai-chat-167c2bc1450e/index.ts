const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

async function callWebSearch(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/web-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ query, limit: 5 }),
  });

  if (!response.ok) {
    throw new Error(`Web search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

async function fetchUrlContent(url: string): Promise<{ content: string; title: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-url-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      return { content: "", title: "" };
    }

    const data = await response.json();
    return { content: data.content || "", title: data.title || "" };
  } catch {
    return { content: "", title: "" };
  }
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

    const body: Record<string, unknown> = {
      model: model || "anthropic/claude-sonnet-4.5",
      messages,
      stream: true,
      max_tokens: 4096,
    };

    if (system) {
      body.system = system;
    }

    // Add web search tool if enabled
    if (enable_web_search) {
      body.tools = [{
        name: "web_search",
        description: "Search the web for current information, recent events, news, or data not in your training data. Returns a list of relevant web pages with titles, URLs, and snippets. Use this when the user asks about current events, recent information, real-time data, or specific facts you're unsure about.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query. Be specific and include relevant keywords."
            }
          },
          required: ["query"]
        }
      }];
    }

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
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
        error: { type: errorCode, message: errorMessage }
      })}\n\n`;
      
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    // If web search is not enabled, just stream the response
    if (!enable_web_search) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Handle tool use - need to process the stream
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let toolUses: ToolUse[] = [];
        let stopReason = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || line.startsWith(":")) continue;

              const dataMatch = line.match(/^data: (.+)$/);
              if (!dataMatch) continue;

              try {
                const data = JSON.parse(dataMatch[1]);

                // Forward the event to client
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

                // Check for tool use
                if (data.type === "content_block_start" && data.content_block?.type === "tool_use") {
                  toolUses.push({
                    id: data.content_block.id,
                    name: data.content_block.name,
                    input: {}
                  });
                }

                if (data.type === "content_block_delta" && data.delta?.type === "input_json_delta") {
                  const lastTool = toolUses[toolUses.length - 1];
                  if (lastTool) {
                    const inputStr = JSON.stringify(lastTool.input) + (data.delta.partial_json || "");
                    try {
                      lastTool.input = JSON.parse(inputStr);
                    } catch {
                      // Partial JSON, will complete later
                    }
                  }
                }

                if (data.type === "message_stop") {
                  stopReason = data.stop_reason || "";
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }

          // If AI wants to use tools, execute them
          if (toolUses.length > 0 && stopReason === "tool_use") {
            for (const toolUse of toolUses) {
              if (toolUse.name === "web_search") {
                const query = toolUse.input.query as string;
                
                // Send search status event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "search_status",
                  status: "searching",
                  query
                })}\n\n`));

                // Execute search
                const searchResults = await callWebSearch(query);

                // Fetch content from top 3 results
                const contentPromises = searchResults.slice(0, 3).map(r => fetchUrlContent(r.url));
                const contents = await Promise.all(contentPromises);

                // Build tool result
                let resultText = `Search results for "${query}":\n\n`;
                searchResults.forEach((result, idx) => {
                  resultText += `${idx + 1}. ${result.title}\n`;
                  resultText += `   URL: ${result.url}\n`;
                  resultText += `   ${result.snippet}\n\n`;
                });

                if (contents.some(c => c.content)) {
                  resultText += "\nDetailed content from top results:\n\n";
                  contents.forEach((content, idx) => {
                    if (content.content) {
                      const truncated = content.content.slice(0, 3000);
                      resultText += `--- Content from ${searchResults[idx].title} ---\n${truncated}\n\n`;
                    }
                  });
                }

                // Send sources to client
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "search_results",
                  results: searchResults
                })}\n\n`));

                // Continue conversation with tool result
                const continueMessages = [
                  ...messages,
                  {
                    role: "assistant",
                    content: [{
                      type: "tool_use",
                      id: toolUse.id,
                      name: "web_search",
                      input: toolUse.input
                    }]
                  },
                  {
                    role: "user",
                    content: [{
                      type: "tool_result",
                      tool_use_id: toolUse.id,
                      content: resultText
                    }]
                  }
                ];

                const continueBody = {
                  model: model || "anthropic/claude-sonnet-4.5",
                  messages: continueMessages,
                  stream: true,
                  max_tokens: 4096,
                  ...(system ? { system } : {}),
                };

                const continueResponse = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${AI_API_TOKEN}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(continueBody),
                });

                // Stream the continued response
                const continueReader = continueResponse.body?.getReader();
                if (continueReader) {
                  while (true) {
                    const { done, value } = await continueReader.read();
                    if (done) break;
                    controller.enqueue(value);
                  }
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            error: { type: "stream_error", message: error.message }
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    const errorSSE = `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "api_error", message: error.message }
    })}\n\n`;
    
    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });
  }
});