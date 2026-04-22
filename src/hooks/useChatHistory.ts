import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "./useAIChat";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Type cast for new tables not yet reflected in auto-generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useChatHistory(userId?: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // ── Load all sessions for current user ──────────────────────────────────
  const loadSessions = useCallback(async () => {
    if (!userId) { setSessions([]); return; }
    const { data } = await db
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(60);
    setSessions(data || []);
  }, [userId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Create a new session and return its id ───────────────────────────────
  const createSession = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!userId) return null;
    const title = firstMessage.trim().slice(0, 60) || "新对话";
    const { data, error } = await db
      .from("chat_sessions")
      .insert({ user_id: userId, title })
      .select("id, title, created_at, updated_at")
      .single();
    if (error || !data) return null;
    setSessions(prev => [data, ...prev]);
    return data.id as string;
  }, [userId]);

  // ── Append one message to a session ──────────────────────────────────────
  const appendMessage = useCallback(async (sessionId: string, message: Message) => {
    if (!sessionId) return;
    const now = new Date().toISOString();
    await db.from("chat_messages").insert({
      session_id: sessionId,
      role:        message.role,
      content:     message.content,
      thinking:    message.thinking  || null,
      sources:     message.sources   ?? null,
    });
    // Bubble session to top
    await db.from("chat_sessions").update({ updated_at: now }).eq("id", sessionId);
    setSessions(prev =>
      [...prev.map(s => s.id === sessionId ? { ...s, updated_at: now } : s)]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    );
  }, []);

  // ── Load all messages for a session ──────────────────────────────────────
  const loadSessionMessages = useCallback(async (sessionId: string): Promise<Message[]> => {
    const { data } = await db
      .from("chat_messages")
      .select("role, content, thinking, sources")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (!data) return [];
    return (data as Array<{
      role: string; content: string; thinking: string | null; sources: unknown;
    }>).map(row => ({
      role:     row.role as "user" | "assistant",
      content:  row.content,
      thinking: row.thinking  || undefined,
      sources:  row.sources as Message["sources"] | undefined,
    }));
  }, []);

  // ── Rename a session ─────────────────────────────────────────────────────
  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    const title = newTitle.trim().slice(0, 60);
    if (!title) return;
    await db.from("chat_sessions").update({ title }).eq("id", sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  }, []);

  // ── Delete a session (cascades to messages via FK) ───────────────────────
  const deleteSession = useCallback(async (sessionId: string) => {
    await db.from("chat_sessions").delete().eq("id", sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  return {
    sessions,
    loadSessions,
    createSession,
    appendMessage,
    loadSessionMessages,
    deleteSession,
    renameSession,
  };
}
