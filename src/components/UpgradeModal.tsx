import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Crown, Sparkles, Star, Check, X, Loader2, Smartphone, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SubscriptionTier } from "@/data/models";
import { PaymentQRCode } from "./PaymentQRCode";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: SubscriptionTier;
  reason?: "daily_limit" | "model_locked" | "realm_locked" | "general";
}

interface TierPlan {
  tier: SubscriptionTier;
  icon: typeof Crown;
  color: string;
  priceZh: string;
  priceEn: string;
  features: { zh: string; en: string; included: boolean }[];
}

const PLANS: TierPlan[] = [
  {
    tier: "free",
    icon: Star,
    color: "#9ca3af",
    priceZh: "免费",
    priceEn: "Free",
    features: [
      { zh: "每日 10 次对话", en: "10 chats/day", included: true },
      { zh: "GLM 5 + Gemini 模型", en: "GLM 5 + Gemini models", included: true },
      { zh: "API 100 次/月", en: "100 API calls/month", included: true },
      { zh: "炼气境界上限", en: "Qi Refining max realm", included: true },
      { zh: "高级模型", en: "Premium models", included: false },
      { zh: "全部修炼境界", en: "All cultivation realms", included: false },
    ],
  },
  {
    tier: "daoyou",
    icon: Crown,
    color: "#f59e0b",
    priceZh: "¥29/月",
    priceEn: "$4.9/mo",
    features: [
      { zh: "每日 50 次对话", en: "50 chats/day", included: true },
      { zh: "Claude + GPT + GLM + Gemini", en: "Claude + GPT + GLM + Gemini", included: true },
      { zh: "API 1,000 次/月", en: "1,000 API calls/month", included: true },
      { zh: "全部 10 境界解锁", en: "All 10 realms unlocked", included: true },
      { zh: "对话历史永久保存", en: "Permanent chat history", included: true },
      { zh: "Claude Opus 4.7", en: "Claude Opus 4.7", included: false },
    ],
  },
  {
    tier: "wudao",
    icon: Sparkles,
    color: "#a855f7",
    priceZh: "¥99/月",
    priceEn: "$14.9/mo",
    features: [
      { zh: "无限对话", en: "Unlimited chats", included: true },
      { zh: "全部 5 大模型", en: "All 5 AI models", included: true },
      { zh: "API 10,000 次/月", en: "10,000 API calls/month", included: true },
      { zh: "全部境界 + 专属指导", en: "All realms + guidance", included: true },
      { zh: "对话历史永久保存", en: "Permanent chat history", included: true },
      { zh: "优先响应速度", en: "Priority response speed", included: true },
    ],
  },
];


export function UpgradeModal({ open, onOpenChange, currentTier, reason = "general" }: UpgradeModalProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const { user } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  // QR payment state
  const [qrPayment, setQrPayment] = useState<{
    orderId: string;
    qrcodeUrl: string;
    mobileUrl: string;
    channel: "wechat" | "alipay";
    tier: string;
    amount: number;
  } | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) return;
    setSelectedTier(tier);
    setShowChannelPicker(true);
  };

  const handlePayWithChannel = async (channel: "wechat" | "alipay") => {
    if (!user || !selectedTier) return;
    setLoadingTier(selectedTier);
    setShowChannelPicker(false);

    try {
      const { data, error } = await supabase.functions.invoke("create-xunhu-order", {
        body: { tier: selectedTier, channel },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Open QR code dialog
      setQrPayment({
        orderId: data.orderId,
        qrcodeUrl: data.url_qrcode || "",
        mobileUrl: data.url || "",
        channel,
        tier: selectedTier,
        amount: selectedTier === "daoyou" ? 29 : 99,
      });
    } catch (err) {
      console.error("[UpgradeModal] payment error:", err);
      const msg = isZh
        ? "创建支付订单失败，请稍后再试"
        : "Failed to create payment. Please try again.";
      alert(msg);
    } finally {
      setLoadingTier(null);
    }
  };

  const handlePaymentSuccess = () => {
    setQrPayment(null);
    onOpenChange(false);
    // Reload to reflect new tier
    window.location.href = `${window.location.origin}?upgraded=${selectedTier}`;
  };

  const reasonText: Record<string, { zh: string; en: string }> = {
    daily_limit: { zh: "今日对话次数已用完", en: "Daily chat limit reached" },
    model_locked: { zh: "该模型需要更高等级会员", en: "This model requires a higher tier" },
    realm_locked: { zh: "解锁更高境界需要升级", en: "Upgrade to unlock higher realms" },
    general: { zh: "升级会员，解锁更多功能", en: "Upgrade to unlock more features" },
  };

  const TIER_LEVEL: Record<SubscriptionTier, number> = { free: 0, daoyou: 1, wudao: 2 };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isZh ? reasonText[reason].zh : reasonText[reason].en}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.tier === currentTier;
            const isUpgrade = TIER_LEVEL[plan.tier] > TIER_LEVEL[currentTier];

            return (
              <div
                key={plan.tier}
                className={`relative rounded-lg border-2 p-5 space-y-4 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : isUpgrade
                    ? "border-border hover:border-primary/50 hover:shadow-md"
                    : "border-border/50 opacity-60"
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs">
                    {isZh ? "当前" : "Current"}
                  </Badge>
                )}

                <div className="text-center space-y-2">
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      {isZh
                        ? plan.tier === "free" ? "免费" : plan.tier === "daoyou" ? "道友" : "悟道"
                        : plan.tier === "free" ? "Free" : plan.tier === "daoyou" ? "Dao Friend" : "Enlightened"}
                    </h3>
                    <p className="text-lg font-bold mt-1" style={{ color: plan.color }}>
                      {isZh ? plan.priceZh : plan.priceEn}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      {f.included ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                        {isZh ? f.zh : f.en}
                      </span>
                    </li>
                  ))}
                </ul>

                {isUpgrade && (
                  <Button
                    className="w-full"
                    style={{ backgroundColor: plan.color }}
                    disabled={loadingTier === plan.tier}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {loadingTier === plan.tier ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isZh ? "立即升级" : "Upgrade Now"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment channel picker */}
        {showChannelPicker && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
            <p className="text-sm font-medium text-center text-foreground">
              {isZh ? "选择支付方式" : "Choose payment method"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 flex flex-col gap-1"
                disabled={!!loadingTier}
                onClick={() => handlePayWithChannel("wechat")}
              >
                {loadingTier ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5 text-green-500" />}
                <span className="text-xs">{isZh ? "微信支付" : "WeChat Pay"}</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex flex-col gap-1"
                disabled={!!loadingTier}
                onClick={() => handlePayWithChannel("alipay")}
              >
                {loadingTier ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5 text-blue-500" />}
                <span className="text-xs">{isZh ? "支付宝" : "Alipay"}</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* QR code payment dialog */}
    {qrPayment && (
      <PaymentQRCode
        open={!!qrPayment}
        onOpenChange={(val) => { if (!val) setQrPayment(null); }}
        orderId={qrPayment.orderId}
        qrcodeUrl={qrPayment.qrcodeUrl}
        mobileUrl={qrPayment.mobileUrl}
        channel={qrPayment.channel}
        tier={qrPayment.tier}
        amount={qrPayment.amount}
        onSuccess={handlePaymentSuccess}
      />
    )}
    </>
  );
}
