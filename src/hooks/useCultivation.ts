import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionTier } from "@/data/models";

export interface CultivationRealm {
  id: number;
  name: string;
  nameEn: string;
  minEP: number;
  color: string;
  description: string;
  descriptionEn: string;
  requiredTier: SubscriptionTier;
}

export interface CheckInRecord {
  date: string;
  mood: string;
  wuWeiScore: number;
  daoFieldActive: boolean;
  insight: string;
  pointsEarned: number;
  aiGuidance: string;
}

export interface CultivationState {
  enlightenmentPoints: number;
  checkInStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  records: CheckInRecord[];
  tutorialCompleted?: boolean;
}

const REALMS: CultivationRealm[] = [
  { id: 0, name: "凡人", nameEn: "Mortal", minEP: 0, color: "#9ca3af", description: "尚未修行，沉沦世俗", descriptionEn: "Mundane realm, worldly attachments", requiredTier: "free" },
  { id: 1, name: "炼气", nameEn: "Qi Refining", minEP: 50, color: "#10b981", description: "初凝灵气，窥见天机", descriptionEn: "Gathering spiritual energy", requiredTier: "free" },
  { id: 2, name: "筑基", nameEn: "Foundation", minEP: 200, color: "#3b82f6", description: "根基渐稳，心神清明", descriptionEn: "Establishing foundation", requiredTier: "daoyou" },
  { id: 3, name: "金丹", nameEn: "Golden Core", minEP: 600, color: "#f59e0b", description: "凝结金丹，内观自在", descriptionEn: "Forming the golden core", requiredTier: "daoyou" },
  { id: 4, name: "元婴", nameEn: "Nascent Soul", minEP: 1500, color: "#f97316", description: "元婴初成，神识出窍", descriptionEn: "Nascent soul emerges", requiredTier: "daoyou" },
  { id: 5, name: "化神", nameEn: "Spirit Transformation", minEP: 4000, color: "#a855f7", description: "神魂归一，道法自然", descriptionEn: "Spirit transforms, unity with Dao", requiredTier: "daoyou" },
  { id: 6, name: "合体", nameEn: "Integration", minEP: 12000, color: "#ec4899", description: "天人合一，万法归宗", descriptionEn: "Heaven and human unite", requiredTier: "daoyou" },
  { id: 7, name: "大乘", nameEn: "Mahayana", minEP: 40000, color: "#dc2626", description: "大道现前，众生皆度", descriptionEn: "Great vehicle, enlighten all beings", requiredTier: "daoyou" },
  { id: 8, name: "渡劫", nameEn: "Tribulation", minEP: 120000, color: "#6366f1", description: "历尽天劫，涅槃重生", descriptionEn: "Transcending tribulation", requiredTier: "daoyou" },
  { id: 9, name: "真仙", nameEn: "True Immortal", minEP: 360000, color: "#fbbf24", description: "超脱轮回，永恒不灭", descriptionEn: "Eternal, beyond reincarnation", requiredTier: "daoyou" },
];

const MOODS = [
  { id: "transparent", name: "通透", nameEn: "Transparent", points: 15, description: "心如明镜，万象皆空", descriptionEn: "Mind like mirror, all is empty" },
  { id: "tranquil", name: "宁静", nameEn: "Tranquil", points: 10, description: "静水流深，心无挂碍", descriptionEn: "Still water, no attachments" },
  { id: "ripple", name: "波动", nameEn: "Ripple", points: 5, description: "心有涟漪，不失根本", descriptionEn: "Mind ripples, foundation stable" },
  { id: "chaotic", name: "纷乱", nameEn: "Chaotic", points: 3, description: "心绪纷扰，需定慧观", descriptionEn: "Mind scattered, needs stillness" },
];

const STORAGE_KEY = "cultivation_state_v1";

function getLocalState(): CultivationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return {
    enlightenmentPoints: 0,
    checkInStreak: 0,
    totalCheckIns: 0,
    lastCheckInDate: null,
    records: [],
    tutorialCompleted: false,
  };
}

