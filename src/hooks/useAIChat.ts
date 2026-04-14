import { useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import i18n from "@/i18n/config";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  sources?: SearchResult[];
  isStreaming?: boolean;
}

function getUserErrorMessage(code: string, backendMessage: string): string {
  if (backendMessage) {
    return backendMessage;
  }
  const key = `errors.${code}`;
  const translated = i18n.t(key);
  return translated !== key ? translated : i18n.t('errors.api_error');
}

/** Fatal error class to prevent fetchEventSource from retrying */
class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalError";
  }
}

export function useAIChat(supabaseUrl: string, supabaseAnonKey: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    model = "anthropic/claude-sonnet-4.5",
    documentContext?: string,
    enableWebSearch?: boolean
  ) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Timeout: 60s for web search, 30s for normal
    const timeoutMs = enableWebSearch ? 60000 : 30000;
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    const userMessage: Message = { role: "user", content };
    const assistantMessage: Message = { 
      role: "assistant", content: "", thinking: "", isStreaming: true 
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    const blocks = new Map<number, { type: string; content: string }>();
    let receivedAnyData = false;

    try {
      await fetchEventSource(`${supabaseUrl}/functions/v1/ai-chat-167c2bc1450e`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role, content: m.content,
          })),
          model,
          ...(documentContext ? { system: `You are a helpful research assistant. The user has provided the following reference documents to help answer their questions. Use this information as context when responding:\n\n${documentContext}` } : {}),
          ...(enableWebSearch ? { enable_web_search: true } : {}),
        }),
        signal: abortController.signal,
        openWhenHidden: true,
        
        async onopen(response) {
          const contentType = response.headers.get("content-type");
          
          if (!response.ok) {
            if (contentType?.includes("text/event-stream")) {
              const text = await response.text();
              const dataMatch = text.match(/data: (.+)/);
              if (dataMatch) {
                try {
                  const errorData = JSON.parse(dataMatch[1]);
                  if (errorData.type === "error" && errorData.error?.message) {
                    throw new FatalError(errorData.error.message);
                  }
                } catch (parseError) {
                  if (parseError instanceof FatalError) throw parseError;
                }
              }
            }
            
            if (contentType?.includes("application/json")) {
              const errorData = await response.json();
              throw new FatalError(errorData.error?.message || errorData.error || `Request failed: ${response.status}`);
            }
            
            throw new FatalError(`Request failed: ${response.status}`);
          }
          
          if (!contentType?.includes("text/event-stream")) {
            throw new FatalError(`Expected text/event-stream, got: ${contentType}`);
          }
        },
        
        onmessage(event) {
          if (!event.data) return;
          receivedAnyData = true;

          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            return; // skip unparseable events (e.g. nexus_usage)
          }
          
          if (data.type === "error") {
            const errorMsg = getUserErrorMessage(
              data.error?.type || "api_error",
              data.error?.message || "Service error"
            );
            setError(errorMsg);
            setMessages(prev => prev.slice(0, -1));
            setIsLoading(false);
            return;
          }
          
          switch (data.type) {
            case "content_block_start": {
              blocks.set(data.index, { type: data.content_block.type, content: "" });
              break;
            }
            case "content_block_delta": {
              const block = blocks.get(data.index);
              if (block?.type === "thinking") {
                block.content += data.delta.thinking || "";
                setMessages(prev => updateLastAssistant(prev, { thinking: block.content }));
              } else if (block?.type === "text") {
                block.content += data.delta.text || "";
                setMessages(prev => updateLastAssistant(prev, { content: block.content }));
              }
              break;
            }
            case "search_results": {
              setMessages(prev => updateLastAssistant(prev, { sources: data.results }));
              break;
            }
            case "message_stop": {
              setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
              break;
            }
          }
        },
        onerror(err) {
          // Always throw FatalError to prevent auto-retry
          if (err instanceof FatalError) throw err;
          throw new FatalError(err?.message || "Connection lost");
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Timed out or user cancelled
        if (!receivedAnyData) {
          const isZh = i18n.language === "zh-CN";
          setError(isZh ? "请求超时，请稍后重试" : "Request timed out, please try again");
          setMessages(prev => prev.slice(0, -1));
        } else {
          // Partial data received, just mark stream as done
          setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
        }
      } else if (err instanceof Error) {
        setError(err.message || "Failed to send message");
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [messages, supabaseUrl, supabaseAnonKey]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, cancel, clearMessages };
}

function updateLastAssistant(messages: Message[], updates: Partial<Message>): Message[] {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === "assistant") {
    Object.assign(last, updates);
  }
  return updated;
}
