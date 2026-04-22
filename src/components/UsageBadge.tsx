import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageBadgeProps {
  used: number;
  limit: number;
  onClick?: () => void;
  className?: string;
}

export function UsageBadge({ used, limit, onClick, className }: UsageBadgeProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const remaining = Math.max(0, limit - used);
  const isUnlimited = limit >= 999999;
  const ratio = isUnlimited ? 0 : used / limit;

  const colorClass = ratio >= 1
    ? "text-destructive border-destructive/30 bg-destructive/5"
    : ratio >= 0.8
    ? "text-orange-500 border-orange-300/30 bg-orange-500/5"
    : "text-muted-foreground border-border bg-transparent";

  if (isUnlimited) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-xs font-medium transition-colors hover:bg-muted/50",
        colorClass,
        className
      )}
      title={isZh ? `今日剩余 ${remaining} 次对话` : `${remaining} chats remaining today`}
    >
      <Zap className="h-3 w-3" />
      <span>{used}/{limit}</span>
    </button>
  );
}
