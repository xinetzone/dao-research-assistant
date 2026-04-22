import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Flame, FolderOpen, RotateCcw, X, ScrollText, BookOpen,
  LogIn, LogOut, User, Trash2, MessageSquare, Pencil, Code2, KeyRound, Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "./AuthModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import type { ChatSession } from "@/hooks/useChatHistory";

interface NavigationSidebarProps {
  activeCollectionId: string | null;
  onDocPanelOpen: () => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  // Chat history
  sessions?: ChatSession[];
  currentSessionId?: string | null;
  onSessionSelect?: (id: string) => void;
  onSessionDelete?: (id: string) => void;
  onSessionRename?: (id: string, newTitle: string) => void;
}

/** Group sessions by relative date */
function groupByDate(sessions: ChatSession[], isZh: boolean) {
  const now   = Date.now();
  const DAY   = 86_400_000;
  const groups: { label: string; items: ChatSession[] }[] = [];
  const labels: Record<string, ChatSession[]> = {};

  for (const s of sessions) {
    const diff  = now - new Date(s.updated_at).getTime();
    const label = diff < DAY
      ? (isZh ? "今天" : "Today")
      : diff < 2 * DAY
        ? (isZh ? "昨天" : "Yesterday")
        : diff < 7 * DAY
          ? (isZh ? "本周" : "This week")
          : (isZh ? "更早" : "Earlier");
    if (!labels[label]) { labels[label] = []; groups.push({ label, items: labels[label] }); }
    labels[label].push(s);
  }
  return groups;
}

export function NavigationSidebar({
  activeCollectionId,
  onDocPanelOpen,
  onNewChat,
  isOpen,
  onClose,
  onOpen,
  sessions = [],
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
}: NavigationSidebarProps) {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const isZh        = i18n.language === "zh-CN";
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false));
  }, [user]);
  // Inline rename state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Touch gesture: swipe-right-from-edge to open, swipe-left to close ───
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (dy > Math.abs(dx) * 0.9) return;
      const target = e.target as Element;
      if (target.closest("input, textarea, select, button")) return;
      if (!isOpen && dx > 55 && touchStartX.current <= 50) onOpen?.();
      if ( isOpen && dx < -55) onClose();
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend",   handleTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend",   handleTouchEnd);
    };
  }, [isOpen, onOpen, onClose]);

  const sessionGroups = user ? groupByDate(sessions, isZh) : [];

  // ── Inline rename helpers ─────────────────────────────────────────────────
  const startEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };
  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };
  const saveEditing = () => {
    if (editingSessionId && editingTitle.trim()) {
      onSessionRename?.(editingSessionId, editingTitle.trim());
    }
    cancelEditing();
  };

  // Auto-focus the rename input when it appears
  useEffect(() => {
    if (editingSessionId) {
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  }, [editingSessionId]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50",
        "flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent border border-foreground/20">
              <BookOpen className="h-4 w-4 text-foreground/70" />
            </div>
            <span className="font-semibold">{t("chat.header")}</span>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onClose}
            aria-label={isZh ? "关闭侧边栏" : "Close menu"}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main scrollable area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* New Chat */}
          <div className="p-3 pb-1 shrink-0">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11"
              onClick={() => { onNewChat(); onClose(); }}>
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>{t("chat.newChat")}</span>
            </Button>
          </div>

          {/* ── Chat History ── */}
          {user ? (
            sessions.length > 0 ? (
              <div className="flex-1 overflow-y-auto px-3 pb-1 min-h-0">
                {sessionGroups.map(group => (
                  <div key={group.label} className="mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider px-2 pt-2 pb-1">
                      {group.label}
                    </p>
                    {group.items.map(session => (
                      <div
                        key={session.id}
                        className="relative group"
                      >
                        {editingSessionId === session.id ? (
                          /* ── Inline rename mode ── */
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <input
                              ref={editInputRef}
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter")  { e.preventDefault(); saveEditing(); }
                                if (e.key === "Escape") { e.preventDefault(); cancelEditing(); }
                              }}
                              onBlur={saveEditing}
                              className="flex-1 min-w-0 bg-transparent text-xs text-foreground border-b border-primary outline-none py-0.5 pr-1"
                              maxLength={60}
                            />
                          </div>
                        ) : (
                          /* ── Normal mode ── */
                          <button
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
                              "text-xs text-foreground/80 hover:bg-accent/60 transition-colors",
                              "pr-16", // space for two action buttons
                              currentSessionId === session.id && "bg-accent text-foreground font-medium"
                            )}
                            onClick={() => { onSessionSelect?.(session.id); onClose(); }}
                          >
                            <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{session.title}</span>
                          </button>
                        )}

                        {/* Action buttons: rename + delete — visible on hover */}
                        {editingSessionId !== session.id && (
                          <div className="absolute right-0.5 top-0.5 flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={e => { e.stopPropagation(); startEditing(session); }}
                              title={isZh ? "重命名" : "Rename"}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={e => { e.stopPropagation(); onSessionDelete?.(session.id); }}
                              title={isZh ? "删除对话" : "Delete"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-3 shrink-0">
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  {isZh ? "历史对话将显示在此处" : "Your conversations will appear here"}
                </p>
              </div>
            )
          ) : (
            <div className="px-5 py-3 shrink-0">
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                {isZh ? "登录后可查看历史对话" : "Sign in to see chat history"}
              </p>
            </div>
          )}

          {/* ── Bottom nav items ── */}
          <nav className="shrink-0 p-3 pt-2 space-y-1 border-t border-border/50">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11"
              onClick={() => { navigate("/cultivate"); onClose(); }}>
              <Flame className="h-4 w-4 shrink-0" />
              <span>{isZh ? "修行打卡" : "Cultivation"}</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-3 h-11"
              onClick={() => { navigate("/daodejing"); onClose(); }}>
              <ScrollText className="h-4 w-4 shrink-0" />
              <span>{isZh ? "帛书老子" : "Laozi"}</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-3 h-11 relative"
              onClick={() => { onDocPanelOpen(); onClose(); }}>
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span>{t("chat.docs")}</span>
              {activeCollectionId && (
                <span className="absolute right-3 flex h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-3 h-11"
              onClick={() => { navigate("/api-docs"); onClose(); }}>
              <Code2 className="h-4 w-4 shrink-0" />
              <span>{isZh ? "API & MCP" : "API & MCP"}</span>
            </Button>

            {isAdmin && (
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-primary"
                onClick={() => { navigate("/admin"); onClose(); }}>
                <Shield className="h-4 w-4 shrink-0" />
                <span>{isZh ? "管理后台" : "Admin"}</span>
              </Button>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-1 shrink-0">
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
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => { navigate("/profile"); onClose(); }}
                title={isZh ? "我的主页" : "My Profile"}>
                <User className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setChangePwOpen(true)}
                title={isZh ? "修改密码" : "Change Password"}>
                <KeyRound className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={signOut}
                title={isZh ? "退出登录" : "Sign out"}>
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full justify-start gap-3 h-9 mb-1"
              onClick={() => setAuthOpen(true)}>
              <LogIn className="h-4 w-4 shrink-0" />
              <span className="text-sm">{isZh ? "登录 / 注册" : "Sign In"}</span>
            </Button>
          )}
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </aside>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <ChangePasswordModal open={changePwOpen} onOpenChange={setChangePwOpen} />
    </>
  );
}
