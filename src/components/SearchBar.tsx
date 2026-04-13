import { useState, KeyboardEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  placeholder: string;
  variant?: "landing" | "chat";
}

export function SearchBar({ onSubmit, isLoading, placeholder, variant = "landing" }: SearchBarProps) {
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
      "relative w-full rounded-xl bg-background border transition-all duration-200",
      variant === "landing" ? "shadow-large border-border/50 hover:border-border" : "shadow-soft border-border",
      isLoading && "opacity-50"
    )}>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={variant === "landing" ? 1 : 1}
        className={cn(
          "w-full resize-none bg-transparent px-6 py-4 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed",
          variant === "landing" ? "text-lg" : "text-base"
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={!query.trim() || isLoading}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
          query.trim() && !isLoading
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
