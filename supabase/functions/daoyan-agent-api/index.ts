/**
 * Daoyan Agent API — A public REST endpoint for third-party agents/websites
 * to query the Daoyan AI.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_CHAT_FN = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net/functions/v1/ai-chat-167c2bc1450e";
const DEFAULT_MODEL = "z-ai/glm-5";

const SUPABASE_URL = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: { message } }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const {
      question,
      conversation_history = [],
      enable_web_search = false,
      locale = "zh-CN",
      stream = false,
      model,
    } = body as {
      question?: string;
      conversation_history?: Array<{ role: string; content: string }>;
      enable_web_search?: boolean;
      locale?: string;
      stream?: boolean;
      model?: string;
    };

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return errorResponse("'question' is required and must be a non-empty string");
    }

    if (question.length > 10000) {
      return errorResponse("'question' exceeds max length of 10000 characters");
    }

    // --- API usage check via JWT or anon key ---
    const authHeader = req.headers.get("Authorization") || "";
    let userId: string | null = null;

    // Try to extract user from JWT
    if (authHeader && SUPABASE_SERVICE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) userId = user.id;
      } catch {
        // Anonymous request — no user
      }
    }

    // Check API usage if user identified
    if (userId && SUPABASE_SERVICE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: usageResult } = await supabaseAdmin.rpc("check_and_increment_api", { p_user_id: userId });
        if (usageResult && !usageResult.allowed) {
          console.log(`[agent-api] rate limited user=${userId} reason=${usageResult.reason}`);
          return jsonResponse({
            error: {
              message: `API monthly limit exceeded (${usageResult.used}/${usageResult.limit}). Upgrade your plan for more.`,
              type: "rate_limit",
              tier: usageResult.tier,
              limit: usageResult.limit,
              used: usageResult.used,
            },
          }, 429);
        }
      } catch (err) {
        console.warn("[agent-api] usage check failed, allowing request:", err);
      }
    }

    const messages = [
      ...((Array.isArray(conversation_history) ? conversation_history : []).map(m => ({
        role: m.role,
        content: m.content,
      }))),
      { role: "user", content: question.trim() },
    ];

    const selectedModel = (typeof model === "string" && model.length > 0) ? model : DEFAULT_MODEL;

    console.log(`[agent-api] question="${question.slice(0, 60)}" model=${selectedModel} web_search=${enable_web_search} stream=${stream} user=${userId || "anon"}`);

    const chatResponse = await fetch(AI_CHAT_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        messages,
        model: selectedModel,
        enable_web_search,
        locale,
      }),
    });

    if (!chatResponse.ok) {
      const text = await chatResponse.text();
      console.error("[agent-api] upstream error:", chatResponse.status, text);
      return errorResponse("AI service error", chatResponse.status);
    }

    if (stream) {
      return new Response(chatResponse.body, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (!chatResponse.body) {
      return errorResponse("No response body from AI service", 502);
    }

    let answer = "";
    let thinking = "";
    let sources: Array<{ title: string; url: string; snippet: string }> = [];
    let stopped = false;

    const reader = chatResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const normalized = buffer.replace(/\r\n/g, "\n");
        const lines = normalized.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          let payload = trimmed.slice(5);
          if (payload.startsWith(" ")) payload = payload.slice(1);
          payload = payload.trim();
          if (!payload) continue;

          let data: Record<string, unknown>;
          try {
            data = JSON.parse(payload);
          } catch {
            continue;
          }

          if (data.type === "search_results" && Array.isArray(data.results)) {
            sources = data.results as typeof sources;
          }

          if (data.type === "content_block_delta") {
            const delta = data.delta as Record<string, string> | undefined;
            if (delta?.text) {
              answer += delta.text;
            }
            if (delta?.thinking) {
              thinking += delta.thinking;
            }
          }

          if (data.type === "error") {
            const err = data.error as Record<string, string> | undefined;
            return jsonResponse({
              error: { message: err?.message || "AI service error" },
            }, 500);
          }

          if (data.type === "message_stop") {
            stopped = true;
            break;
          }
        }
      }
    } finally {
      reader.cancel();
      reader.releaseLock();
    }

    console.log(`[agent-api] completed: answer_len=${answer.length} thinking_len=${thinking.length} sources=${sources.length}`);

    const result: Record<string, unknown> = { answer };
    if (thinking) {
      result.thinking = thinking;
    }
    if (sources.length > 0) {
      result.sources = sources;
    }

    return jsonResponse(result);

  } catch (error) {
    console.error("[agent-api] error:", error);
    return errorResponse((error as Error).message, 500);
  }
});
