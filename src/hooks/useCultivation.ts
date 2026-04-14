import { useState, useEffect, useCallback } from "react";

export interface CultivationRealm {
  id: number;
  name: string;
  nameEn: string;
  minEP: number;
  color: string;
  description: string;
  descriptionEn: string;
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
  { id: 0, name: "凡人", nameEn: "Mortal", minEP: 0, color: "#9ca3af", description: "尚未修行，沉沦世俗", descriptionEn: "Mundane realm, worldly attachments" },
  { id: 1, name: "炼气", nameEn: "Qi Refining", minEP: 50, color: "#10b981", description: "初凝灵气，窥见天机", descriptionEn: "Gathering spiritual energy" },
  { id: 2, name: "筑基", nameEn: "Foundation", minEP: 200, color: "#3b82f6", description: "根基渐稳，心神清明", descriptionEn: "Establishing foundation" },
  { id: 3, name: "金丹", nameEn: "Golden Core", minEP: 600, color: "#f59e0b", description: "凝结金丹，内观自在", descriptionEn: "Forming the golden core" },
  { id: 4, name: "元婴", nameEn: "Nascent Soul", minEP: 1500, color: "#f97316", description: "元婴初成，神识出窍", descriptionEn: "Nascent soul emerges" },
  { id: 5, name: "化神", nameEn: "Spirit Transformation", minEP: 4000, color: "#a855f7", description: "神魂归一，道法自然", descriptionEn: "Spirit transforms, unity with Dao" },
  { id: 6, name: "合体", nameEn: "Integration", minEP: 12000, color: "#ec4899", description: "天人合一，万法归宗", descriptionEn: "Heaven and human unite" },
  { id: 7, name: "大乘", nameEn: "Mahayana", minEP: 40000, color: "#dc2626", description: "大道现前，众生皆度", descriptionEn: "Great vehicle, enlighten all beings" },
  { id: 8, name: "渡劫", nameEn: "Tribulation", minEP: 120000, color: "#6366f1", description: "历尽天劫，涅槃重生", descriptionEn: "Transcending tribulation" },
  { id: 9, name: "真仙", nameEn: "True Immortal", minEP: 360000, color: "#fbbf24", description: "超脱轮回，永恒不灭", descriptionEn: "Eternal, beyond reincarnation" },
];

const MOODS = [
  { id: "transparent", name: "通透", nameEn: "Transparent", points: 15, description: "心如明镜，万象皆空", descriptionEn: "Mind like mirror, all is empty" },
  { id: "tranquil", name: "宁静", nameEn: "Tranquil", points: 10, description: "静水流深，心无挂碍", descriptionEn: "Still water, no attachments" },
  { id: "ripple", name: "波动", nameEn: "Ripple", points: 5, description: "心有涟漪，不失根本", descriptionEn: "Mind ripples, foundation stable" },
  { id: "chaotic", name: "纷乱", nameEn: "Chaotic", points: 3, description: "心绪纷扰，需定慧观", descriptionEn: "Mind scattered, needs stillness" },
];

const STORAGE_KEY = "cultivation_state_v1";

function getInitialState(): CultivationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load cultivation state:", error);
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

function saveState(state: CultivationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save cultivation state:", error);
  }
}

export function useCultivation() {
  const [state, setState] = useState<CultivationState>(getInitialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const getCurrentRealm = useCallback((): CultivationRealm => {
    for (let i = REALMS.length - 1; i >= 0; i--) {
      if (state.enlightenmentPoints >= REALMS[i].minEP) {
        return REALMS[i];
      }
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
    const today = new Date().toDateString();
    return state.lastCheckInDate !== today;
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

  const checkIn = useCallback((
    mood: string,
    wuWeiScore: number,
    daoFieldActive: boolean,
    insight: string,
    aiGuidance: string
  ) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isConsecutive = state.lastCheckInDate === yesterday;
    
    const pointsEarned = calculatePoints(mood, wuWeiScore, daoFieldActive, insight.length);
    
    const newRecord: CheckInRecord = {
      date: today,
      mood,
      wuWeiScore,
      daoFieldActive,
      insight,
      pointsEarned,
      aiGuidance,
    };

    setState(prev => ({
      ...prev,
      enlightenmentPoints: prev.enlightenmentPoints + pointsEarned,
      checkInStreak: isConsecutive ? prev.checkInStreak + 1 : 1,
      totalCheckIns: prev.totalCheckIns + 1,
      lastCheckInDate: today,
      records: [newRecord, ...prev.records].slice(0, 100),
    }));

    return pointsEarned;
  }, [state.lastCheckInDate, calculatePoints]);

  const completeTutorial = useCallback(() => {
    const TUTORIAL_REWARD = 50;
    setState(prev => ({
      ...prev,
      tutorialCompleted: true,
      enlightenmentPoints: prev.enlightenmentPoints + TUTORIAL_REWARD,
    }));
    return TUTORIAL_REWARD;
  }, []);

  const getTutorialCompleted = useCallback((): boolean => {
    return state.tutorialCompleted === true;
  }, [state.tutorialCompleted]);

  return {
    state,
    realms: REALMS,
    moods: MOODS,
    getCurrentRealm,
    getNextRealm,
    canCheckInToday,
    checkIn,
    calculatePoints,
    completeTutorial,
    getTutorialCompleted,
  };
}
