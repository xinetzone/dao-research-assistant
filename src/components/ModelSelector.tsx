import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { MODEL_OPTIONS, TIER_NAMES, canAccessModel, type ModelOption, type SubscriptionTier } from "@/data/models";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  userTier?: SubscriptionTier;
  onUpgradeClick?: () => void;
}

export function ModelSelector({ selectedModelId, onModelChange, disabled, userTier = "free", onUpgradeClick }: ModelSelectorProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = MODEL_OPTIONS.find(m => m.id === selectedModelId) ?? MODEL_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border",
          "text-muted-foreground hover:text-foreground border-transparent hover:border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isZh ? selected.nameZh : selected.name}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 w-64 rounded-md border-2 border-foreground/15 bg-card shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="p-1.5">
            {MODEL_OPTIONS.map((model: ModelOption) => {
              const locked = !canAccessModel(userTier, model.requiredTier);
              const tierLabel = TIER_NAMES[model.requiredTier];

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    if (locked) {
                      onUpgradeClick?.();
                      setOpen(false);
                    } else {
                      onModelChange(model.id);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors",
                    locked
                      ? "opacity-60 hover:bg-muted/50"
                      : model.id === selectedModelId
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      {isZh ? model.nameZh : model.name}
                      {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {isZh ? model.descriptionZh : model.description}
                    </span>
                  </div>
                  {model.requiredTier !== "free" && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium shrink-0"
                      style={{
                        backgroundColor: model.requiredTier === "wudao" ? "#a855f720" : "#f59e0b20",
                        color: model.requiredTier === "wudao" ? "#a855f7" : "#f59e0b",
                      }}
                    >
                      {isZh ? tierLabel.zh : tierLabel.en}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
