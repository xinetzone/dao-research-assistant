import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SearchBar } from "@/components/SearchBar";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { ChatMessage } from "@/components/ChatMessage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DocumentPanel } from "@/components/DocumentPanel";
import { useAIChat } from "@/hooks/useAIChat";
import { useDocumentCollections } from "@/hooks/useDocumentCollections";
import { Sparkles, RotateCcw, AlertCircle, FolderOpen, CheckCircle2, Flame, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const SUPABASE_URL = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5uaHJoN2NoN2oyOTQwIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYwNzQ1MjMsImV4cCI6MjA5MTY1MDUyM30.5GFdUIA3rHOUoCI99ocBzBxDZjjQxOHRV-T6CKiHzCQ";

export default function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language === "zh-CN";
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { collections, getCollectionContext } = useDocumentCollections();
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activeCollectionName = collections.find(c => c.id === activeCollectionId)?.name;

  const handleSubmit = useCallback(async (query: string) => {
    if (!hasStartedChat) setHasStartedChat(true);
    let docContext: string | undefined;
    if (activeCollectionId) {
      docContext = await getCollectionContext(activeCollectionId);
    }
    sendMessage(query, "anthropic/claude-sonnet-4.5", docContext, webSearchEnabled);
  }, [hasStartedChat, activeCollectionId, getCollectionContext, sendMessage, webSearchEnabled]);

  const handleReset = () => {
    clearMessages();
    setHasStartedChat(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {!hasStartedChat ? (
        <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-20 sm:py-12">
          <div className="absolute top-20 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-50">
            <button
              onClick={() => navigate("/cultivate")}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-border/40 hover:border-border shadow-sm hover:shadow min-h-[36px] sm:min-h-[40px]"
              title={isZh ? "今天你用心了嘛？" : "Cultivation Practice"}
            >
              <Flame className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">{isZh ? "修行" : "Cultivate"}</span>
            </button>
            <button
              onClick={() => setDocPanelOpen(true)}
              className="relative flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-border/40 hover:border-border shadow-sm hover:shadow min-h-[36px] sm:min-h-[40px]"
              title={t("chat.docs")}
            >
              <FolderOpen className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">{t("chat.docs")}</span>
              {activeCollectionId && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
              )}
            </button>
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all border shadow-sm hover:shadow min-h-[36px] sm:min-h-[40px]"
              style={{
                color: webSearchEnabled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                backgroundColor: webSearchEnabled ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                borderColor: webSearchEnabled ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border) / 0.4)'
              }}
              title={t("webSearch.enableAutoSearch")}
            >
              <Globe className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">{t("webSearch.title")}</span>
            </button>
            <LanguageSwitcher />
          </div>

          <div className="w-full max-w-4xl space-y-8 sm:space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-3 sm:space-y-4 pt-4 sm:pt-0">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-accent-foreground to-primary text-background mb-2 sm:mb-4 shadow-large">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent px-2">
                {t('landing.title')}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
                {t('landing.subtitle')}
              </p>
            </div>

            {activeCollectionId && activeCollectionName && (
              <div className="flex justify-center px-4">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{t("docs.contextActive", { name: activeCollectionName })}</span>
                </div>
              </div>
            )}

            {webSearchEnabled && (
              <div className="flex justify-center px-4">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm text-primary">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t("webSearch.enableAutoSearch")}</span>
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto w-full">
              <SearchBar onSubmit={handleSubmit} isLoading={isLoading} placeholder={t('landing.searchPlaceholder')} variant="landing" />
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center px-4">
                {t('landing.tryPrompts')}
              </h2>
              <SuggestedPrompts onSelect={handleSubmit} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-foreground to-primary text-background shrink-0">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <h1 className="text-base sm:text-lg font-semibold truncate">{t('chat.header')}</h1>
                {activeCollectionId && activeCollectionName && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{activeCollectionName}</span>
                  </div>
                )}
                {webSearchEnabled && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                    <Globe className="h-3 w-3" />
                    <span>{isZh ? "联网" : "Web"}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate("/cultivate")}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-transparent hover:border-border/40 min-h-[32px] sm:min-h-[36px]"
                  title={isZh ? "修行打卡" : "Cultivation"}
                >
                  <Flame className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
                  <span className="hidden lg:inline whitespace-nowrap">{isZh ? "修行" : "Cultivate"}</span>
                </button>
                <button
                  onClick={() => setDocPanelOpen(true)}
                  className="relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-transparent hover:border-border/40 min-h-[32px] sm:min-h-[36px]"
                  title={t("chat.docs")}
                >
                  <FolderOpen className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
                  <span className="hidden lg:inline whitespace-nowrap">{t("chat.docs")}</span>
                  {activeCollectionId && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </button>
                <button
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-all border min-h-[32px] sm:min-h-[36px]"
                  style={{
                    color: webSearchEnabled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    backgroundColor: webSearchEnabled ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    borderColor: webSearchEnabled ? 'hsl(var(--primary) / 0.5)' : 'transparent'
                  }}
                  title={t("webSearch.enableAutoSearch")}
                >
                  <Globe className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
                  <span className="hidden lg:inline whitespace-nowrap">{t("webSearch.enableAutoSearch")}</span>
                </button>
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-transparent hover:border-border/40 min-h-[32px] sm:min-h-[36px]"
                  title={t('chat.newChat')}
                >
                  <RotateCcw className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" />
                  <span className="hidden lg:inline whitespace-nowrap">{t('chat.newChat')}</span>
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-0">
              {error && (
                <div className="px-2 sm:px-6 py-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 pb-safe">
              <SearchBar onSubmit={handleSubmit} isLoading={isLoading} placeholder={t('chat.searchPlaceholder')} variant="chat" />
            </div>
          </div>
        </div>
      )}

      <DocumentPanel
        open={docPanelOpen}
        onOpenChange={setDocPanelOpen}
        activeCollectionId={activeCollectionId}
        onSelectCollection={setActiveCollectionId}
      />
    </div>
  );
}
