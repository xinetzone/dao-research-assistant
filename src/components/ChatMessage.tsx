import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, User, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Message } from "@/hooks/useAIChat";

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
      "flex w-full gap-4 px-6 py-8 transition-colors",
      message.role === "user" ? "bg-background" : "bg-muted/30"
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        message.role === "user" 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-accent-foreground to-primary text-background"
      )}>
        {message.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        {isWaitingForContent && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-current animate-bounce"></div>
            </div>
            <span className="text-sm">{t('chat.thinking')}</span>
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
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap border border-border/50 font-mono leading-relaxed">
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
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