function saveLocalState(state: CultivationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

type DBProfile = {
  enlightenment_points: number;
  check_in_streak: number;
  total_check_ins: number;
  last_check_in_date: string | null;
  tutorial_completed: boolean;
};

type DBRecord = {
  date: string;
  mood: string;
  wu_wei_score: number;
  dao_field_active: boolean;
  insight: string;
  points_earned: number;
  ai_guidance: string;
};

function mapDBToState(profile: DBProfile, records: DBRecord[]): CultivationState {
  return {
    enlightenmentPoints: profile.enlightenment_points,
    checkInStreak: profile.check_in_streak,
    totalCheckIns: profile.total_check_ins,
    lastCheckInDate: profile.last_check_in_date,
    tutorialCompleted: profile.tutorial_completed,
    records: records.map(r => ({
      date: r.date,
      mood: r.mood,
      wuWeiScore: r.wu_wei_score,
      daoFieldActive: r.dao_field_active,
      insight: r.insight,
      pointsEarned: r.points_earned,
      aiGuidance: r.ai_guidance,
    })),
  };
}

export function useCultivation(userId?: string) {
  const [state, setState] = useState<CultivationState>(getLocalState);
  const [isSyncing, setIsSyncing] = useState(false);
  const loadedForUser = useRef<string | null>(null);

  // --- DB load + optional migration ---
  useEffect(() => {
    if (!userId || loadedForUser.current === userId) return;

    async function loadFromDB() {
      setIsSyncing(true);
      try {
        const [profileRes, recordsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
          supabase.from("cultivation_records")
            .select("*")
            .eq("user_id", userId!)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

        const profile = profileRes.data as DBProfile | null;
        const records = (recordsRes.data ?? []) as DBRecord[];

        // Migrate localStorage → DB if DB is empty
        if (profile && profile.total_check_ins === 0 && records.length === 0) {
          const local = getLocalState();
          if (local.totalCheckIns > 0) {
            await migrateLocalToDB(userId!, local, profile);
            loadedForUser.current = userId!;
            return; // migrateLocalToDB calls loadFromDB again internally
          }
        }

        if (profile) setState(mapDBToState(profile, records));
        loadedForUser.current = userId!;
      } catch (err) {
        console.error("Failed to load cultivation from DB:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    async function migrateLocalToDB(uid: string, local: CultivationState, profile: DBProfile) {
      try {
        // Batch insert records (most recent first, up to 100)
        if (local.records.length > 0) {
          const rows = local.records.map(r => ({
            user_id: uid,
            date: r.date,
            mood: r.mood,
            wu_wei_score: r.wuWeiScore,
            dao_field_active: r.daoFieldActive,
            insight: r.insight,
            points_earned: r.pointsEarned,
            ai_guidance: r.aiGuidance,
          }));
          await supabase.from("cultivation_records").insert(rows);
        }
        // Update profile with local stats
        await supabase.from("profiles").update({
          enlightenment_points: local.enlightenmentPoints,
          check_in_streak: local.checkInStreak,
          total_check_ins: local.totalCheckIns,
          last_check_in_date: local.lastCheckInDate,
          tutorial_completed: local.tutorialCompleted ?? false,
        }).eq("id", uid);

        // Set state directly from local (avoid extra DB round-trip)
        setState(local);
        loadedForUser.current = uid;
      } catch (err) {
        console.error("Migration failed:", err);
        // Fallback: use local state
        setState(local);
      } finally {
        setIsSyncing(false);
      }
    }

    loadFromDB();
  }, [userId]);

  // --- Always persist to localStorage as offline cache (even when logged in) ---
  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  // --- Realm helpers ---
  const getCurrentRealm = useCallback((): CultivationRealm => {
    for (let i = REALMS.length - 1; i >= 0; i--) {
      if (state.enlightenmentPoints >= REALMS[i].minEP) return REALMS[i];
    }
    return REALMS[0];
  }, [state.enlightenmentPoints]);

  const getNextRealm = useCallback((): CultivationRealm | null => {
    const current = getCurrentRealm();
    const nextIndex = current.id + 1;
    return nextIndex < REALMS.length ? REALMS[nextIndex] : null;
  }, [getCurrentRealm]);

  const canCheckInToday = useCallback((): boolean => {
    if (!state.lastCheckInDate) return true;
    return state.lastCheckInDate !== new Date().toDateString();
  }, [state.lastCheckInDate]);

  const calculatePoints = useCallback((
    mood: string,
    wuWeiScore: number,
    daoFieldActive: boolean,
    insightLength: number
  ): number => {
    const basePoints = 10;
    const moodBonus = MOODS.find(m => m.id === mood)?.points || 0;
    const wuWeiBonus = wuWeiScore * 4;
    const daoFieldBonus = daoFieldActive ? 10 : 0;
    const insightBonus = insightLength > 20 ? 8 : insightLength > 5 ? 4 : 0;
    const streakBonus = Math.min(state.checkInStreak * 2, 20);
    return basePoints + moodBonus + wuWeiBonus + daoFieldBonus + insightBonus + streakBonus;
  }, [state.checkInStreak]);

  const checkIn = useCallback(async (
    mood: string,
    wuWeiScore: number,
    daoFieldActive: boolean,
    insight: string,
    aiGuidance: string
  ): Promise<number> => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isConsecutive = state.lastCheckInDate === yesterday;
    const pointsEarned = calculatePoints(mood, wuWeiScore, daoFieldActive, insight.length);

    const newRecord: CheckInRecord = {
      date: today, mood, wuWeiScore, daoFieldActive, insight, pointsEarned, aiGuidance,
    };

    let newEP = 0, newStreak = 0, newTotal = 0;
    setState(prev => {
      newEP = prev.enlightenmentPoints + pointsEarned;
      newStreak = isConsecutive ? prev.checkInStreak + 1 : 1;
      newTotal = prev.totalCheckIns + 1;
      return {
        ...prev,
        enlightenmentPoints: newEP,
        checkInStreak: newStreak,
        totalCheckIns: newTotal,
        lastCheckInDate: today,
        records: [newRecord, ...prev.records].slice(0, 100),
      };
    });

    if (userId) {
      try {
        await supabase.from("cultivation_records").insert({
          user_id: userId, date: today, mood,
          wu_wei_score: wuWeiScore, dao_field_active: daoFieldActive,
          insight, points_earned: pointsEarned, ai_guidance: aiGuidance,
        });
        await supabase.from("profiles").update({
          enlightenment_points: newEP,
          check_in_streak: newStreak,
          total_check_ins: newTotal,
          last_check_in_date: today,
        }).eq("id", userId);
      } catch (err) {
        console.error("Failed to sync check-in to DB:", err);
      }
    }

    return pointsEarned;
  }, [state.lastCheckInDate, calculatePoints, userId]);

  const completeTutorial = useCallback(async (): Promise<number> => {
    const TUTORIAL_REWARD = 50;
    let newEP = 0;
    setState(prev => {
      newEP = prev.enlightenmentPoints + TUTORIAL_REWARD;
      return { ...prev, tutorialCompleted: true, enlightenmentPoints: newEP };
    });

    if (userId) {
      try {
        await supabase.from("profiles").update({
          tutorial_completed: true,
          enlightenment_points: newEP,
        }).eq("id", userId);
      } catch (err) {
        console.error("Failed to sync tutorial completion to DB:", err);
      }
    }

    return TUTORIAL_REWARD;
  }, [userId]);

  const getTutorialCompleted = useCallback((): boolean => {
    return state.tutorialCompleted === true;
  }, [state.tutorialCompleted]);

  return {
    state,
    isSyncing,
    realms: REALMS,
    moods: MOODS,
    getCurrentRealm,
    getNextRealm,
    canCheckInToday,
    checkIn,
    calculatePoints,
    completeTutorial,
    getTutorialCompleted,
    getMaxRealmForTier,
  };
}

/** Get the highest realm a tier can reach */
function getMaxRealmForTier(tier: SubscriptionTier): CultivationRealm {
  const TIER_LEVEL: Record<SubscriptionTier, number> = { free: 0, daoyou: 1, wudao: 2 };
  const userLevel = TIER_LEVEL[tier];
  let maxRealm = REALMS[0];
  for (const realm of REALMS) {
    if (TIER_LEVEL[realm.requiredTier] <= userLevel) {
      maxRealm = realm;
    }
  }
  return maxRealm;
}
