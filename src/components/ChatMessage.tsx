import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, User, Sparkles, Globe, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Message, SearchResult } from "@/hooks/useAIChat";

interface ChatMessageProps {
  message: Message;
}

function SourceCard({ source }: { source: SearchResult }) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 p-2.5 sm:p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group"
    >
      <div className="flex items-start gap-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {source.title}
            </h4>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{getDomain(source.url)}</p>
        </div>
      </div>
      {source.snippet && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-5 sm:pl-6">
          {source.snippet}
        </p>
      )}
    </a>
  );
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation();
  const [showThinking, setShowThinking] = useState(true);

  useEffect(() => {
    if (message.content && message.thinking) {
      setShowThinking(false);
    }
  }, [message.content, message.thinking]);

  const isWaitingForContent = message.isStreaming && !message.thinking && !message.content;

  return (
    <div className={cn(
      "flex w-full gap-3 sm:gap-4 px-4 sm:px-6 py-6 sm:py-8 transition-colors",
      message.role === "user" ? "bg-background" : "bg-muted/30"
    )}>
      <div className={cn(
        "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg",
        message.role === "user" 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-accent-foreground to-primary text-background"
      )}>
        {message.role === "user" ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      </div>

      <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
        {isWaitingForContent && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-current animate-bounce"></div>
            </div>
            <span className="text-xs sm:text-sm">{t('chat.thinking')}</span>
          </div>
        )}

        {message.thinking && (
          <div className="space-y-2">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              {showThinking ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
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

        {message.content && (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-accent-foreground prose-a:no-underline hover:prose-a:underline">
            <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base break-words">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
