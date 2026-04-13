import { Sparkles, TrendingUp, BookOpen, Code, Lightbulb, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

export function SuggestedPrompts({ onSelect, className }: SuggestedPromptsProps) {
  const { t } = useTranslation();

  const prompts = [
    {
      icon: Sparkles,
      title: t('prompts.creative.title'),
      prompt: t('prompts.creative.text'),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: t('prompts.market.title'),
      prompt: t('prompts.market.text'),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BookOpen,
      title: t('prompts.research.title'),
      prompt: t('prompts.research.text'),
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Code,
      title: t('prompts.coding.title'),
      prompt: t('prompts.coding.text'),
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Lightbulb,
      title: t('prompts.problem.title'),
      prompt: t('prompts.problem.text'),
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: t('prompts.tech.title'),
      prompt: t('prompts.tech.text'),
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {prompts.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={() => onSelect(item.prompt)}
            className="group relative overflow-hidden rounded-xl bg-card border border-border p-6 text-left transition-all duration-200 hover:shadow-large hover:border-accent-foreground/20 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white transition-transform duration-200 group-hover:scale-110",
                item.gradient
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.prompt}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
