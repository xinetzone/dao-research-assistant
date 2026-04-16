import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Mode = "login" | "signup" | "forgot";

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const { signIn, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
    setShowPw(false);
    setMode("login");
    setResetSent(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Forgot password flow ──
    if (mode === "forgot") {
      if (!email) {
        setError(isZh ? "请输入邮箱" : "Please enter your email");
        return;
      }
      setLoading(true);
      setError(null);
      const { error: resetErr } = await sendPasswordReset(email);
      setLoading(false);
      if (resetErr) {
        setError(isZh ? "发送失败，请检查邮箱是否正确" : "Failed to send. Check your email address.");
      } else {
        setResetSent(true);
      }
      return;
    }

    // ── Login / Signup flow ──
    if (!email || !password) {
      setError(isZh ? "请填写邮箱和密码" : "Please fill in email and password");
      return;
    }
    setLoading(true);
    setError(null);

    const fn = mode === "login" ? signIn : signUp;
    const { error: authError } = await fn(email, password);

    setLoading(false);
    if (authError) {
      const msg = authError.message;
      if (msg.includes("Invalid login credentials")) {
        setError(isZh ? "邮箱或密码错误" : "Invalid email or password");
      } else if (msg.includes("User already registered")) {
        setError(isZh ? "该邮箱已注册，请直接登录" : "Email already registered, please sign in");
      } else if (msg.includes("Password should be")) {
        setError(isZh ? "密码至少需要6位字符" : "Password must be at least 6 characters");
      } else {
        setError(msg);
      }
      return;
    }

    reset();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isZh ? "道衍" : "DaoYan"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isZh ? "登录或注册道衍账号" : "Sign in or create your DaoYan account"}
          </DialogDescription>
        </DialogHeader>

        {/* ── Forgot Password view ── */}
        {mode === "forgot" ? (
          <div className="space-y-4">
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => { setMode("login"); setError(null); setResetSent(false); }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {isZh ? "返回登录" : "Back to sign in"}
            </button>

            {resetSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <p className="font-medium">{isZh ? "重置邮件已发送" : "Reset email sent"}</p>
                <p className="text-sm text-muted-foreground">
                  {isZh
                    ? `已向 ${email} 发送密码重置邮件，请检查收件箱（含垃圾邮件）`
                    : `Check your inbox at ${email} for the password reset link`}
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                >
                  {isZh ? "返回登录" : "Back to Sign In"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {isZh
                    ? "输入注册邮箱，我们将发送密码重置链接"
                    : "Enter your email and we'll send a password reset link"}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">{isZh ? "邮箱" : "Email"}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-9"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isZh ? "发送重置邮件" : "Send Reset Email"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* ── Login / Signup view ── */
          <>
            {/* Mode tabs */}
            <div className="flex rounded-lg border border-border overflow-hidden mb-2">
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setMode("login"); setError(null); }}
              >
                {isZh ? "登录" : "Sign In"}
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setMode("signup"); setError(null); }}
              >
                {isZh ? "注册" : "Sign Up"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{isZh ? "邮箱" : "Email"}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-9"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{isZh ? "密码" : "Password"}</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => { setMode("forgot"); setError(null); }}
                    >
                      {isZh ? "忘记密码？" : "Forgot password?"}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder={isZh ? "至少6位字符" : "At least 6 characters"}
                    className="pl-9 pr-9"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
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

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === "login"
                  ? (isZh ? "登录" : "Sign In")
                  : (isZh ? "注册账号" : "Create Account")}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground pt-1">
              {isZh
                ? "登录即可无限使用道衍 AI 对话"
                : "Sign in to unlock unlimited AI conversations"}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
