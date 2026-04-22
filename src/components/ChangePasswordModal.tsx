import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setPassword("");
    setConfirm("");
    setShowPw(false);
    setError(null);
    setDone(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(isZh ? "密码至少需要6位字符" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(isZh ? "两次密码输入不一致" : "Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateErr } = await updatePassword(password);
    setLoading(false);
    if (updateErr) {
      const msg = updateErr.message;
      if (msg.includes("session") || msg.includes("Session")) {
        setError(isZh ? "登录状态已过期，请退出后重新登录再修改密码" : "Session expired. Please sign out and sign in again.");
      } else {
        setError(msg);
      }
    } else {
      setDone(true);
      setTimeout(() => handleOpenChange(false), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isZh ? "修改密码" : "Change Password"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isZh ? "为您的账号设置新密码" : "Set a new password for your account"}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="font-medium">{isZh ? "密码已更新" : "Password updated"}</p>
            <p className="text-sm text-muted-foreground">
              {isZh ? "新密码设置成功" : "Your new password has been set."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isZh ? "请输入新密码" : "Please enter your new password"}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="change-new-password">{isZh ? "新密码" : "New Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="change-new-password"
                  type={showPw ? "text" : "password"}
                  placeholder={isZh ? "至少6位字符" : "At least 6 characters"}
                  className="pl-9 pr-9"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="change-confirm-password">{isZh ? "确认密码" : "Confirm Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="change-confirm-password"
                  type={showPw ? "text" : "password"}
                  placeholder={isZh ? "再次输入新密码" : "Repeat new password"}
                  className="pl-9"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isZh ? "保存新密码" : "Save New Password"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
