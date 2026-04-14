import { useState, KeyboardEvent } from "react";
import { Send, Loader2, Globe, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSubmit: (query: string) => void;
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

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery("");
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
      isLoading && "opacity-60"
    )}>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={variant === "landing" ? 3 : 1}
        className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed px-4 py-3 text-base"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-dashed border-border">
        <div className="flex items-center gap-2">
          {onWebSearchToggle && (
            <button
              type="button"
              onClick={onWebSearchToggle}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border",
                webSearchEnabled
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
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
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border",
                activeCollectionId
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
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

        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded transition-all",
            query.trim() && !isLoading
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
      </div>
    </div>
  );
}
