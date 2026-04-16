import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SearchBar } from "@/components/SearchBar";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { ChatMessage } from "@/components/ChatMessage";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DocumentPanel } from "@/components/DocumentPanel";
import { SEO } from "@/components/SEO";
import { useAIChat } from "@/hooks/useAIChat";
import { useDocumentCollections } from "@/hooks/useDocumentCollections";
import { BookOpen, AlertCircle, CheckCircle2, Globe, Menu, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { initTheme } from "@/lib/theme";


// Apply saved theme on first load
initTheme();

export default function Index() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const { messages, isLoading, error, sendMessage, cancel, clearMessages } = useAIChat();
  const { collections, getCollectionContext } = useDocumentCollections();
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
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
    if (!hasStartedChat) setHasStartedChat(true);
    let docContext: string | undefined;
    if (activeCollectionId) {
      docContext = await getCollectionContext(activeCollectionId);
    }
    sendMessage(query, "anthropic/claude-sonnet-4.5", docContext, webSearchEnabled, i18n.language);
  }, [hasStartedChat, activeCollectionId, getCollectionContext, sendMessage, webSearchEnabled, i18n.language]);

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
      <div className="flex h-[100dvh] overflow-hidden bg-background">
      <NavigationSidebar
        activeCollectionId={activeCollectionId}
        onDocPanelOpen={() => setDocPanelOpen(true)}
        onNewChat={handleReset}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
              {/* Hero Card */}
              <div className="dao-card dao-tape px-6 sm:px-10 py-8 sm:py-10 text-center space-y-4">
                {/* Avatar */}
                <div className="inline-flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent to-secondary border-2 border-foreground/20">
                  <BookOpen className="h-9 w-9 sm:h-10 sm:w-10 text-foreground/70" />
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-wider">
                  {t("landing.title")}
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t("landing.subtitle")}
                </p>

                {/* Status badges */}
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
