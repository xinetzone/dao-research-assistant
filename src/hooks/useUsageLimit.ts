import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionTier } from "@/data/models";
import { canAccessModel } from "@/data/models";

export interface UsageInfo {
  tier: SubscriptionTier;
  expiresAt: string | null;
  chatUsed: number;
  chatLimit: number;
  apiUsed: number;
  apiLimit: number;
}

const GUEST_STORAGE_KEY = "daoyan_guest_usage";
const GUEST_DAILY_LIMIT = 3;

function getGuestUsage(): { date: string; count: number } {
  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { date: "", count: 0 };
}

function incrementGuestUsage(): number {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getGuestUsage();
  const count = usage.date === today ? usage.count + 1 : 1;
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ date: today, count }));
  return count;
}

export function useUsageLimit(userId?: string) {
  const [usage, setUsage] = useState<UsageInfo>({
    tier: "free",
    expiresAt: null,
    chatUsed: 0,
    chatLimit: 10,
    apiUsed: 0,
    apiLimit: 100,
  });
  const [loading, setLoading] = useState(false);

  // Fetch usage from DB
  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_user_usage", { p_user_id: userId });
      if (!error && data) {
        const d = data as Record<string, unknown>;
        setUsage({
          tier: (d.tier as SubscriptionTier) || "free",
          expiresAt: (d.expires_at as string) || null,
          chatUsed: (d.chat_used as number) || 0,
          chatLimit: (d.chat_limit as number) || 10,
          apiUsed: (d.api_used as number) || 0,
          apiLimit: (d.api_limit as number) || 100,
        });
      }
    } catch (err) {
      console.error("[useUsageLimit] refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const canChat = useCallback((isGuest: boolean): boolean => {
    if (isGuest) {
      const today = new Date().toISOString().slice(0, 10);
      const guest = getGuestUsage();
      return guest.date !== today || guest.count < GUEST_DAILY_LIMIT;
    }
    return usage.chatUsed < usage.chatLimit;
  }, [usage]);

  const canUseModel = useCallback((modelRequiredTier: SubscriptionTier): boolean => {
    return canAccessModel(usage.tier, modelRequiredTier);
  }, [usage.tier]);

  const getRemainingChats = useCallback((isGuest: boolean): number => {
    if (isGuest) {
      const today = new Date().toISOString().slice(0, 10);
      const guest = getGuestUsage();
      const used = guest.date === today ? guest.count : 0;
      return Math.max(0, GUEST_DAILY_LIMIT - used);
    }
    return Math.max(0, usage.chatLimit - usage.chatUsed);
  }, [usage]);

  // Called after a successful chat (optimistic update)
  const recordChatUsage = useCallback((isGuest: boolean) => {
    if (isGuest) {
      incrementGuestUsage();
      return;
    }
    setUsage(prev => ({ ...prev, chatUsed: prev.chatUsed + 1 }));
  }, []);

  return { usage, loading, canChat, canUseModel, getRemainingChats, recordChatUsage, refresh };
}
