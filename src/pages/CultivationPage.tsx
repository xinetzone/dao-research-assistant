import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCultivation } from "@/hooks/useCultivation";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  ArrowLeft, Flame, Star, Calendar, TrendingUp,
  ChevronRight, Sparkles, Loader2, BookOpen, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { AI_CHAT_ENDPOINT, SUPABASE_ANON_KEY } from "@/config";

/** Fatal error to stop fetchEventSource auto-retry */
class FatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalError";
  }
}

type SubView = "home" | "checkin" | "result" | "records" | "tutorial";
type ActiveTab = "checkin" | "guide";

export default function CultivationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    state, moods, realms, getCurrentRealm, getNextRealm,
    canCheckInToday, checkIn, completeTutorial, getTutorialCompleted,
  } = useCultivation();

  const [activeTab, setActiveTab] = useState<ActiveTab>("checkin");
  const [view, setView] = useState<SubView>("home");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState("");
  const [wuWeiScore, setWuWeiScore] = useState(0);
  const [daoFieldActive, setDaoFieldActive] = useState(false);
  const [insight, setInsight] = useState("");
  const [aiGuidance, setAiGuidance] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [previousRealm, setPreviousRealm] = useState(getCurrentRealm().id);
  const [fromTutorial, setFromTutorial] = useState(false);

  const currentRealm = getCurrentRealm();
  const nextRealm = getNextRealm();
  const canCheckIn = canCheckInToday();
  const isZh = i18n.language === "zh-CN";

  const TUTORIAL_STEPS = [
    { icon: "sparkles", title: t("cultivation.tutorial.welcome"), content: t("cultivation.tutorial.welcomeContent") },
    { icon: "flame", title: t("cultivation.tutorial.realms"), content: t("cultivation.tutorial.realmsContent"), showRealms: true },
    { icon: "star", title: t("cultivation.tutorial.moods"), content: t("cultivation.tutorial.moodsContent"), showMoods: true },
    { icon: "checkin", title: t("cultivation.tutorial.firstCheckIn"), content: t("cultivation.tutorial.firstCheckInContent"), action: "startCheckIn" },
    { icon: "award", title: t("cultivation.tutorial.gift"), content: t("cultivation.tutorial.giftContent"), showReward: true, rewardPoints: 50 },
  ];

  const currentTutorialStep = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[0];
  const progressPercent = nextRealm
    ? ((state.enlightenmentPoints - currentRealm.minEP) / (nextRealm.minEP - currentRealm.minEP)) * 100
    : 100;

  useEffect(() => {
    if (searchParams.get("tutorial") === "true" && !getTutorialCompleted()) {
      setView("tutorial");
      setTutorialStep(0);
      setSearchParams({});
    }
  }, [searchParams, getTutorialCompleted, setSearchParams]);

  const handleCheckInStart = () => {
    setSelectedMood("");
    setWuWeiScore(0);
    setDaoFieldActive(false);
    setInsight("");
    setView("checkin");
  };

  const handleSubmitCheckIn = useCallback(async () => {
    if (!selectedMood) return;
    setIsLoadingAI(true);
    setPreviousRealm(currentRealm.id);

    const moodInfo = moods.find((m) => m.id === selectedMood);
    const prompt = `今日修行：心境${isZh ? moodInfo?.name : moodInfo?.nameEn}，无为指数${wuWeiScore}/5，道场感应${daoFieldActive ? "开启" : "未开"}。心言：${insight || "无"}`;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    try {
      let fullGuidance = "";
      await fetchEventSource(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "anthropic/claude-sonnet-4.5",
          locale: i18n.language,
          system: `你是道衍，一位通晓帛书版《道德经》、佛家「直心如如不动」以及ψ=ψ(ψ)万物理论的智慧镜子。请映照修行者的今日状态，给予：
1. 帛书道德经原文引用（一句）
2. 佛家直心观的点评
3. 从ψ=ψ(ψ)万物理论（崩塌动力学、意识自显）的宇宙视角启发

回应需在200字内，语言古雅诗意，蕴含深刻启迪。${isZh ? "" : "Please respond in English with poetic wisdom."}`,
        }),
        signal: abortController.signal,
        openWhenHidden: true,
        async onopen(response) {
          if (!response.ok) throw new FatalError(`Request failed: ${response.status}`);
        },
        onmessage(event) {
          if (!event.data) return;
          let data;
          try { data = JSON.parse(event.data); } catch { return; }
          if (data.type === "content_block_delta" && data.delta?.text) {
            fullGuidance += data.delta.text;
          }
        },
        onerror(err) {
          if (err instanceof FatalError) throw err;
          throw new FatalError(err?.message || "Connection lost");
        },
      });

      clearTimeout(timeoutId);
      const points = checkIn(selectedMood, wuWeiScore, daoFieldActive, insight, fullGuidance);
      setEarnedPoints(points);
      setAiGuidance(fullGuidance);
      if (fromTutorial) { setView("tutorial"); setTutorialStep(4); setFromTutorial(false); }
      else setView("result");
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("AI guidance failed:", error);
      const fallback = isZh
        ? "道可道，非恒道。心若止水，万物自明。量子纠缠，亦如因果轮回。持之以恒，终见本源。"
        : "The Dao that can be told is not the eternal Dao. A still mind reflects all. Quantum entanglement mirrors karmic cycles. Persist, and you shall see the source.";
      const points = checkIn(selectedMood, wuWeiScore, daoFieldActive, insight, fallback);
      setEarnedPoints(points);
      setAiGuidance(fallback);
      if (fromTutorial) { setView("tutorial"); setTutorialStep(4); setFromTutorial(false); }
      else setView("result");
    } finally {
      setIsLoadingAI(false);
    }
  }, [selectedMood, wuWeiScore, daoFieldActive, insight, checkIn, currentRealm.id, moods, isZh, fromTutorial, i18n.language]);

  const hasLeveledUp = getCurrentRealm().id > previousRealm;

  const handleTutorialNext = () => {
    if (tutorialStep === 3) { setFromTutorial(true); handleCheckInStart(); }
    else if (tutorialStep === 4) { completeTutorial(); setView("home"); }
    else if (tutorialStep < TUTORIAL_STEPS.length - 1) setTutorialStep(tutorialStep + 1);
  };

  const iconMap: Record<string, React.ReactNode> = {
    sparkles: <Sparkles className="h-10 w-10" />,
    flame: <Flame className="h-10 w-10" />,
    star: <Star className="h-10 w-10" />,
    checkin: <BookOpen className="h-10 w-10" />,
    award: <Award className="h-10 w-10" />,
  };

  // Whether to show back-to-home in header (inside checkin sub-views)
  const showSubViewBack = view === "checkin" || view === "result" || view === "records";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-12">
        {/* Floating decoration */}
        <div className="dao-float-square dao-float-1 hidden sm:block" />
        <div className="dao-float-square dao-float-2 hidden sm:block" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showSubViewBack) { setView("home"); }
              else navigate("/");
            }}
            className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showSubViewBack ? (isZh ? "主界面" : "Home") : (isZh ? "返回" : "Back")}
            </span>
          </Button>
          <h1 className="text-base sm:text-lg font-bold tracking-wider text-center flex-1 mx-2">
            {isZh ? "今天你用心了嘛？" : "Did You Cultivate Today?"}
          </h1>
          <div className="w-16" />
        </div>

        {/* ========== TAB BAR (shown when not in sub-views) ========== */}
        {!showSubViewBack && view !== "tutorial" && (
          <div className="flex rounded-xl border border-border bg-muted/40 p-1 mb-6 gap-1">
            {(["checkin", "guide"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={
                  activeTab === tab
                    ? {
                        background: `linear-gradient(135deg, ${currentRealm.color}cc, ${currentRealm.color}88)`,
                        color: "#fff",
                        boxShadow: `0 2px 8px ${currentRealm.color}30`,
                      }
                    : { color: "hsl(var(--muted-foreground))" }
                }
              >
                {tab === "checkin"
                  ? (isZh ? "修行打卡" : "Check-In")
                  : (isZh ? "修炼指南" : "Guide")}
              </button>
            ))}
          </div>
        )}

        {/* ========== TUTORIAL VIEW (triggered by URL param) ========== */}
        {view === "tutorial" && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex justify-center gap-2">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: idx === tutorialStep ? 32 : 8,
                    backgroundColor: idx <= tutorialStep ? currentRealm.color : "hsl(var(--border))",
                    opacity: idx <= tutorialStep ? 1 : 0.5,
                  }}
                />
              ))}
            </div>

            <div className="cult-card-glow p-6 sm:p-8 space-y-6">
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                  style={{
                    borderColor: `${currentRealm.color}30`,
                    background: `radial-gradient(circle, ${currentRealm.color}15, transparent)`,
                    color: currentRealm.color,
                  }}
                >
                  {iconMap[currentTutorialStep.icon] || <Sparkles className="h-10 w-10" />}
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-center">{currentTutorialStep.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-center text-sm px-2">
                {currentTutorialStep.content}
              </p>

              {currentTutorialStep.showRealms && (
                <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {realms.map((realm) => (
                    <div key={realm.id} className="cult-mood-card" style={{ borderColor: `${realm.color}25` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Flame className="h-4 w-4" style={{ color: realm.color }} />
                        <span className="font-bold text-sm" style={{ color: realm.color }}>
                          {isZh ? realm.name : realm.nameEn}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{isZh ? realm.description : realm.descriptionEn}</div>
                      <div className="text-[11px] text-muted-foreground/60 mt-1">{realm.minEP.toLocaleString()} EP</div>
                    </div>
                  ))}
                </div>
              )}

              {currentTutorialStep.showMoods && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {moods.map((mood) => (
                    <div key={mood.id} className="cult-mood-card">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4" style={{ color: currentRealm.color }} />
                        <span className="font-bold text-sm">{isZh ? mood.name : mood.nameEn}</span>
                        <span className="ml-auto text-[11px] font-medium" style={{ color: currentRealm.color }}>
                          +{mood.points}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{isZh ? mood.description : mood.descriptionEn}</div>
                    </div>
                  ))}
                </div>
              )}

              {currentTutorialStep.showReward && (
                <div className="text-center space-y-4 py-4">
                  <div className="text-5xl font-bold animate-in zoom-in duration-500 tabular-nums" style={{ color: currentRealm.color }}>
                    +{currentTutorialStep.rewardPoints}
                  </div>
                  <div className="text-base text-muted-foreground">
                    {t("cultivation.tutorial.pointsGifted", { points: currentTutorialStep.rewardPoints })}
                  </div>
                  <Award className="h-14 w-14 mx-auto animate-pulse" style={{ color: currentRealm.color }} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {tutorialStep > 0 && tutorialStep < 4 && (
                  <button
                    onClick={() => setTutorialStep(tutorialStep - 1)}
                    className="flex-1 h-11 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
                  >
                    {t("cultivation.tutorial.previous")}
                  </button>
                )}
                <button
                  onClick={handleTutorialNext}
                  className="cult-btn-glow flex-1 h-11 text-sm font-medium rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${currentRealm.color}, ${currentRealm.color}cc)`,
                    color: "#fff",
                  }}
                >
                  {tutorialStep === 4
                    ? t("cultivation.tutorial.complete")
                    : currentTutorialStep.action === "startCheckIn"
                      ? t("cultivation.tutorial.startCheckIn")
                      : t("cultivation.tutorial.next")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== CHECK-IN TAB ========== */}
        {activeTab === "checkin" && view !== "tutorial" && (
          <div>
            {/* --- HOME SUB-VIEW --- */}
            {view === "home" && (
              <div className="space-y-7 animate-in fade-in duration-500">
                <div className="flex flex-col items-center space-y-5">
                  <div
                    className="spirit-orb relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center border-2"
                    style={{
                      borderColor: `${currentRealm.color}40`,
                      background: `radial-gradient(circle, ${currentRealm.color}15, ${currentRealm.color}05, transparent)`,
                      boxShadow: `0 0 40px ${currentRealm.color}15`,
                    }}
                  >
                    <Flame className="h-16 w-16 sm:h-20 sm:w-20" style={{ color: currentRealm.color }} />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-widest" style={{ color: currentRealm.color }}>
                      {isZh ? currentRealm.name : currentRealm.nameEn}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground tracking-wide">
                      {isZh ? currentRealm.description : currentRealm.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="cult-card-glow p-5 sm:p-6 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {isZh ? "悟道点" : "Enlightenment"}
                    </span>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: currentRealm.color }}>
                      {state.enlightenmentPoints.toLocaleString()}
                    </span>
                  </div>
                  {nextRealm && (
                    <>
                      <div className="cult-progress-track">
                        <div
                          className="cult-progress-fill"
                          style={{
                            width: `${Math.min(progressPercent, 100)}%`,
                            background: `linear-gradient(90deg, ${currentRealm.color}cc, ${currentRealm.color})`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{isZh ? "当前" : "Current"}: {currentRealm.minEP.toLocaleString()}</span>
                        <span>{isZh ? "下阶" : "Next"}: {nextRealm.minEP.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Calendar, value: state.totalCheckIns, label: isZh ? "总打卡" : "Total" },
                    { icon: TrendingUp, value: state.checkInStreak, label: isZh ? "连续天" : "Streak" },
                    { icon: Sparkles, value: state.enlightenmentPoints, label: isZh ? "悟道点" : "EP" },
                  ].map((s) => (
                    <div key={s.label} className="cult-stat">
                      <s.icon className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                      <div className="text-xl font-bold tabular-nums">{s.value}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    className="cult-btn-glow w-full h-14 text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: canCheckIn
                        ? `linear-gradient(135deg, ${currentRealm.color}, ${currentRealm.color}cc)`
                        : "hsl(var(--muted))",
                      color: canCheckIn ? "#fff" : "hsl(var(--muted-foreground))",
                    }}
                    onClick={handleCheckInStart}
                    disabled={!canCheckIn}
                  >
                    <Flame className="h-5 w-5" />
                    {canCheckIn ? (isZh ? "今日打卡" : "Check In Today") : (isZh ? "已完成今日修行" : "Completed Today")}
                  </button>
                  <button
                    className="w-full h-12 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 rounded-lg transition-all"
                    onClick={() => setView("records")}
                  >
                    {isZh ? "修行记录" : "Cultivation Records"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* --- CHECK-IN FORM SUB-VIEW --- */}
            {view === "checkin" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="cult-card-glow p-5 sm:p-7 space-y-7">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">
                      {isZh ? "一、今日心境" : "1. Today's Mood"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {moods.map((mood) => (
                        <button
                          key={mood.id}
                          onClick={() => setSelectedMood(mood.id)}
                          className={`cult-mood-card text-left ${selectedMood === mood.id ? "selected" : ""}`}
                          style={
                            selectedMood === mood.id
                              ? { borderColor: currentRealm.color, boxShadow: `0 0 16px ${currentRealm.color}15` }
                              : undefined
                          }
                        >
                          <div className="font-semibold text-sm">{isZh ? mood.name : mood.nameEn}</div>
                          <div className="text-xs text-muted-foreground mt-1">{isZh ? mood.description : mood.descriptionEn}</div>
                          <div className="text-[11px] mt-2 font-medium" style={{ color: currentRealm.color }}>+{mood.points} EP</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">
                      {isZh ? "二、无为指数" : "2. Wu Wei Index"}
                    </h3>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setWuWeiScore(score)}
                          className="transition-all hover:scale-110"
                          style={{ opacity: wuWeiScore >= score ? 1 : 0.25 }}
                        >
                          <Star
                            className="h-9 w-9 sm:h-10 sm:w-10"
                            fill={wuWeiScore >= score ? currentRealm.color : "none"}
                            color={currentRealm.color}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      {isZh ? "无为而无不为，率性而为" : "Act without action, all is accomplished"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">
                      {isZh ? "三、道场感应" : "3. Dao Field"}
                    </h3>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setDaoFieldActive(!daoFieldActive)}
                        className="px-8 py-3 rounded-lg border transition-all text-sm font-medium"
                        style={{
                          borderColor: daoFieldActive ? currentRealm.color : "hsl(var(--border))",
                          background: daoFieldActive ? `${currentRealm.color}12` : "hsl(var(--card))",
                          color: daoFieldActive ? currentRealm.color : "hsl(var(--muted-foreground))",
                          boxShadow: daoFieldActive ? `0 0 20px ${currentRealm.color}15` : "none",
                        }}
                      >
                        {daoFieldActive ? (isZh ? "已开启" : "Active") : (isZh ? "点击开启" : "Tap to Activate")}
                      </button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      {isZh ? "感应天地灵气，与万物共振" : "Sense the cosmic energy"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">
                      {isZh ? "四、心言自述" : "4. Inner Reflection"}
                    </h3>
                    <Textarea
                      value={insight}
                      onChange={(e) => setInsight(e.target.value)}
                      placeholder={isZh ? "今日所感所悟（选填）" : "Today's insights (optional)"}
                      className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-24 rounded-lg focus:border-foreground/25 focus:ring-0 resize-none"
                    />
                  </div>

                  <button
                    className="cult-btn-glow w-full h-13 py-3.5 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                    style={{
                      background: selectedMood
                        ? `linear-gradient(135deg, ${currentRealm.color}, ${currentRealm.color}cc)`
                        : "hsl(var(--muted))",
                      color: selectedMood ? "#fff" : "hsl(var(--muted-foreground))",
                    }}
                    onClick={handleSubmitCheckIn}
                    disabled={!selectedMood || isLoadingAI}
                  >
                    {isLoadingAI ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isZh ? "道衍正在感应..." : "Dao Yan is sensing..."}
                      </>
                    ) : (
                      isZh ? "提交修行" : "Submit"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* --- RESULT SUB-VIEW --- */}
            {view === "result" && (
              <div className="space-y-5 animate-in fade-in duration-700">
                <div className={`cult-card-glow p-8 text-center space-y-4 ${hasLeveledUp ? "cult-level-up" : ""}`}>
                  <div
                    className="text-5xl sm:text-6xl font-bold animate-in zoom-in duration-500 tabular-nums"
                    style={{ color: currentRealm.color }}
                  >
                    +{earnedPoints}
                  </div>
                  <div className="text-base text-muted-foreground">{isZh ? "悟道点" : "Enlightenment Points"}</div>
                  {hasLeveledUp && (
                    <div className="animate-in slide-in-from-bottom duration-700 pt-2">
                      <Badge
                        className="text-base px-5 py-2 font-bold border-0"
                        style={{ background: currentRealm.color, color: "#fff" }}
                      >
                        {isZh ? "突破！" : "Breakthrough!"} {isZh ? currentRealm.name : currentRealm.nameEn}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="cult-card-glow p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: currentRealm.color }} />
                    <h3 className="text-sm font-semibold text-muted-foreground">{isZh ? "道衍回响" : "Dao Yan's Reflection"}</h3>
                  </div>
                  <MarkdownRenderer content={aiGuidance} />
                </div>

                <button
                  className="cult-btn-glow w-full h-12 text-sm font-medium flex items-center justify-center gap-2 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${currentRealm.color}cc, ${currentRealm.color}88)`, color: "#fff" }}
                  onClick={() => setView("home")}
                >
                  {isZh ? "返回主界面" : "Return Home"}
                </button>
              </div>
            )}

            {/* --- RECORDS SUB-VIEW --- */}
            {view === "records" && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <h2 className="text-xl font-bold mb-2">{isZh ? "修行记录" : "Records"}</h2>
                {state.records.length === 0 ? (
                  <div className="cult-card-glow p-8 text-center text-muted-foreground text-sm">
                    {isZh ? "尚无修行记录" : "No records yet"}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {state.records.slice(0, 30).map((record, index) => {
                      const mood = moods.find((m) => m.id === record.mood);
                      return (
                        <div key={index} className="cult-record space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                              <Badge variant="outline" className="text-[11px]">
                                {isZh ? mood?.name : mood?.nameEn}
                              </Badge>
                            </div>
                            <div className="text-lg font-bold tabular-nums" style={{ color: currentRealm.color }}>
                              +{record.pointsEarned}
                            </div>
                          </div>
                          {record.aiGuidance && (
                            <details className="text-xs text-muted-foreground group">
                              <summary className="cursor-pointer hover:text-foreground transition-colors">
                                {isZh ? "查看回响" : "View Reflection"}
                              </summary>
                              <div className="mt-2 pl-3 border-l-2 border-dashed border-border">
                                <MarkdownRenderer content={record.aiGuidance} className="text-xs" />
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== GUIDE TAB ========== */}
        {activeTab === "guide" && view !== "tutorial" && view !== "checkin" && view !== "result" && view !== "records" && (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* Overview */}
            <div className="cult-card-glow p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5" style={{ color: currentRealm.color }} />
                <h2 className="text-base font-bold">{isZh ? "修炼体系概览" : "System Overview"}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t("cultivation.tutorial.welcomeContent")}
              </p>
            </div>

            {/* Realms */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5" style={{ color: currentRealm.color }} />
                <h2 className="text-base font-bold">{isZh ? "境界体系" : "Cultivation Realms"}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {realms.map((realm) => (
                  <div
                    key={realm.id}
                    className="cult-mood-card"
                    style={{
                      borderColor: realm.id === currentRealm.id ? `${realm.color}60` : `${realm.color}20`,
                      background: realm.id === currentRealm.id ? `${realm.color}08` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flame className="h-4 w-4 shrink-0" style={{ color: realm.color }} />
                      <span className="font-bold text-sm" style={{ color: realm.color }}>
                        {isZh ? realm.name : realm.nameEn}
                      </span>
                      {realm.id === currentRealm.id && (
                        <Badge className="ml-auto text-[10px] px-1.5 py-0 border-0 shrink-0" style={{ background: `${realm.color}20`, color: realm.color }}>
                          {isZh ? "当前" : "Now"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{isZh ? realm.description : realm.descriptionEn}</div>
                    <div className="text-[11px] text-muted-foreground/50 mt-1.5 tabular-nums">{realm.minEP.toLocaleString()} EP</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Moods & Points */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" style={{ color: currentRealm.color }} />
                <h2 className="text-base font-bold">{isZh ? "心境积分表" : "Mood & Points"}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {moods.map((mood) => (
                  <div key={mood.id} className="cult-mood-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 shrink-0" style={{ color: currentRealm.color }} />
                      <span className="font-bold text-sm">{isZh ? mood.name : mood.nameEn}</span>
                      <span className="ml-auto text-sm font-bold tabular-nums shrink-0" style={{ color: currentRealm.color }}>
                        +{mood.points}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{isZh ? mood.description : mood.descriptionEn}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring Rules */}
            <div className="cult-card-glow p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" style={{ color: currentRealm.color }} />
                <h2 className="text-base font-bold">{isZh ? "积分规则" : "Scoring Rules"}</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between border-b border-border pb-2">
                  <span>{isZh ? "心境基础分" : "Mood Base Points"}</span>
                  <span className="font-medium text-foreground">10–50 EP</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span>{isZh ? "无为指数（每星）" : "Wu Wei (per star)"}</span>
                  <span className="font-medium text-foreground">+5 EP</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span>{isZh ? "道场感应开启" : "Dao Field Active"}</span>
                  <span className="font-medium text-foreground">+10 EP</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span>{isZh ? "心言自述（有内容）" : "Inner Reflection"}</span>
                  <span className="font-medium text-foreground">+5 EP</span>
                </div>
                <div className="flex justify-between">
                  <span>{isZh ? "连续打卡加成" : "Streak Bonus"}</span>
                  <span className="font-medium text-foreground">×1.1 – ×1.5</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
