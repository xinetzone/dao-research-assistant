import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  qrcodeUrl: string;
  mobileUrl: string;
  channel: "wechat" | "alipay";
  tier: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentQRCode({
  open,
  onOpenChange,
  orderId,
  qrcodeUrl,
  mobileUrl,
  channel,
  tier,
  amount,
  onSuccess,
}: PaymentQRCodeProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  const clearTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  // Poll order status
  useEffect(() => {
    if (!open || !orderId || status !== "pending") return;

    const poll = async () => {
      try {
        const { data } = await supabase.rpc("check_order_status", { p_order_id: orderId });
        const result = data as Record<string, unknown> | null;
        if (result?.status === "paid") {
          setStatus("paid");
          clearTimers();
          setTimeout(() => onSuccess(), 1500);
        }
      } catch (err) {
        console.error("[payment] poll error:", err);
      }
    };

    pollRef.current = setInterval(poll, 3000);
    poll(); // Initial check

    return clearTimers;
  }, [open, orderId, status, onSuccess, clearTimers]);

  // Countdown
  useEffect(() => {
    if (!open || status !== "pending") return;

    setCountdown(300);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStatus("expired");
          clearTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [open, status, clearTimers]);

  // Auto redirect on mobile
  useEffect(() => {
    if (open && isMobile && mobileUrl && status === "pending") {
      window.location.href = mobileUrl;
    }
  }, [open, isMobile, mobileUrl, status]);

  // Reset on close
  const handleClose = (val: boolean) => {
    if (!val) {
      clearTimers();
      setStatus("pending");
      setCountdown(300);
    }
    onOpenChange(val);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const tierName = tier === "daoyou"
    ? (isZh ? "道友会员" : "Dao Friend")
    : (isZh ? "悟道会员" : "Enlightened");

  const channelName = channel === "wechat"
    ? (isZh ? "微信支付" : "WeChat Pay")
    : (isZh ? "支付宝" : "Alipay");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {channelName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Order info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">{tierName}</p>
            <p className="text-2xl font-bold text-foreground">¥{amount}</p>
          </div>

          {status === "pending" && (
            <>
              {/* QR Code for PC */}
              {!isMobile && qrcodeUrl && (
                <div className="border rounded-lg p-2 bg-card">
                  <img
                    src={qrcodeUrl}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Mobile: show redirect message */}
              {isMobile && (
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {isZh ? "正在跳转支付页面..." : "Redirecting to payment..."}
                  </p>
                  {mobileUrl && (
                    <Button variant="outline" size="sm" onClick={() => window.location.href = mobileUrl}>
                      {isZh ? "手动跳转" : "Open manually"}
                    </Button>
                  )}
                </div>
              )}

              {/* Countdown */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {isZh ? `二维码有效期 ${formatTime(countdown)}` : `QR valid for ${formatTime(countdown)}`}
                </span>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {isZh
                  ? (isMobile ? "支付完成后请返回此页面" : "请使用手机扫描二维码完成支付")
                  : (isMobile ? "Return here after payment" : "Scan the QR code with your phone to pay")}
              </p>
            </>
          )}

          {status === "paid" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-bold text-foreground">
                {isZh ? "支付成功！" : "Payment Successful!"}
              </p>
              <Badge variant="secondary">{tierName}</Badge>
            </div>
          )}

          {status === "expired" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <RefreshCw className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isZh ? "二维码已过期，请重新发起支付" : "QR code expired, please try again"}
              </p>
              <Button variant="outline" onClick={() => handleClose(false)}>
                {isZh ? "关闭" : "Close"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
