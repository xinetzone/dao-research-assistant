import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

export function SuggestedPrompts({ onSelect, className }: SuggestedPromptsProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";

  const tags = isZh
    ? ["原文解读", "版本对比", "思想阐发", "生活应用"]
    : ["Original Text", "Versions", "Philosophy", "Application"];

  const questions = [
    t("prompts.creative.text"),
    t("prompts.market.text"),
    t("prompts.research.text"),
    t("prompts.coding.text"),
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Feature Tags */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {tags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onSelect(questions[index])}
            className="dao-tag"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Suggested Questions - 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2">
        {questions.map((q, index) => (
          <button
            key={index}
            onClick={() => onSelect(q)}
            className="dao-question text-xs sm:text-sm text-left"
          >
            <span className="line-clamp-1">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
