
/**
 * Daoyan MCP Server — Model Context Protocol (JSON-RPC 2.0 over HTTP)
 * Exposes tools: ask_daoyan, search_chapters, get_chapter
 *
 * Compatible with Claude Desktop, Cursor, and other MCP clients.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const AGENT_API_URL = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net/functions/v1/daoyan-agent-api";

const MCP_SERVER_INFO = {
  name: "daoyan-mcp",
  version: "1.0.0",
};

const MCP_CAPABILITIES = {
  tools: {},
};

const TOOLS = [
  {
    name: "ask_daoyan",
    description: "Ask Daoyan (道衍) a question and receive wisdom based on the Boshu (帛书) version of Laozi's Dao De Jing. Daoyan can answer any question from the perspective of Laozi's philosophy — life, work, relationships, science, and more. Note: MCP protocol returns the complete response at once (non-streaming). For streaming output, call the REST API directly with stream=true.",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to ask Daoyan (supports Chinese and English)",
        },
        model: {
          type: "string",
          description: "AI model to use. Options: z-ai/glm-5 (default, recommended), anthropic/claude-sonnet-4, google/gemini-2.5-pro, openai/gpt-4.1, deepseek/deepseek-r1",
          default: "z-ai/glm-5",
        },
        enable_web_search: {
          type: "boolean",
          description: "Whether to enable web search for up-to-date information (default: false)",
          default: false,
        },
      },
      required: ["question"],
    },
  },
  {
    name: "search_chapters",
    description: "Search through the 81 chapters of the Boshu Laozi (帛书老子) by keyword. Returns matching chapter numbers and titles.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Keyword to search for in chapter titles and content (Chinese preferred)",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "get_chapter",
    description: "Get the full content of a specific chapter from the Boshu Laozi (帛书老子). The Boshu version has 81 chapters: De Jing (chapters 1-44) followed by Dao Jing (chapters 45-81).",
    inputSchema: {
      type: "object",
      properties: {
        chapter_number: {
          type: "number",
          description: "Chapter number (1-81). Boshu ch.1 = traditional ch.38, Boshu ch.45 = traditional ch.1",
          minimum: 1,
          maximum: 81,
        },
      },
      required: ["chapter_number"],
    },
  },
];

// ── Chapter index (title + traditional chapter mapping) ─────────────────────
const CHAPTER_INDEX: Array<{ boshu: number; traditional: number; title: string }> = [
  { boshu: 1, traditional: 38, title: "上德不德" },
  { boshu: 2, traditional: 39, title: "昔之得一者" },
  { boshu: 3, traditional: 41, title: "上士闻道" },
  { boshu: 4, traditional: 40, title: "反也者" },
  { boshu: 5, traditional: 42, title: "道生一" },
  { boshu: 6, traditional: 43, title: "天下之至柔" },
  { boshu: 7, traditional: 44, title: "名与身孰亲" },
  { boshu: 8, traditional: 45, title: "大成若缺" },
  { boshu: 9, traditional: 46, title: "天下有道" },
  { boshu: 10, traditional: 47, title: "不出于户" },
  { boshu: 11, traditional: 48, title: "为学者日益" },
  { boshu: 12, traditional: 49, title: "圣人恒无心" },
  { boshu: 13, traditional: 50, title: "出生入死" },
  { boshu: 14, traditional: 51, title: "道生之" },
  { boshu: 15, traditional: 52, title: "天下有始" },
  { boshu: 16, traditional: 53, title: "使我介然有知" },
  { boshu: 17, traditional: 54, title: "善建者不拔" },
  { boshu: 18, traditional: 55, title: "含德之厚者" },
  { boshu: 19, traditional: 56, title: "知者弗言" },
  { boshu: 20, traditional: 57, title: "以正治邦" },
  { boshu: 21, traditional: 58, title: "其正闷闷" },
  { boshu: 22, traditional: 59, title: "治人事天" },
  { boshu: 23, traditional: 60, title: "治大国若烹小鲜" },
  { boshu: 24, traditional: 61, title: "大邦者下流也" },
  { boshu: 25, traditional: 62, title: "道者万物之注" },
  { boshu: 26, traditional: 63, title: "为无为" },
  { boshu: 27, traditional: 64, title: "其安也易持也" },
  { boshu: 28, traditional: 65, title: "故曰为道者" },
  { boshu: 29, traditional: 66, title: "江海之所以能为百谷王" },
  { boshu: 30, traditional: 67, title: "天下皆谓我大" },
  { boshu: 31, traditional: 68, title: "善为士者不武" },
  { boshu: 32, traditional: 69, title: "用兵有言曰" },
  { boshu: 33, traditional: 70, title: "吾言甚易知也" },
  { boshu: 34, traditional: 71, title: "知不知上" },
  { boshu: 35, traditional: 72, title: "民之不畏威" },
  { boshu: 36, traditional: 73, title: "勇于敢者则杀" },
  { boshu: 37, traditional: 74, title: "若民恒且不畏死" },
  { boshu: 38, traditional: 75, title: "人之饥也" },
  { boshu: 39, traditional: 76, title: "人之生也柔弱" },
  { boshu: 40, traditional: 77, title: "天之道犹张弓者也" },
  { boshu: 41, traditional: 78, title: "天下莫柔弱于水" },
  { boshu: 42, traditional: 79, title: "和大怨" },
  { boshu: 43, traditional: 80, title: "小邦寡民" },
  { boshu: 44, traditional: 81, title: "信言不美" },
  { boshu: 45, traditional: 1, title: "道可道也" },
  { boshu: 46, traditional: 2, title: "天下皆知美之为美" },
  { boshu: 47, traditional: 3, title: "不上贤" },
  { boshu: 48, traditional: 4, title: "道冲而用之" },
  { boshu: 49, traditional: 5, title: "天地不仁" },
  { boshu: 50, traditional: 6, title: "谷神不死" },
  { boshu: 51, traditional: 7, title: "天长地久" },
  { boshu: 52, traditional: 8, title: "上善若水" },
  { boshu: 53, traditional: 9, title: "持而盈之" },
  { boshu: 54, traditional: 10, title: "载营魄抱一" },
  { boshu: 55, traditional: 11, title: "三十辐同一毂" },
  { boshu: 56, traditional: 12, title: "五色令人目盲" },
  { boshu: 57, traditional: 13, title: "宠辱若惊" },
  { boshu: 58, traditional: 14, title: "视之而弗见" },
  { boshu: 59, traditional: 15, title: "古之善为道者" },
  { boshu: 60, traditional: 16, title: "致虚极也" },
  { boshu: 61, traditional: 17, title: "太上下知有之" },
  { boshu: 62, traditional: 18, title: "故大道废" },
  { boshu: 63, traditional: 19, title: "绝圣弃智" },
  { boshu: 64, traditional: 20, title: "绝学无忧" },
  { boshu: 65, traditional: 21, title: "孔德之容" },
  { boshu: 66, traditional: 22, title: "曲则全" },
  { boshu: 67, traditional: 23, title: "希言自然" },
  { boshu: 68, traditional: 24, title: "企者不立" },
  { boshu: 69, traditional: 25, title: "有物混成" },
  { boshu: 70, traditional: 26, title: "重为轻根" },
  { boshu: 71, traditional: 27, title: "善行者无辙迹" },
  { boshu: 72, traditional: 28, title: "知其雄" },
  { boshu: 73, traditional: 29, title: "将欲取天下而为之" },
  { boshu: 74, traditional: 30, title: "以道佐人主" },
  { boshu: 75, traditional: 0, title: "夫兵者不祥之器也" },
  { boshu: 76, traditional: 32, title: "道恒无名" },
  { boshu: 77, traditional: 33, title: "知人者智也" },
  { boshu: 78, traditional: 34, title: "道泛呵" },
  { boshu: 79, traditional: 35, title: "执大象" },
  { boshu: 80, traditional: 36, title: "将欲拾之" },
  { boshu: 81, traditional: 37, title: "道恒无名无为" },
];

// ── JSON-RPC helpers ────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResponse(id: string | number | null | undefined, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, result }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function rpcError(id: string | number | null | undefined, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
}

// ── Tool handlers ───────────────────────────────────────────────────────────

async function handleAskDaoyan(
  args: Record<string, unknown>,
  authHeader: string
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const question = args.question as string;
  const enableWebSearch = args.enable_web_search === true;
  const model = (typeof args.model === "string" && args.model.length > 0) ? args.model : undefined;

  const body: Record<string, unknown> = {
    question,
    enable_web_search: enableWebSearch,
    stream: false,
  };
  if (model) body.model = model;

  const resp = await fetch(AGENT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (data.error) {
    return {
      content: [{ type: "text", text: `Error: ${data.error.message}` }],
    };
  }

  let text = data.answer || "No answer received.";
  if (data.sources && data.sources.length > 0) {
    text += "\n\nSources:\n" + data.sources
      .map((s: { title: string; url: string }) => `- [${s.title}](${s.url})`)
      .join("\n");
  }

  return { content: [{ type: "text", text }] };
}

function handleSearchChapters(
  args: Record<string, unknown>
): { content: Array<{ type: string; text: string }> } {
  const keyword = (args.keyword as string || "").trim().toLowerCase();

  if (!keyword) {
    return { content: [{ type: "text", text: "Please provide a keyword to search." }] };
  }

  const matches = CHAPTER_INDEX.filter(ch =>
    ch.title.toLowerCase().includes(keyword)
  );

  if (matches.length === 0) {
    return {
      content: [{
        type: "text",
        text: `No chapters found matching "${keyword}". Try different Chinese keywords like "道", "德", "无为", "水", etc.`,
      }],
    };
  }

  const lines = matches.map(ch => {
    const trad = ch.traditional === 0
      ? "today's version: N/A (unique to Boshu)"
      : `today's ch.${ch.traditional}`;
    return `- Boshu ch.${ch.boshu} (${trad}): ${ch.title}`;
  });

  return {
    content: [{
      type: "text",
      text: `Found ${matches.length} chapter(s) matching "${keyword}":\n\n${lines.join("\n")}`,
    }],
  };
}

function handleGetChapter(
  args: Record<string, unknown>
): { content: Array<{ type: string; text: string }> } {
  const num = Number(args.chapter_number);

  if (!Number.isInteger(num) || num < 1 || num > 81) {
    return {
      content: [{ type: "text", text: "Invalid chapter number. Must be 1-81." }],
    };
  }

  const ch = CHAPTER_INDEX.find(c => c.boshu === num);
  if (!ch) {
    return {
      content: [{ type: "text", text: `Chapter ${num} not found.` }],
    };
  }

  const trad = ch.traditional === 0
    ? "Today's version: N/A (unique to Boshu)"
    : `Today's version: Chapter ${ch.traditional}`;

  const text = [
    `# Boshu Chapter ${ch.boshu}: ${ch.title}`,
    `${trad}`,
    "",
    `This is chapter ${ch.boshu} of the Boshu (帛书) Laozi.`,
    ch.traditional === 0
      ? "This chapter is unique to the Boshu version and has no counterpart in the traditional (Wang Bi) edition."
      : `It corresponds to chapter ${ch.traditional} in the traditional (Wang Bi) edition.`,
    "",
    `To get the full original text and interpretation, use the ask_daoyan tool with a question like: "请解读帛书第${ch.boshu}章"`,
  ].join("\n");

  return { content: [{ type: "text", text }] };
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // GET request: return server info for discovery
  if (req.method === "GET") {
    return new Response(JSON.stringify({
      name: MCP_SERVER_INFO.name,
      version: MCP_SERVER_INFO.version,
      description: "Daoyan (道衍) MCP Server — Wisdom from the Boshu Laozi (帛书老子道德经)",
      tools: TOOLS,
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return rpcError(null, -32600, "Method not allowed");
  }

  let rpcReq: JsonRpcRequest;
  try {
    rpcReq = await req.json();
  } catch {
    return rpcError(null, -32700, "Parse error: invalid JSON");
  }

  if (rpcReq.jsonrpc !== "2.0" || !rpcReq.method) {
    return rpcError(rpcReq.id, -32600, "Invalid JSON-RPC 2.0 request");
  }

  const authHeader = req.headers.get("Authorization") || "";

  console.log(`[mcp] method=${rpcReq.method}`);

  switch (rpcReq.method) {
    case "initialize": {
      return rpcResponse(rpcReq.id, {
        protocolVersion: "2024-11-05",
        serverInfo: MCP_SERVER_INFO,
        capabilities: MCP_CAPABILITIES,
      });
    }

    case "notifications/initialized": {
      // Client notification — no response needed for notifications, but we
      // return an empty result for HTTP compatibility
      return rpcResponse(rpcReq.id, {});
    }

    case "tools/list": {
      return rpcResponse(rpcReq.id, { tools: TOOLS });
    }

    case "tools/call": {
      const params = rpcReq.params || {};
      const toolName = params.name as string;
      const toolArgs = (params.arguments || {}) as Record<string, unknown>;

      if (!toolName) {
        return rpcError(rpcReq.id, -32602, "Missing tool name");
      }

      try {
        switch (toolName) {
          case "ask_daoyan": {
            const result = await handleAskDaoyan(toolArgs, authHeader);
            return rpcResponse(rpcReq.id, result);
          }
          case "search_chapters": {
            const result = handleSearchChapters(toolArgs);
            return rpcResponse(rpcReq.id, result);
          }
          case "get_chapter": {
            const result = handleGetChapter(toolArgs);
            return rpcResponse(rpcReq.id, result);
          }
          default:
            return rpcError(rpcReq.id, -32602, `Unknown tool: ${toolName}`);
        }
      } catch (error) {
        console.error(`[mcp] tool error (${toolName}):`, error);
        return rpcError(rpcReq.id, -32603, (error as Error).message);
      }
    }

    default:
      return rpcError(rpcReq.id, -32601, `Method not found: ${rpcReq.method}`);
  }
});
