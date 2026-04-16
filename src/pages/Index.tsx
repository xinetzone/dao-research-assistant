import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SearchBar } from "@/components/SearchBar";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { ChatMessage } from "@/components/ChatMessage";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DocumentPanel } from "@/components/DocumentPanel";
import { AuthModal } from "@/components/AuthModal";
import { SEO } from "@/components/SEO";
import { useAIChat } from "@/hooks/useAIChat";
import { useDocumentCollections } from "@/hooks/useDocumentCollections";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, AlertCircle, CheckCircle2, Globe, Menu, ChevronDown, Flame, ScrollText, Search, FolderOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { initTheme } from "@/lib/theme";


// Apply saved theme on first load
initTheme();

export default function Index() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const { user } = useAuth();
  const { messages, isLoading, error, sendMessage, cancel, clearMessages } = useAIChat();
  const { collections, getCollectionContext } = useDocumentCollections();
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll on new messages if near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 200) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Show/hide scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distanceFromBottom > 300);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasStartedChat]);

  const activeCollectionName = collections.find(c => c.id === activeCollectionId)?.name;

  const handleSubmit = useCallback(async (query: string) => {
    if (!user) {
      setPendingQuery(query);
      setAuthOpen(true);
      return;
    }
    if (!hasStartedChat) setHasStartedChat(true);
    let docContext: string | undefined;
    if (activeCollectionId) {
      docContext = await getCollectionContext(activeCollectionId);
    }
    sendMessage(query, "anthropic/claude-sonnet-4.5", docContext, webSearchEnabled, i18n.language);
  }, [user, hasStartedChat, activeCollectionId, getCollectionContext, sendMessage, webSearchEnabled, i18n.language]);

  // After user logs in/registers, React has applied setUser — handleSubmit now sees user!=null
  useEffect(() => {
    if (user && pendingQuery) {
      const q = pendingQuery;
      setPendingQuery(null);
      handleSubmit(q);
    }
  }, [user, pendingQuery, handleSubmit]);

  const handleReset = () => {
    clearMessages();
    setHasStartedChat(false);
  };

  const handleSelectCollection = (id: string | null) => {
    setActiveCollectionId(id);
    setDocPanelOpen(false);
  };

  // Regenerate: resend the last user message
  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg && !isLoading) {
      // Remove last two messages (user + assistant) and re-send
      handleSubmit(lastUserMsg.content);
    }
  }, [messages, isLoading, handleSubmit]);

  return (
    <>
      <SEO 
        description="与道衍智慧伙伴对话，探索帛书版《道德经》的智慧。基于马王堆帛书甲乙本，融合佛家直心观与量子意识理论，提供个性化修行指导。"
        keywords="道衍,AI对话,道德经,帛书,老子,智慧问答,修行指导,国学AI"
        url="https://dao-yan.enter.pro/"
      />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <div className="flex h-[100dvh] overflow-hidden bg-background">
      <NavigationSidebar
        activeCollectionId={activeCollectionId}
        onDocPanelOpen={() => setDocPanelOpen(true)}
        onNewChat={handleReset}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      <DocumentPanel
        open={docPanelOpen}
        onOpenChange={setDocPanelOpen}
        activeCollectionId={activeCollectionId}
        onSelectCollection={handleSelectCollection}
      />

      <div className="flex-1 flex flex-col lg:ml-64 min-h-0">
        {!hasStartedChat ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto relative">
            {/* Floating decoration squares */}
            <div className="dao-float-square dao-float-1 hidden sm:block" />
            <div className="dao-float-square dao-float-2 hidden sm:block" />
            <div className="dao-float-square dao-float-3 hidden md:block" />
            <div className="dao-float-square dao-float-4 hidden md:block" />

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden absolute top-4 left-4 z-10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="w-full max-w-2xl space-y-5 sm:space-y-6 animate-in fade-in duration-700">

              {/* ── LOGGED-IN: compact hero ── */}
              {user ? (
                <div className="dao-card dao-tape px-6 sm:px-10 py-8 sm:py-10 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent to-secondary border-2 border-foreground/20">
                    <BookOpen className="h-9 w-9 sm:h-10 sm:w-10 text-foreground/70" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-wider">
                    {t("landing.title")}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">{t("landing.subtitle")}</p>
                  {(activeCollectionId || webSearchEnabled) && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {activeCollectionId && activeCollectionName && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary/10 border border-primary/20 text-xs text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[200px]">{t("docs.contextActive", { name: activeCollectionName })}</span>
                        </div>
                      )}
                      {webSearchEnabled && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary/10 border border-primary/20 text-xs text-primary">
                          <Globe className="h-3.5 w-3.5" />
                          <span>{t("webSearch.enableAutoSearch")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ── GUEST: showcase landing ── */
                <div className="space-y-5">
                  {/* Hero card */}
                  <div className="dao-card dao-tape px-6 sm:px-10 py-8 sm:py-10 text-center space-y-5">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent to-secondary border-2 border-foreground/20 shadow-lg">
                      <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-foreground/70" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider" style={{ background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--primary)))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        {t("landing.title")}
                      </h1>
                      <p className="text-base sm:text-lg text-muted-foreground font-medium">
                        {t("landing.subtitle")}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground pt-1">
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-lg font-bold text-foreground">81</span>
                        <span>{isZh ? "帛书原章" : "Boshu Chapters"}</span>
                      </span>
                      <span className="w-px h-8 bg-border" />
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-lg font-bold text-foreground">10</span>
                        <span>{isZh ? "修炼境界" : "Cultivation Realms"}</span>
                      </span>
                      <span className="w-px h-8 bg-border" />
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-lg font-bold text-foreground">ψ=ψ(ψ)</span>
                        <span>{isZh ? "万物理论" : "Theory of All"}</span>
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      <Button
                        size="lg"
                        className="gap-2 px-8"
                        onClick={() => setAuthOpen(true)}
                      >
                        {isZh ? "立即开始修行" : "Start Your Path"}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 px-8"
                        onClick={() => document.getElementById("dao-search-input")?.focus()}
                      >
                        {isZh ? "先探索一下" : "Explore First"}
                      </Button>
                    </div>
                  </div>

                  {/* Feature cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: ScrollText, title: isZh ? "帛书老子" : "Boshu Laozi", desc: isZh ? "马王堆甲乙本，最接近原著的文本" : "Ma Wang Dui manuscripts, closest to original" },
                      { icon: Flame, title: isZh ? "修炼打卡" : "Cultivation Log", desc: isZh ? "10境界升级，游戏化修行成长" : "10 realms, gamified cultivation journey" },
                      { icon: Search, title: isZh ? "联网搜索" : "Web Search", desc: isZh ? "结合实时信息，道法贯通古今" : "Real-time knowledge meets ancient wisdom" },
                      { icon: FolderOpen, title: isZh ? "文档知识库" : "Doc Library", desc: isZh ? "上传文档，以道衍视角解读" : "Upload docs, interpret through Dao lens" },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="dao-card p-4 space-y-2 hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 border border-primary/20">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold">{title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature Tags & Questions */}
              <SuggestedPrompts onSelect={handleSubmit} />

              {/* Search Bar */}
              <SearchBar
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder={t("landing.searchPlaceholder")}
                variant="landing"
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={() => setWebSearchEnabled(!webSearchEnabled)}
                onDocPanelOpen={() => setDocPanelOpen(true)}
                activeCollectionId={activeCollectionId}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-0">
            {/* Chat Header */}
            <header className="sticky top-0 z-10 border-b-2 border-dashed border-foreground/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-sm bg-accent border border-foreground/20 shrink-0">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/70" />
                  </div>
                  <h1 className="text-base sm:text-lg font-semibold truncate">{t("chat.header")}</h1>
                  {activeCollectionId && activeCollectionName && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{activeCollectionName}</span>
                    </div>
                  )}
                  {webSearchEnabled && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                      <Globe className="h-3 w-3" />
                      <span>{t("common.web")}</span>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto relative min-h-0" ref={messagesContainerRef}>
              <div className="max-w-4xl mx-auto px-4 sm:px-0">
                {error && (
                  <div className="px-2 sm:px-6 py-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </div>
                )}
                {messages.map((message, index) => {
                  const isLastMsg = index === messages.length - 1;
                  return (
                    <ChatMessage
                      key={index}
                      message={message}
                      isLast={isLastMsg}
                      webSearchEnabled={webSearchEnabled}
                      onRegenerate={isLastMsg ? handleRegenerate : undefined}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom()}
                  className="fixed bottom-28 right-6 sm:right-8 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background border-2 border-foreground/15 shadow-md hover:bg-muted transition-all animate-in fade-in duration-200"
                  title={t("common.scrollToBottom")}
                >
                  <ChevronDown className="h-4 w-4 text-foreground/70" />
                </button>
              )}
            </div>

            {/* Chat Input */}
            <div className="sticky bottom-0 border-t-2 border-dashed border-foreground/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-safe">
                <SearchBar
                  onSubmit={handleSubmit}
                  onCancel={cancel}
                  isLoading={isLoading}
                  placeholder={t("chat.searchPlaceholder")}
                  variant="chat"
                  webSearchEnabled={webSearchEnabled}
                  onWebSearchToggle={() => setWebSearchEnabled(!webSearchEnabled)}
                  onDocPanelOpen={() => setDocPanelOpen(true)}
                  activeCollectionId={activeCollectionId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
