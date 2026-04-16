import { memo, useMemo, useCallback, useRef, useEffect } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import DOMPurify from "dompurify";
import { cn, copyToClipboard } from "@/lib/utils";

// Register commonly used languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);

// Initialize markdown-it — better CJK support than marked
const md = new MarkdownIt({
  html: true,   // required: allows preprocessed <strong>/<em> tags to pass through
  xhtmlOut: false,
  breaks: false,
  linkify: true,
  typographer: false, // Keep quotes as-is (don't convert " to curly quotes)
  highlight(str, lang) {
    const language = lang && hljs.getLanguage(lang) ? lang : "";
    try {
      const highlighted = language
        ? hljs.highlight(str, { language }).value
        : hljs.highlightAuto(str).value;
      return highlighted;
    } catch {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  },
});

// ── Custom renderers ──────────────────────────────────────────────────────────

// Links open in new tab
const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  tokens[idx].attrSet("class", "dao-md-link");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// Code blocks with copy button scaffold
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = (token.info || "").trim();
  const language = lang && hljs.getLanguage(lang) ? lang : "";
  let highlighted: string;
  try {
    highlighted = language
      ? hljs.highlight(token.content, { language }).value
      : hljs.highlightAuto(token.content).value;
  } catch {
    highlighted = token.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return `<div class="dao-code-block group">
    <div class="dao-code-header">
      <span class="text-xs font-medium uppercase tracking-wider">${language || "code"}</span>
      <button class="dao-copy-btn flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-code="${encodeURIComponent(token.content)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Copy</span>
      </button>
    </div>
    <pre class="dao-code-pre"><code class="dao-code-content hljs">${highlighted}</code></pre>
  </div>`;
};

// Inline code
md.renderer.rules.code_inline = (tokens, idx) => {
  const token = tokens[idx];
  const escaped = token.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<code class="dao-inline-code">${escaped}</code>`;
};

// Blockquotes with custom class
const defaultBlockquoteOpen = md.renderer.rules.blockquote_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.blockquote_open = function(tokens, idx, options, env, self) {
  tokens[idx].attrSet("class", "dao-blockquote");
  return defaultBlockquoteOpen(tokens, idx, options, env, self);
};

// Tables wrapped for horizontal scroll
md.renderer.rules.table_open = () => '<div class="dao-table-wrap"><table>';
md.renderer.rules.table_close = () => '</table></div>';

// ── DOMPurify config ──────────────────────────────────────────────────────────
const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
    "ul", "ol", "li", "blockquote", "pre", "code",
    "a", "strong", "em", "del", "s", "sup", "sub",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span", "img", "input",
    "svg", "path", "rect", "line", "circle",
    "button",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "class", "data-code",
    "src", "alt", "width", "height", "align",
    "type", "checked", "disabled",
    "xmlns", "viewBox", "fill", "stroke", "stroke-width",
    "stroke-linecap", "stroke-linejoin", "d", "x", "y", "rx", "ry",
  ],
  FORBID_ATTR: [
    "onerror", "onload", "onclick", "onmouseover", "onfocus",
    "onblur", "onkeydown", "onkeyup", "onkeypress",
    "onchange", "oninput", "onsubmit", "onreset",
    "style",
  ],
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  FORCE_BODY: true,
};

// ── CJK bold/italic preprocessing ─────────────────────────────────────────────
/**
 * markdown-it (CommonMark) fails to recognize closing ** as a right-flanking
 * delimiter when the preceding char is Unicode punctuation (like ）。，) AND
 * the following char is a CJK letter (not whitespace/punctuation).
 *
 * Fix: convert **text** → <strong>text</strong> BEFORE markdown-it processes
 * the content, bypassing CommonMark's delimiter boundary detection entirely.
 * Requires html: true in MarkdownIt config. DOMPurify handles sanitization.
 */
function preprocessMarkdown(content: string): string {
  const saved: string[] = [];
  let savedIdx = 0;
  const PLACEHOLDER = "\uE001"; // Private Use Area — won't appear in AI responses

  // 1. Save code blocks (fenced + inline) so we don't modify code content
  let text = content
    .replace(/```[\s\S]*?```/g, m => { saved.push(m); return `${PLACEHOLDER}${savedIdx++}${PLACEHOLDER}`; })
    .replace(/`[^`\n]+`/g, m => { saved.push(m); return `${PLACEHOLDER}${savedIdx++}${PLACEHOLDER}`; });

  // 2. **bold** → <strong>bold</strong>  (fixes CJK boundary issue)
  text = text.replace(/\*\*([^*\n]+?)\*\*/g, (_, inner) => `<strong>${inner}</strong>`);

  // 3. Restore saved code blocks
  return text.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, "g"), (_, i) => saved[parseInt(i)]);
}

// ── Component ─────────────────────────────────────────────────────────────────
interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (!content) return "";
    const preprocessed = preprocessMarkdown(content);
    const raw = md.render(preprocessed);
    return DOMPurify.sanitize(raw, PURIFY_CONFIG);
  }, [content]);

  // Attach copy handlers via event delegation
  const handleClick = useCallback((e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest(".dao-copy-btn") as HTMLButtonElement | null;
    if (!btn) return;

    const code = decodeURIComponent(btn.dataset.code || "");
    copyToClipboard(code).then(() => {
      const label = btn.querySelector("span");
      if (label) {
        label.textContent = "Copied";
        setTimeout(() => { label.textContent = "Copy"; }, 2000);
      }
    });
  }, []);

  // Highlight code blocks that auto-detection missed
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll("pre code:not(.hljs)").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={cn("dao-markdown", className)}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
