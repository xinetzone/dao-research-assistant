import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SearchBar } from "@/components/SearchBar";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { ChatMessage } from "@/components/ChatMessage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAIChat } from "@/hooks/useAIChat";
import { Sparkles, RotateCcw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SUPABASE_URL = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5uaHJoN2NoN2oyOTQwIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYwNzQ1MjMsImV4cCI6MjA5MTY1MDUyM30.5GFdUIA3rHOUoCI99ocBzBxDZjjQxOHRV-T6CKiHzCQ";

export default function Index() {
  const { t } = useTranslation();
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat(SUPABASE_URL, SUPABASE_ANON_KEY);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (query: string) => {
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }
    sendMessage(query);
  };

  const handleReset = () => {
    clearMessages();
    setHasStartedChat(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {!hasStartedChat ? (
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
          <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>
          
          <div className="w-full max-w-4xl space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-foreground to-primary text-background mb-4 shadow-large">
                <Sparkles className="h-8 w-8" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('landing.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('landing.subtitle')}
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SearchBar onSubmit={handleSubmit} isLoading={isLoading} placeholder={t('landing.searchPlaceholder')} variant="landing" />
            </div>

            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">
                {t('landing.tryPrompts')}
              </h2>
              <SuggestedPrompts onSelect={handleSubmit} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-foreground to-primary text-background">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h1 className="text-lg font-semibold">{t('chat.header')}</h1>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('chat.newChat')}</span>
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="px-6 py-4">
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
            <div className="max-w-4xl mx-auto px-6 py-4">
              <SearchBar onSubmit={handleSubmit} isLoading={isLoading} placeholder={t('chat.searchPlaceholder')} variant="chat" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
