import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Flame, FolderOpen, RotateCcw, X, BookOpen, ScrollText } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useCultivation } from "@/hooks/useCultivation";
import { cn } from "@/lib/utils";

interface NavigationSidebarProps {
  activeCollectionId: string | null;
  onDocPanelOpen: () => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationSidebar({
  activeCollectionId,
  onDocPanelOpen,
  onNewChat,
  isOpen,
  onClose,
}: NavigationSidebarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language === "zh-CN";
  const { getTutorialCompleted } = useCultivation();
  const tutorialCompleted = getTutorialCompleted();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50 transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent border border-foreground/20">
              <BookOpen className="h-4 w-4 text-foreground/70" />
            </div>
            <span className="font-semibold">{t("chat.header")}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={onNewChat}
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>{t("chat.newChat")}</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => {
              navigate("/cultivate");
              onClose();
            }}
          >
            <Flame className="h-4 w-4 shrink-0" />
            <span>{isZh ? "修行打卡" : "Cultivation"}</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => {
              navigate("/daodejing");
              onClose();
            }}
          >
            <ScrollText className="h-4 w-4 shrink-0" />
            <span>{isZh ? "帛书老子" : "Laozi"}</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 relative"
            onClick={() => {
              navigate("/cultivate?tutorial=true");
              onClose();
            }}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>{t("cultivation.guide")}</span>
            {!tutorialCompleted && (
              <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5">
                {t("cultivation.tutorialNew")}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 relative"
            onClick={onDocPanelOpen}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span>{t("chat.docs")}</span>
            {activeCollectionId && (
              <span className="absolute right-3 flex h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </aside>
    </>
  );
}
