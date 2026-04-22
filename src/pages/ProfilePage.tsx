import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { useCultivation } from "@/hooks/useCultivation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Flame, Star, Calendar, CloudOff, Loader2, ChevronRight, KeyRound,
} from "lucide-react";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

const MOOD_COLORS: Record<string, string> = {
  transparent: "#10b981",
  tranquil: "#3b82f6",
  ripple: "#f59e0b",
  chaotic: "#ef4444",
};

const MOOD_NAMES_ZH: Record<string, string> = {
  transparent: "通透",
  tranquil: "宁静",
  ripple: "波动",
  chaotic: "纷乱",
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const isZh = i18n.language === "zh-CN";

  const { state, getCurrentRealm, getNextRealm, isSyncing } = useCultivation(user?.id);

  const currentRealm = getCurrentRealm();
  const nextRealm = getNextRealm();
  const progressPercent = nextRealm
    ? Math.min(((state.enlightenmentPoints - currentRealm.minEP) / (nextRealm.minEP - currentRealm.minEP)) * 100, 100)
    : 100;

  // Build record lookup map for calendar
  const { records } = state;
  const recordsByDate = useMemo(() => {
    const map = new Map<string, typeof records[0]>();
    for (const r of records) {
      // key: "YYYY-M-D" from toDateString format "Mon Apr 14 2026"
      const d = new Date(r.date);
      if (!isNaN(d.getTime())) {
        map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, r);
      }
    }
    return map;
  }, [records]);
  // Current month calendar
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 0=Sun…6=Sat → shift to Mon-first: (day + 6) % 7
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarDays = useMemo(() => {
    const cells: (number | null)[] = Array(firstDayOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayOffset, daysInMonth]);

  const monthName = now.toLocaleDateString(isZh ? "zh-CN" : "en-US", { year: "numeric", month: "long" });
  const weekLabels = isZh
    ? ["一", "二", "三", "四", "五", "六", "日"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const recentRecords = records.slice(0, 10);

  return (
    <>
      <SEO
        title={isZh ? "我的修行主页" : "My Cultivation Profile"}
        description="查看修行进度、境界成长和打卡历史"
        url="https://dao-yan.enter.pro/profile"
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* Login banner */}
        {!user && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CloudOff className="h-4 w-4 shrink-0" />
              {isZh ? "未登录，仅显示本地数据" : "Not signed in — showing local data only"}
            </span>
            <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => setAuthOpen(true)}>
              {isZh ? "登录" : "Sign in"}
            </Button>
          </div>
        )}
        {user && isSyncing && (
          <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground bg-muted/30 border-b border-border">
            <Loader2 className="h-3 w-3 animate-spin" />
            {isZh ? "正在加载修炼数据..." : "Loading cultivation data..."}
          </div>
        )}

        <div className="relative max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-12">
          <div className="dao-float-square dao-float-1 hidden sm:block" />
          <div className="dao-float-square dao-float-2 hidden sm:block" />

          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5 mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{isZh ? "返回" : "Back"}</span>
          </Button>

          <div className="space-y-4">

            {/* ── Header Card ── */}
            <div className="cult-card-glow p-6 sm:p-8">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${currentRealm.color}, ${currentRealm.color}99)` }}
                >
                  {user ? user.email?.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground truncate">
                    {user ? user.email : (isZh ? "未登录游客" : "Guest")}
                  </p>
                  <Badge
                    className="mt-1.5 text-white border-0 text-xs"
                    style={{ backgroundColor: currentRealm.color }}
                  >
                    {isZh ? currentRealm.name : currentRealm.nameEn}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isZh ? currentRealm.description : currentRealm.descriptionEn}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Change Password ── */}
            {user && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11"
                onClick={() => setChangePwOpen(true)}
              >
                <KeyRound className="h-4 w-4 shrink-0" />
                <span>{isZh ? "修改密码" : "Change Password"}</span>
              </Button>
            )}

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="cult-stat">
                <Star className="h-4 w-4 text-primary mx-auto mb-1" />
                <div className="text-lg sm:text-xl font-bold text-foreground">{state.enlightenmentPoints.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{isZh ? "悟道点" : "EP"}</div>
              </div>
              <div className="cult-stat">
                <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                <div className="text-lg sm:text-xl font-bold text-foreground">{state.checkInStreak}</div>
                <div className="text-xs text-muted-foreground">{isZh ? "连续天" : "Streak"}</div>
              </div>
              <div className="cult-stat">
                <Calendar className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                <div className="text-lg sm:text-xl font-bold text-foreground">{state.totalCheckIns}</div>
                <div className="text-xs text-muted-foreground">{isZh ? "累计打卡" : "Check-ins"}</div>
              </div>
            </div>

            {/* ── Realm Progress ── */}
            {nextRealm ? (
              <div className="cult-card-glow p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: currentRealm.color }}>
                    {isZh ? currentRealm.name : currentRealm.nameEn}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {isZh ? nextRealm.name : nextRealm.nameEn}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%`, backgroundColor: currentRealm.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {state.enlightenmentPoints.toLocaleString()} / {nextRealm.minEP.toLocaleString()} EP
                  {" · "}
                  {isZh
                    ? `还需 ${(nextRealm.minEP - state.enlightenmentPoints).toLocaleString()} 点`
                    : `${(nextRealm.minEP - state.enlightenmentPoints).toLocaleString()} more to next`}
                </p>
              </div>
            ) : (
              <div className="cult-card-glow p-4 text-center text-sm text-muted-foreground">
                {isZh ? "已达最高境界·真仙" : "Max realm reached: True Immortal"}
              </div>
            )}

            {/* ── Monthly Calendar ── */}
            <div className="cult-card-glow p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{isZh ? "本月打卡" : "This Month"}</h3>
                <span className="text-xs text-muted-foreground">{monthName}</span>
              </div>
              {/* Week header */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekLabels.map(d => (
                  <div key={d} className="text-xs text-muted-foreground py-0.5">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const key = `${year}-${month}-${day}`;
                  const record = recordsByDate.get(key);
                  const isToday = day === now.getDate();
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-full text-xs transition-all ${
                        isToday ? "ring-1 ring-primary" : ""
                      }`}
                      title={record ? (isZh ? MOOD_NAMES_ZH[record.mood] : record.mood) : undefined}
                    >
                      {record ? (
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: MOOD_COLORS[record.mood] ?? "#6366f1" }}
                        >
                          {day}
                        </div>
                      ) : (
                        <span className={`text-xs ${isToday ? "text-foreground font-bold" : "text-muted-foreground/60"}`}>
                          {day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 pt-1">
                {Object.entries(MOOD_NAMES_ZH).map(([key, name]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MOOD_COLORS[key] }} />
                    <span className="text-xs text-muted-foreground">{isZh ? name : key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── History Timeline ── */}
            <div className="cult-card-glow p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-semibold">{isZh ? "最近修行记录" : "Recent Records"}</h3>
              {recentRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isZh ? "暂无修行记录，去打卡开始修行吧" : "No records yet — start your cultivation journey"}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentRecords.map((record, idx) => {
                    const moodColor = MOOD_COLORS[record.mood] ?? "#6366f1";
                    const moodName = isZh ? MOOD_NAMES_ZH[record.mood] : record.mood;
                    const dateObj = new Date(record.date);
                    const dateStr = isNaN(dateObj.getTime())
                      ? record.date
                      : dateObj.toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={idx} className="flex gap-3">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className="h-3 w-3 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: moodColor }}
                          />
                          {idx < recentRecords.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-3 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs text-muted-foreground">{dateStr}</span>
                            <Badge
                              variant="outline"
                              className="text-xs border-0 px-1.5 py-0 h-4 text-white"
                              style={{ backgroundColor: moodColor }}
                            >
                              {moodName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              +{record.pointsEarned} EP
                            </span>
                            {record.daoFieldActive && (
                              <span className="text-xs" style={{ color: "#a855f7" }}>✦</span>
                            )}
                          </div>
                          {record.insight && (
                            <p className="text-xs text-foreground/80 line-clamp-2">{record.insight}</p>
                          )}
                          {record.aiGuidance && (
                            <details className="mt-1">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                                {isZh ? "道衍回响" : "Dao Yan's Reflection"}
                              </summary>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed pl-2 border-l border-border">
                                {record.aiGuidance.slice(0, 200)}{record.aiGuidance.length > 200 ? "…" : ""}
                              </p>
                            </details>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {state.records.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  {isZh
                    ? `共 ${state.records.length} 条记录，显示最近 10 条`
                    : `${state.records.length} total records, showing latest 10`}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <ChangePasswordModal open={changePwOpen} onOpenChange={setChangePwOpen} />
    </>
  );
}
