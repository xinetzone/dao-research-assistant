import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/contexts/AuthContext";

/** Shown automatically when the app detects a PASSWORD_RECOVERY event
 *  (user clicked the reset-password email link). */
export function PasswordResetModal() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const { isPasswordRecovery, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      setError(updateErr.message);
    } else {
      setDone(true);
    }
  };

  return (
    <Dialog open={isPasswordRecovery} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isZh ? "重置密码" : "Reset Password"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isZh ? "为道衍账号设置新密码" : "Set a new password for your DaoYan account"}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="font-medium">{isZh ? "密码已更新" : "Password updated"}</p>
            <p className="text-sm text-muted-foreground">
              {isZh ? "新密码设置成功，已为你自动登录" : "Your new password has been set. You're now logged in."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isZh ? "请输入新密码" : "Please enter your new password"}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">{isZh ? "新密码" : "New Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
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
              <Label htmlFor="confirm-password">{isZh ? "确认密码" : "Confirm Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
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
