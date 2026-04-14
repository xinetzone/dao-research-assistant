import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCultivation } from "@/hooks/useCultivation";
import { ArrowLeft, Flame, Star, Calendar, TrendingUp, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { supabase } from "@/integrations/supabase/client";

type ViewState = "home" | "checkin" | "result" | "records";

export default function CultivationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { state, moods, getCurrentRealm, getNextRealm, canCheckInToday, checkIn } = useCultivation();
  
  const [view, setView] = useState<ViewState>("home");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [wuWeiScore, setWuWeiScore] = useState<number>(0);
  const [daoFieldActive, setDaoFieldActive] = useState<boolean>(false);
  const [insight, setInsight] = useState<string>("");
  const [aiGuidance, setAiGuidance] = useState<string>("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [previousRealm, setPreviousRealm] = useState(getCurrentRealm().id);

  const currentRealm = getCurrentRealm();
  const nextRealm = getNextRealm();
  const canCheckIn = canCheckInToday();
  const isZh = i18n.language === "zh-CN";

  const progressPercent = nextRealm
    ? ((state.enlightenmentPoints - currentRealm.minEP) / (nextRealm.minEP - currentRealm.minEP)) * 100
    : 100;

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
    
    const moodInfo = moods.find(m => m.id === selectedMood);
    const prompt = `今日修行：心境${isZh ? moodInfo?.name : moodInfo?.nameEn}，无为指数${wuWeiScore}/5，道场感应${daoFieldActive ? "开启" : "未开"}。心言：${insight || "无"}`;

    try {
      let fullGuidance = "";
      const { data: { session } } = await supabase.auth.getSession();
      
      await fetchEventSource(`${supabase.supabaseUrl}/functions/v1/ai-chat-167c2bc1450e`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabase.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "anthropic/claude-sonnet-4.5",
          system: `你是一位通晓帛书版《道德经》、佛家「直心如如不动」以及万物理论的高阶仙师。根据修行者的今日状态，给予：
1. 帛书道德经原文引用（一句）
2. 佛家直心观的点评
3. 从量子场论/万物理论的宇宙视角启发

回应需在200字内，语言古雅诗意，蕴含深刻启迪。${isZh ? "" : "Please respond in English with poetic wisdom."}`,
        }),
        
        async onopen(response) {
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
          }
        },
        
        onmessage(event) {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          
          if (data.type === "content_block_delta" && data.delta?.text) {
            fullGuidance += data.delta.text;
          }
        },
        
        onerror(err) {
          throw err;
        },
      });

      const points = checkIn(selectedMood, wuWeiScore, daoFieldActive, insight, fullGuidance);
      setEarnedPoints(points);
      setAiGuidance(fullGuidance);
      setView("result");
    } catch (error) {
      console.error("AI guidance failed:", error);
      const fallbackGuidance = isZh
        ? "道可道，非常道。心若止水，万物自明。量子纠缠，亦如因果轮回。持之以恒，终见本源。"
        : "The Dao that can be told is not the eternal Dao. A still mind reflects all. Quantum entanglement mirrors karmic cycles. Persist, and you shall see the source.";
      const points = checkIn(selectedMood, wuWeiScore, daoFieldActive, insight, fallbackGuidance);
      setEarnedPoints(points);
      setAiGuidance(fallbackGuidance);
      setView("result");
    } finally {
      setIsLoadingAI(false);
    }
  }, [selectedMood, wuWeiScore, daoFieldActive, insight, checkIn, currentRealm.id, moods, isZh]);

  const hasLeveledUp = getCurrentRealm().id > previousRealm;

  return (
    <div className="min-h-screen bg-[#060a14] text-white relative overflow-hidden">
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => view === "home" ? navigate("/") : setView("home")}
            className="text-white/70 hover:text-white hover:bg-white/10 transition-all gap-1.5 px-2.5 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{view === "home" ? (isZh ? "返回" : "Back") : (isZh ? "主界面" : "Home")}</span>
          </Button>
          <h1 className="text-base sm:text-xl font-bold tracking-wider text-center flex-1 mx-2">
            {isZh ? "今天你用心了嘛？" : "Did You Cultivate Today?"}
          </h1>
          <div className="w-[72px] sm:w-20"></div>
        </div>

        {/* Home View */}
        {view === "home" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Spirit Orb */}
            <div className="flex flex-col items-center space-y-6">
              <div
                className="relative w-48 h-48 rounded-full flex items-center justify-center animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${currentRealm.color}40, transparent)`,
                  boxShadow: `0 0 60px ${currentRealm.color}60, inset 0 0 40px ${currentRealm.color}30`,
                }}
              >
                <Flame className="h-24 w-24" style={{ color: currentRealm.color }} />
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold tracking-widest" style={{ color: currentRealm.color }}>
                  {isZh ? currentRealm.name : currentRealm.nameEn}
                </h2>
                <p className="text-lg text-white/60 tracking-wide">
                  {isZh ? currentRealm.description : currentRealm.descriptionEn}
                </p>
              </div>
            </div>

            {/* Progress */}
            <Card className="bg-white/5 border-white/10 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">{isZh ? "悟道点" : "Enlightenment"}</span>
                <span className="text-2xl font-bold">{state.enlightenmentPoints.toLocaleString()}</span>
              </div>
              
              {nextRealm && (
                <>
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex justify-between text-sm text-white/60">
                    <span>{isZh ? "当前" : "Current"}: {currentRealm.minEP.toLocaleString()}</span>
                    <span>{isZh ? "下阶" : "Next"}: {nextRealm.minEP.toLocaleString()}</span>
                  </div>
                </>
              )}
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/10 p-4 text-center space-y-2">
                <Calendar className="h-6 w-6 mx-auto text-white/60" />
                <div className="text-2xl font-bold">{state.totalCheckIns}</div>
                <div className="text-xs text-white/60">{isZh ? "总打卡" : "Total"}</div>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4 text-center space-y-2">
                <TrendingUp className="h-6 w-6 mx-auto text-white/60" />
                <div className="text-2xl font-bold">{state.checkInStreak}</div>
                <div className="text-xs text-white/60">{isZh ? "连续天" : "Streak"}</div>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4 text-center space-y-2">
                <Sparkles className="h-6 w-6 mx-auto text-white/60" />
                <div className="text-2xl font-bold">{state.enlightenmentPoints}</div>
                <div className="text-xs text-white/60">{isZh ? "悟道点" : "EP"}</div>
              </Card>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                style={{
                  background: canCheckIn
                    ? `linear-gradient(135deg, ${currentRealm.color}, ${currentRealm.color}dd)`
                    : "rgba(255,255,255,0.1)",
                }}
                onClick={handleCheckInStart}
                disabled={!canCheckIn}
              >
                <Flame className="h-5 w-5 mr-2" />
                {canCheckIn ? (isZh ? "今日打卡" : "Check In Today") : (isZh ? "已完成今日修行" : "Completed Today")}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/20 hover:bg-white/10"
                onClick={() => setView("records")}
              >
                {isZh ? "修行记录" : "Cultivation Records"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Check-in View */}
        {view === "checkin" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="bg-white/5 border-white/10 p-6 space-y-6">
              {/* Step 1: Mood */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{isZh ? "一、今日心境" : "1. Today's Mood"}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {moods.map(mood => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedMood === mood.id
                          ? "border-primary bg-primary/20 scale-105"
                          : "border-white/20 hover:border-white/40 bg-white/5"
                      }`}
                    >
                      <div className="font-semibold">{isZh ? mood.name : mood.nameEn}</div>
                      <div className="text-xs text-white/60 mt-1">{isZh ? mood.description : mood.descriptionEn}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Wu Wei Score */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{isZh ? "二、无为指数" : "2. Wu Wei Index"}</h3>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      onClick={() => setWuWeiScore(score)}
                      className={`transition-all ${wuWeiScore >= score ? "scale-110" : "opacity-40 hover:opacity-70"}`}
                    >
                      <Star
                        className="h-10 w-10"
                        fill={wuWeiScore >= score ? currentRealm.color : "none"}
                        color={currentRealm.color}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-white/60">
                  {isZh ? "无为而无不为，率性而为" : "Act without action, all is accomplished"}
                </p>
              </div>

              {/* Step 3: Dao Field */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{isZh ? "三、道场感应" : "3. Dao Field"}</h3>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setDaoFieldActive(!daoFieldActive)}
                    className={`px-8 py-3 rounded-full border-2 transition-all ${
                      daoFieldActive
                        ? `border-[${currentRealm.color}] bg-[${currentRealm.color}]/20`
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    {daoFieldActive ? (isZh ? "已开启" : "Active") : (isZh ? "未开" : "Inactive")}
                  </button>
                </div>
                <p className="text-center text-sm text-white/60">
                  {isZh ? "感应天地灵气，与万物共振" : "Sense the cosmic energy"}
                </p>
              </div>

              {/* Step 4: Insight */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{isZh ? "四、心言自述" : "4. Inner Reflection"}</h3>
                <Textarea
                  value={insight}
                  onChange={e => setInsight(e.target.value)}
                  placeholder={isZh ? "今日所感所悟（选填）" : "Today's insights (optional)"}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-24"
                />
              </div>

              {/* Submit */}
              <Button
                size="lg"
                className="w-full"
                style={{
                  background: selectedMood ? `linear-gradient(135deg, ${currentRealm.color}, ${currentRealm.color}dd)` : undefined,
                }}
                onClick={handleSubmitCheckIn}
                disabled={!selectedMood || isLoadingAI}
              >
                {isLoadingAI ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isZh ? "仙师正在感应天机..." : "Master is sensing..."}
                  </>
                ) : (
                  <>{isZh ? "提交修行" : "Submit"}</>
                )}
              </Button>
            </Card>
          </div>
        )}

        {/* Result View */}
        {view === "result" && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <Card className="bg-white/5 border-white/10 p-8 text-center space-y-6">
              <div className="text-6xl font-bold animate-in zoom-in duration-500" style={{ color: currentRealm.color }}>
                +{earnedPoints}
              </div>
              <div className="text-xl text-white/80">{isZh ? "悟道点" : "Enlightenment Points"}</div>
              
              {hasLeveledUp && (
                <div className="animate-in slide-in-from-bottom duration-700">
                  <Badge className="text-lg px-6 py-2" style={{ background: currentRealm.color }}>
                    {isZh ? "突破！" : "Breakthrough!"} {isZh ? currentRealm.name : currentRealm.nameEn}
                  </Badge>
                </div>
              )}
            </Card>

            <Card className="bg-white/5 border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: currentRealm.color }} />
                <h3 className="text-lg font-semibold">{isZh ? "仙师点拨" : "Master's Guidance"}</h3>
              </div>
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{aiGuidance}</p>
            </Card>

            <Button size="lg" className="w-full" onClick={() => setView("home")}>
              {isZh ? "返回主界面" : "Return Home"}
            </Button>
          </div>
        )}

        {/* Records View */}
        {view === "records" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold mb-4">{isZh ? "修行记录" : "Records"}</h2>
            {state.records.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center text-white/60">
                {isZh ? "尚无修行记录" : "No records yet"}
              </Card>
            ) : (
              <div className="space-y-3">
                {state.records.slice(0, 30).map((record, index) => {
                  const mood = moods.find(m => m.id === record.mood);
                  return (
                    <Card key={index} className="bg-white/5 border-white/10 p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-sm text-white/60">{new Date(record.date).toLocaleDateString()}</div>
                          <Badge variant="outline" className="border-white/30">
                            {isZh ? mood?.name : mood?.nameEn}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold" style={{ color: currentRealm.color }}>
                          +{record.pointsEarned}
                        </div>
                      </div>
                      {record.aiGuidance && (
                        <details className="text-sm text-white/70">
                          <summary className="cursor-pointer hover:text-white">{isZh ? "查看点拨" : "View Guidance"}</summary>
                          <p className="mt-2 pl-4 border-l-2 border-white/20">{record.aiGuidance}</p>
                        </details>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .stars-small, .stars-medium, .stars-large {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 60px 70px, white, transparent),
            radial-gradient(1px 1px at 50px 50px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 90px 10px, white, transparent);
          background-repeat: repeat;
          animation: twinkle 3s infinite;
        }
        .stars-medium {
          background-size: 280px 280px;
          animation-duration: 4s;
        }
        .stars-large {
          background-size: 380px 380px;
          animation-duration: 5s;
        }
      `}</style>
    </div>
  );
}
