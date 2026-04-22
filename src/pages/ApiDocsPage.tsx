import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Copy, Check, Terminal, Plug, BookOpen, Wrench, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENT_API_ENDPOINT, MCP_ENDPOINT, SUPABASE_ANON_KEY } from "@/config";
import { MODEL_OPTIONS, DEFAULT_MODEL_ID } from "@/data/models";
import { copyToClipboard } from "@/lib/utils";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group rounded-lg border border-border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
        {icon}
        {title}
      </h2>
      <div className="space-y-4 text-foreground/80 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function ApiDocsPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";

  const curlExample = `curl -X POST "${AGENT_API_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY.slice(0, 20)}..." \\
  -d '{
    "question": "如何理解无为？",
    "model": "z-ai/glm-5",
    "enable_web_search": false,
    "locale": "zh-CN",
    "stream": false
  }'`;

  const jsExample = `const response = await fetch("${AGENT_API_ENDPOINT}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY",
  },
  body: JSON.stringify({
    question: "What does Laozi say about water?",
    enable_web_search: false,
    locale: "en",
    stream: false,
  }),
});

const data = await response.json();
console.log(data.answer);
// Optional: data.sources (when web search is enabled)`;

  const streamExample = `// Stream mode — receive SSE events
const response = await fetch("${AGENT_API_ENDPOINT}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY",
  },
  body: JSON.stringify({
    question: "道可道也，非恒道也，请解读",
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  process.stdout.write(text);
}`;

  const multiTurnExample = `// Multi-turn conversation
const response = await fetch("${AGENT_API_ENDPOINT}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY",
  },
  body: JSON.stringify({
    question: "那帛书版有什么不同？",
    conversation_history: [
      { role: "user", content: "什么是道？" },
      { role: "assistant", content: "帛书第45章..." }
    ],
    stream: false,
  }),
});`;

  const pythonBasicExample = `import requests

API_URL = "${AGENT_API_ENDPOINT}"
ANON_KEY = "YOUR_ANON_KEY"

response = requests.post(
    API_URL,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}",
    },
    json={
        "question": "如何理解无为？",
        "model": "z-ai/glm-5",          # 可选，默认 z-ai/glm-5
        "enable_web_search": False,
        "locale": "zh-CN",
        "stream": False,
    },
)

data = response.json()
print(data["answer"])
# 可选字段: data.get("thinking"), data.get("sources")`;

  const pythonStreamExample = `import requests

API_URL = "${AGENT_API_ENDPOINT}"
ANON_KEY = "YOUR_ANON_KEY"

response = requests.post(
    API_URL,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}",
    },
    json={
        "question": "道可道也，非恒道也，请解读",
        "model": "anthropic/claude-sonnet-4.5",
        "stream": True,
    },
    stream=True,
)

for line in response.iter_lines(decode_unicode=True):
    if not line or not line.startswith("data:"):
        continue
    payload = line[5:].strip()
    if not payload:
        continue

    import json
    data = json.loads(payload)

    if data.get("type") == "content_block_delta":
        delta = data.get("delta", {})
        text = delta.get("text", "")
        if text:
            print(text, end="", flush=True)

    if data.get("type") == "message_stop":
        print()  # newline
        break`;

  const pythonMultiTurnExample = `import requests

API_URL = "${AGENT_API_ENDPOINT}"
ANON_KEY = "YOUR_ANON_KEY"

# 多轮对话 + 切换模型
response = requests.post(
    API_URL,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}",
    },
    json={
        "question": "那帛书版有什么不同？",
        "model": "google/gemini-3.1-pro-preview",
        "conversation_history": [
            {"role": "user", "content": "什么是道？"},
            {"role": "assistant", "content": "帛书第45章..."},
        ],
        "enable_web_search": True,
        "stream": False,
    },
)

data = response.json()
print("回答:", data["answer"])

if "thinking" in data:
    print("思考过程:", data["thinking"][:200], "...")

if "sources" in data:
    for src in data["sources"]:
        print(f"  来源: {src['title']} — {src['url']}")`;

  const responseFormatNonStream = `{
  "answer": "无为并非无所作为，而是...",
  "thinking": "（可选）模型的思考过程...",
  "sources": [                          // 仅在 enable_web_search=true 时返回
    {
      "title": "道德经解读",
      "url": "https://example.com/...",
      "snippet": "..."
    }
  ]
}`;

  const mcpIdeConfig = `{
  "mcpServers": {
    "daoyan": {
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer YOUR_ANON_KEY"
      }
    }
  }
}`;

  const mcpClaudeConfig = `// claude_desktop_config.json
{
  "mcpServers": {
    "daoyan": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${MCP_ENDPOINT}",
        "--header",
        "Authorization: Bearer YOUR_ANON_KEY"
      ]
    }
  }
}`;

  const mcpTestExample = `# Test MCP initialize
curl -X POST "${MCP_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY.slice(0, 20)}..." \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'

# List tools
curl -X POST "${MCP_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY.slice(0, 20)}..." \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'

# Call ask_daoyan tool
curl -X POST "${MCP_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY.slice(0, 20)}..." \\
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "ask_daoyan",
      "arguments": { "question": "什么是道？" }
    }
  }'`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{isZh ? "道衍 API & MCP" : "Daoyan API & MCP"}</h1>
            <p className="text-xs text-muted-foreground">
              {isZh ? "让其他智能体和网站使用道衍的智慧" : "Let other agents and websites use Daoyan's wisdom"}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Overview */}
        <section className="space-y-3">
          <p className="text-foreground/80 leading-relaxed">
            {isZh
              ? "道衍提供两种接入方式：Agent API（REST 接口，适合网站和应用集成）和 MCP Server（Model Context Protocol，适合 AI 智能体如 Claude Desktop、Cursor 等直接调用）。"
              : "Daoyan provides two integration methods: Agent API (REST interface for websites and apps) and MCP Server (Model Context Protocol for AI agents like Claude Desktop, Cursor, etc.)."}
          </p>
        </section>

        {/* Agent API */}
        <Section
          title={isZh ? "Agent API（REST 接口）" : "Agent API (REST)"}
          icon={<Terminal className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "端点" : "Endpoint"}</h3>
            <code className="block px-3 py-2 rounded-md bg-muted text-sm font-mono break-all">
              POST {AGENT_API_ENDPOINT}
            </code>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "请求参数" : "Request Parameters"}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium border-b border-border">{isZh ? "参数" : "Parameter"}</th>
                    <th className="text-left px-4 py-2 font-medium border-b border-border">{isZh ? "类型" : "Type"}</th>
                    <th className="text-left px-4 py-2 font-medium border-b border-border">{isZh ? "必填" : "Required"}</th>
                    <th className="text-left px-4 py-2 font-medium border-b border-border">{isZh ? "说明" : "Description"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-4 py-2 font-mono text-xs border-b border-border/50">question</td><td className="px-4 py-2 border-b border-border/50">string</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "是" : "Yes"}</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "提问内容" : "The question to ask"}</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs border-b border-border/50">model</td><td className="px-4 py-2 border-b border-border/50">string</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "否" : "No"}</td><td className="px-4 py-2 border-b border-border/50">{isZh ? `AI 模型 ID（默认 "${DEFAULT_MODEL_ID}"）` : `AI model ID (default: "${DEFAULT_MODEL_ID}")`}</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs border-b border-border/50">conversation_history</td><td className="px-4 py-2 border-b border-border/50">array</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "否" : "No"}</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "多轮对话历史" : "Conversation history"}</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs border-b border-border/50">enable_web_search</td><td className="px-4 py-2 border-b border-border/50">boolean</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "否" : "No"}</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "是否联网搜索（默认 false）" : "Enable web search (default: false)"}</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs border-b border-border/50">locale</td><td className="px-4 py-2 border-b border-border/50">string</td><td className="px-4 py-2 border-b border-border/50">{isZh ? "否" : "No"}</td><td className="px-4 py-2 border-b border-border/50">{isZh ? '语言（默认 "zh-CN"）' : 'Language (default: "zh-CN")'}</td></tr>
                  <tr><td className="px-4 py-2 font-mono text-xs">stream</td><td className="px-4 py-2">boolean</td><td className="px-4 py-2">{isZh ? "否" : "No"}</td><td className="px-4 py-2">{isZh ? "是否流式返回（默认 false）" : "Stream response (default: false)"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">cURL</h3>
            <CodeBlock code={curlExample} language="bash" />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">JavaScript</h3>
            <CodeBlock code={jsExample} language="javascript" />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "流式调用" : "Streaming"}</h3>
            <CodeBlock code={streamExample} language="javascript" />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "多轮对话" : "Multi-turn Conversation"}</h3>
            <CodeBlock code={multiTurnExample} language="javascript" />
          </div>
        </Section>

        {/* Model Selection */}
        <Section
          title={isZh ? "模型切换" : "Model Selection"}
          icon={<Cpu className="h-5 w-5 text-primary" />}
        >
          <p>
            {isZh
              ? `通过 model 参数指定 AI 模型。不传时默认使用 ${DEFAULT_MODEL_ID}。支持的模型如下：`
              : `Use the model parameter to select an AI model. Defaults to ${DEFAULT_MODEL_ID} if not specified. Available models:`}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium border-b border-border">Model ID</th>
                  <th className="text-left px-4 py-2 font-medium border-b border-border">{isZh ? "名称" : "Name"}</th>
                  <th className="text-left px-4 py-2 font-medium border-b border-border">{isZh ? "说明" : "Description"}</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_OPTIONS.map((m, i) => (
                  <tr key={m.id}>
                    <td className={`px-4 py-2 font-mono text-xs ${i < MODEL_OPTIONS.length - 1 ? "border-b border-border/50" : ""}`}>
                      {m.id}
                      {m.id === DEFAULT_MODEL_ID && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-sans">
                          {isZh ? "默认" : "default"}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-2 ${i < MODEL_OPTIONS.length - 1 ? "border-b border-border/50" : ""}`}>
                      {m.name}
                    </td>
                    <td className={`px-4 py-2 text-foreground/70 ${i < MODEL_OPTIONS.length - 1 ? "border-b border-border/50" : ""}`}>
                      {isZh ? m.descriptionZh : m.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "响应格式（非流式）" : "Response Format (non-stream)"}</h3>
            <CodeBlock code={responseFormatNonStream} language="json" />
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "thinking 字段在模型支持深度思考时返回（如 Claude Sonnet 4.5、GLM 5）。sources 仅在 enable_web_search=true 时返回。"
                : "The thinking field is returned when the model supports deep thinking (e.g. Claude Sonnet 4.5, GLM 5). sources is only returned when enable_web_search=true."}
            </p>
          </div>
        </Section>

        {/* Python */}
        <Section
          title="Python"
          icon={<Terminal className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "基本调用" : "Basic Request"}</h3>
            <CodeBlock code={pythonBasicExample} language="python" />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "流式调用" : "Streaming"}</h3>
            <CodeBlock code={pythonStreamExample} language="python" />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "多轮对话 + 联网搜索" : "Multi-turn + Web Search"}</h3>
            <CodeBlock code={pythonMultiTurnExample} language="python" />
          </div>
        </Section>

        {/* MCP Server */}
        <Section
          title={isZh ? "MCP Server（智能体协议）" : "MCP Server (Agent Protocol)"}
          icon={<Plug className="h-5 w-5 text-primary" />}
        >
          <p>
            {isZh
              ? "MCP (Model Context Protocol) 让 AI 智能体能直接发现和调用道衍的能力。支持 Claude Desktop、Cursor、以及任何兼容 MCP 的客户端。"
              : "MCP (Model Context Protocol) allows AI agents to discover and use Daoyan's capabilities. Compatible with Claude Desktop, Cursor, and any MCP-compatible client."}
          </p>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "端点" : "Endpoint"}</h3>
            <code className="block px-3 py-2 rounded-md bg-muted text-sm font-mono break-all">
              POST {MCP_ENDPOINT}
            </code>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {isZh ? "可用工具" : "Available Tools"}
            </h3>
            <div className="grid gap-3">
              {[
                {
                  name: "ask_daoyan",
                  desc: isZh ? "向道衍提问，获取基于帛书老子智慧的回答" : "Ask Daoyan a question based on Boshu Laozi wisdom",
                  params: "question (string), model? (string), enable_web_search? (boolean)",
                },
                {
                  name: "search_chapters",
                  desc: isZh ? "按关键词搜索帛书81章" : "Search through 81 Boshu chapters by keyword",
                  params: "keyword (string)",
                },
                {
                  name: "get_chapter",
                  desc: isZh ? "获取指定帛书章节信息" : "Get info about a specific Boshu chapter",
                  params: "chapter_number (1-81)",
                },
              ].map(tool => (
                <div key={tool.name} className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="font-mono text-sm font-medium text-primary">{tool.name}</div>
                  <p className="text-sm text-foreground/70 mt-1">{tool.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">{isZh ? "参数" : "Params"}: {tool.params}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">
                {isZh ? "关于流式输出" : "About Streaming"}
              </p>
              <p className="text-foreground/70 mt-1">
                {isZh
                  ? "MCP 协议的 tools/call 返回完整 JSON 结果（非流式）。如需逐 token 流式输出，请直接调用 REST API 并设置 stream=true，参见上方 Python 流式调用示例。"
                  : "MCP tools/call returns the complete JSON result (non-streaming). For token-by-token streaming, call the REST API directly with stream=true — see the Python streaming example above."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {isZh ? "IDE 配置（Cursor / Trae / Windsurf）" : "IDE Configuration (Cursor / Trae / Windsurf)"}
            </h3>
            <CodeBlock code={mcpIdeConfig} language="json" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{isZh ? "将上述配置写入对应 IDE 的 MCP 配置文件：" : "Save the config to your IDE's MCP config file:"}</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Cursor: <code className="text-xs bg-muted px-1 rounded">.cursor/mcp.json</code></li>
                <li>Trae: <code className="text-xs bg-muted px-1 rounded">.trae/mcp.json</code></li>
                <li>Windsurf: <code className="text-xs bg-muted px-1 rounded">.windsurf/mcp.json</code></li>
              </ul>
              <p className="mt-2">
                {isZh ? "Trae 详细配置文档：" : "Trae configuration docs: "}
                <a
                  href="https://docs.trae.cn/ide/add-mcp-servers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  docs.trae.cn/ide/add-mcp-servers
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "Claude Desktop 配置" : "Claude Desktop Configuration"}</h3>
            <CodeBlock code={mcpClaudeConfig} language="json" />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{isZh ? "手动测试 (cURL)" : "Manual Testing (cURL)"}</h3>
            <CodeBlock code={mcpTestExample} language="bash" />
          </div>
        </Section>

        {/* Authentication */}
        <Section
          title={isZh ? "认证说明" : "Authentication"}
          icon={<BookOpen className="h-5 w-5 text-primary" />}
        >
          <p>
            {isZh
              ? "所有 API 请求需在 Header 中携带 Authorization: Bearer <anon_key>。Anon Key 是可公开的前端密钥，受后端安全策略保护。"
              : "All API requests require an Authorization: Bearer <anon_key> header. The anon key is a publishable frontend key protected by backend security policies."}
          </p>
          <div className="space-y-1">
            <h3 className="font-medium text-foreground">Anon Key</h3>
            <CodeBlock code={SUPABASE_ANON_KEY} language="text" />
          </div>
        </Section>
      </main>
    </div>
  );
}
