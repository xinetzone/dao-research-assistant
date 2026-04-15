import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronRight, User, Sparkles,
  Globe, ExternalLink, Copy, CheckCheck, RotateCcw,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { Message, SearchResult } from "@/hooks/useAIChat";

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  webSearchEnabled?: boolean;
  onRegenerate?: () => void;
}

function SourceCard({ source }: { source: SearchResult }) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const domain = getDomain(source.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group"
    >
      <img
        src={faviconUrl}
        alt=""
        className="h-4 w-4 rounded-sm shrink-0 mt-0.5 opacity-80"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors flex-1">
            {source.title}
          </h4>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{domain}</p>
      </div>
    </a>
  );
}

export function ChatMessage({ message, isLast, webSearchEnabled, onRegenerate }: ChatMessageProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const [showThinking, setShowThinking] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (message.content && message.thinking) {
      setShowThinking(false);
    }
  }, [message.content, message.thinking]);

  const isWaitingForContent = message.isStreaming && !message.thinking && !message.content;
  const isSearching = isWaitingForContent && webSearchEnabled;

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = message.content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn(
      "flex w-full gap-3 sm:gap-4 px-4 sm:px-6 py-6 sm:py-8 transition-colors group/message",
      message.role === "user" ? "bg-background" : "bg-muted/30"
    )}>
      <div className={cn(
        "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg",
        message.role === "user"
          ? "bg-primary text-primary-foreground"
          : "bg-accent border border-foreground/20"
      )}>
        {message.role === "user"
          ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          : <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        }
      </div>

      <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
        {/* Waiting indicator */}
        {isWaitingForContent && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {isSearching ? (
              <>
                <Search className="h-3.5 w-3.5 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm">
                  {isZh ? "正在联网搜索..." : "Searching the web..."}
                </span>
              </>
            ) : (
              <>
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current animate-bounce" />
                </div>
                <span className="text-xs sm:text-sm">{t('chat.thinking')}</span>
              </>
            )}
          </div>
        )}

        {/* Thinking block */}
        {message.thinking && (
          <div className="space-y-2">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              {showThinking
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronRight className="h-3.5 w-3.5" />
              }
              <span>{t('chat.thinkingProcess')}</span>
            </button>

            {showThinking && (
              <div className="p-3 sm:p-4 bg-muted/50 rounded-lg text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap border border-border/50 font-mono leading-relaxed overflow-x-auto">
                {message.thinking}
                {message.isStreaming && !message.content && (
                  <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {message.content && (
          <div className="max-w-none">
            {message.role === "user" ? (
              <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base break-words">
                {message.content}
              </div>
            ) : (
              <MarkdownRenderer content={message.content} className="text-sm sm:text-base" />
            )}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-0.5" />
            )}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {t("webSearch.sources")} ({message.sources.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.map((source, idx) => (
                <SourceCard key={idx} source={source} />
              ))}
            </div>
          </div>
        )}

        {/* Action buttons — only for assistant messages that are done streaming */}
        {message.role === "assistant" && message.content && !message.isStreaming && (
          <div className="flex items-center gap-1 pt-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all"
              title={isZh ? "复制" : "Copy"}
            >
              {copied
                ? <CheckCheck className="h-3.5 w-3.5 text-primary" />
                : <Copy className="h-3.5 w-3.5" />
              }
              <span>{copied ? (isZh ? "已复制" : "Copied") : (isZh ? "复制" : "Copy")}</span>
            </button>

            {isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all"
                title={isZh ? "重新生成" : "Regenerate"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isZh ? "重新生成" : "Regenerate"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
