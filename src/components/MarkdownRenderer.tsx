import { memo, useMemo, useCallback, useRef, useEffect } from "react";
import { marked } from "marked";
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

// Configure marked with custom renderer
const renderer = new marked.Renderer();

// Links open in new tab
renderer.link = ({ href, text }) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="dao-md-link">${text}</a>`;
};

// Blockquotes with custom class
renderer.blockquote = ({ raw }) => {
  const innerHtml = marked.parse(raw.replace(/^>\s?/gm, "")) as string;
  return `<blockquote class="dao-blockquote">${innerHtml}</blockquote>`;
};

// Tables wrapped for horizontal scroll
renderer.table = ({ header, rows }) => {
  const headerHtml = `<tr>${header.map(h => `<th align="${h.align || ''}">${h.text}</th>`).join("")}</tr>`;
  const bodyHtml = rows.map(row =>
    `<tr>${row.map(cell => `<td align="${cell.align || ''}">${cell.text}</td>`).join("")}</tr>`
  ).join("");
  return `<div class="dao-table-wrap"><table><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`;
};

// Code blocks with syntax highlighting + copy button scaffold
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : "";
  let highlighted: string;
  try {
    highlighted = language
      ? hljs.highlight(text, { language }).value
      : hljs.highlightAuto(text).value;
  } catch {
    highlighted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return `<div class="dao-code-block group">
    <div class="dao-code-header">
      <span class="text-xs font-medium uppercase tracking-wider">${language || "code"}</span>
      <button class="dao-copy-btn flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-code="${encodeURIComponent(text)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Copy</span>
      </button>
    </div>
    <pre class="dao-code-pre"><code class="dao-code-content hljs">${highlighted}</code></pre>
  </div>`;
};

// Inline code
renderer.codespan = ({ text }) => {
  return `<code class="dao-inline-code">${text}</code>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
});

// DOMPurify config — strict allowlist prevents XSS via injected HTML
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
  // Explicitly forbid event handlers and dangerous tags
  FORBID_ATTR: [
    "onerror", "onload", "onclick", "onmouseover", "onfocus",
    "onblur", "onkeydown", "onkeyup", "onkeypress",
    "onchange", "oninput", "onsubmit", "onreset",
    "style",            // prevents CSS injection
  ],
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  // Only allow http/https URLs in href and src — blocks javascript: and data: URIs
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  // Ensure sanitized HTML is wrapped safely
  FORCE_BODY: true,
};

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
    const raw = marked.parse(content) as string;
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
