import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2, Globe, FolderOpen, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "@/config";

interface SearchBarProps {
  onSubmit: (query: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  placeholder: string;
  variant?: "landing" | "chat";
  webSearchEnabled?: boolean;
  onWebSearchToggle?: () => void;
  onDocPanelOpen?: () => void;
  activeCollectionId?: string | null;
}

export function SearchBar({
  onSubmit,
  onCancel,
  isLoading,
  placeholder,
  variant = "landing",
  webSearchEnabled,
  onWebSearchToggle,
  onDocPanelOpen,
  activeCollectionId,
}: SearchBarProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const minRows = variant === "landing" ? 3 : 1;
    const maxRows = 6;
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${newHeight}px`;
  }, [query, variant]);

  const isOverLimit = query.length > MAX_MESSAGE_LENGTH;

  const handleSubmit = () => {
    if (query.trim() && !isLoading && !isOverLimit) {
      onSubmit(query.trim());
      setQuery("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      "w-full",
      variant === "landing"
        ? "bg-card border-2 border-foreground/15 rounded-md p-1 shadow-sm"
        : "border-2 border-foreground/20 rounded bg-card p-1",
    )}>
      <textarea
        ref={textareaRef}
        id="dao-search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={variant === "landing" ? 3 : 1}
        className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed px-4 py-3 text-base overflow-y-auto"
        style={{ minHeight: variant === "landing" ? "72px" : "24px" }}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-dashed border-border">
        <div className="flex items-center gap-2">
          {onWebSearchToggle && (
            <button
              type="button"
              onClick={onWebSearchToggle}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border",
                webSearchEnabled
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:border-border",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{isZh ? "联网" : "Web"}</span>
              {webSearchEnabled && (
                <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
                  ON
                </span>
              )}
            </button>
          )}

          {onDocPanelOpen && (
            <button
              type="button"
              onClick={onDocPanelOpen}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border",
                activeCollectionId
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:border-border",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>{t("chat.docs")}</span>
              {activeCollectionId && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          )}
        </div>

        {/* Character counter (shows when >80% of limit) */}
        {query.length > MAX_MESSAGE_LENGTH * 0.8 && (
          <span className={cn(
            "text-[11px] tabular-nums mr-2 transition-colors",
            isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground"
          )}>
            {query.length}/{MAX_MESSAGE_LENGTH}
          </span>
        )}

        {/* Send / Stop button */}
        {isLoading && onCancel ? (
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95"
            title={isZh ? "停止生成" : "Stop generating"}
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading || isOverLimit}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded transition-all",
              query.trim() && !isLoading && !isOverLimit
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
