import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Flame, FolderOpen, RotateCcw, X, ScrollText, BookOpen, LogIn, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";

interface NavigationSidebarProps {
  activeCollectionId: string | null;
  onDocPanelOpen: () => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export function NavigationSidebar({
  activeCollectionId,
  onDocPanelOpen,
  onNewChat,
  isOpen,
  onClose,
  onOpen,
}: NavigationSidebarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language === "zh-CN";
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // ── Touch gesture: swipe-right-from-edge to open, swipe-left to close ──
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - touchStartX.current;
      const dy = Math.abs(endY - touchStartY.current);

      // Ignore if swipe is more vertical than horizontal (user is scrolling)
      if (dy > Math.abs(dx) * 0.9) return;

      // Ignore if the touch target is an input/textarea
      const target = e.target as Element;
      if (target.closest("input, textarea, select, button")) return;

      // Swipe right from left edge (≤50px) → open
      if (!isOpen && dx > 55 && touchStartX.current <= 50) {
        onOpen?.();
      }

      // Swipe left (while sidebar open) → close
      if (isOpen && dx < -55) {
        onClose();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, onOpen, onClose]);

  return (
    <>
      {/* Overlay — always in DOM, fades in/out via opacity for smooth transition */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50",
          "flex flex-col transition-transform duration-300 ease-in-out",
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
            aria-label={isZh ? "关闭侧边栏" : "Close menu"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => { onNewChat(); onClose(); }}
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
            onClick={() => { onDocPanelOpen(); onClose(); }}
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
          {/* User section */}
          {user ? (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md mb-1">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => { navigate("/profile"); onClose(); }}
                title={isZh ? "我的主页" : "My Profile"}
              >
                <User className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={signOut}
                title={isZh ? "退出登录" : "Sign out"}
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-9 mb-1"
              onClick={() => setAuthOpen(true)}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span className="text-sm">{isZh ? "登录 / 注册" : "Sign In"}</span>
            </Button>
          )}
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </aside>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
