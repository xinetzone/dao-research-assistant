import { useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import i18n from "@/i18n/config";
import { AI_CHAT_ENDPOINT, SUPABASE_ANON_KEY } from "@/config";
import { DAOYAN_SYSTEM_PROMPT, DAOYAN_SYSTEM_WITH_USER_DOCS } from "@/data/system-prompt";

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

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Stable ref to latest messages — lets sendMessage use [] deps without stale closure
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const loadMessages = useCallback((msgs: Message[]) => {
    messagesRef.current = msgs; // Sync ref so sendMessage reads correct history after loadMessages
    setMessages(msgs);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    model = "anthropic/claude-sonnet-4.5",
    documentContext?: string,
    enableWebSearch?: boolean,
    locale?: string,
    onComplete?: (userMessage: Message, assistantMessage: Message) => void
  ) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Timeout: 60s for web search or document context (large system prompt), 30s for normal
    const timeoutMs = (enableWebSearch || !!documentContext) ? 60000 : 30000;
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    const userMessage: Message = { role: "user", content };
    const assistantMessage: Message = { 
      role: "assistant", content: "", thinking: "", isStreaming: true 
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    const blocks = new Map<number, { type: string; content: string }>();
    let receivedContentData = false; // true only when actual text/thinking content arrives
    let errorHandled = false;        // true when catch block already sets error/cleans up
    let streamCompleted = false;     // true when message_stop received
    let searchResultsData: SearchResult[] | undefined;

    try {
      await fetchEventSource(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMessage].map(m => ({
            role: m.role, content: m.content,
          })),
          model,
          ...(documentContext
            ? { system: DAOYAN_SYSTEM_WITH_USER_DOCS(documentContext) }
            : { system: DAOYAN_SYSTEM_PROMPT }),
          ...(enableWebSearch ? { enable_web_search: true } : {}),
          ...(locale ? { locale } : {}),
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
              let block = blocks.get(data.index);
              // Fallback: auto-register block if content_block_start was missed
              if (!block && data.delta) {
                const inferredType = data.delta.type === "thinking_delta" ? "thinking" : "text";
                block = { type: inferredType, content: "" };
                blocks.set(data.index, block);
                console.warn(`[useAIChat] auto-created block ${data.index} as "${inferredType}" (missing content_block_start)`);
              }
              if (block?.type === "thinking") {
                block.content += data.delta.thinking || "";
                if (block.content) receivedContentData = true;
                setMessages(prev => updateLastAssistant(prev, { thinking: block.content }));
              } else if (block?.type === "text") {
                block.content += data.delta.text || "";
                if (block.content) receivedContentData = true;
                setMessages(prev => updateLastAssistant(prev, { content: block.content }));
              }
              break;
            }
            case "search_results": {
              searchResultsData = data.results;
              setMessages(prev => updateLastAssistant(prev, { sources: data.results }));
              break;
            }
            case "message_stop": {
              streamCompleted = true;
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
      errorHandled = true;  // catch block takes responsibility for error display + cleanup
      if (err instanceof Error && err.name === "AbortError") {
        // Timed out or user cancelled
        const isZh = i18n.language === "zh-CN";
        if (!receivedContentData) {
          // No actual content received (either nothing at all, or only SSE metadata like message_start)
          // Remove the empty assistant bubble and show a timeout error
          setError(isZh ? "请求超时，请稍后重试" : "Request timed out, please try again");
          setMessages(prev => prev.slice(0, -1));
        } else {
          // Partial content was received — keep what we have, just mark stream as done
          setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
        }
      } else if (err instanceof Error) {
        setError(err.message || "Failed to send message");
        setMessages(prev => prev.slice(0, -1));
      } else {
        // Non-Error thrown (e.g. plain object from fetchEventSource)
        const msg = typeof err === "string" ? err : (i18n.t("errors.api_error") || "Failed to send message");
        setError(msg);
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      clearTimeout(timeoutId);
      // Guard: handle the case where fetchEventSource resolved normally but no events arrived
      // (server closed SSE connection without sending data — e.g. transient edge-function error)
      // Also handle: stream closed mid-way without message_stop (partial stream)
      if (!receivedContentData) {
        // No content at all — remove the pending assistant bubble (updater is idempotent:
        // if catch already removed it, prev won't end with an isStreaming assistant)
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.isStreaming) return prev.slice(0, -1);
          return prev;
        });
        // Show an error only if catch block hasn't already shown one
        if (!errorHandled) {
          const isZh = i18n.language === "zh-CN";
          setError(isZh ? "响应中断，请稍后重试" : "Connection closed unexpectedly, please try again");
        }
      } else {
        // Content arrived but message_stop never fired (rare) — mark stream as done
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.isStreaming) {
            return updateLastAssistant(prev, { isStreaming: false });
          }
          return prev;
        });
      }
      setIsLoading(false);
      // Reliably call onComplete from local variables (not React state)
      // to avoid React 18 batching timing issues
      if (streamCompleted && receivedContentData && onComplete) {
        let finalContent = "";
        let finalThinking = "";
        for (const [, block] of blocks) {
          if (block.type === "text") finalContent += block.content;
          else if (block.type === "thinking") finalThinking += block.content;
        }
        onComplete(
          { role: "user", content },
          {
            role: "assistant",
            content: finalContent,
            thinking: finalThinking || undefined,
            sources: searchResultsData,
          }
        );
      }
    }
  }, []);  // empty deps — uses messagesRef.current for latest messages

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, cancel, clearMessages, loadMessages };
}

function updateLastAssistant(messages: Message[], updates: Partial<Message>): Message[] {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === "assistant") {
    updated[updated.length - 1] = { ...last, ...updates };
  }
  return updated;
}
