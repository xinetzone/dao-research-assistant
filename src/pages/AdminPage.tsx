import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Search, Shield, Crown, Sparkles, Star, Loader2, Check } from "lucide-react";
import type { SubscriptionTier } from "@/data/models";
import { TIER_NAMES } from "@/data/models";

interface UserRow {
  id: string;
  email: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  daily_chat_count: number;
  monthly_api_count: number;
  enlightenment_points: number;
  total_check_ins: number;
  is_admin: boolean;
  created_at: string;
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: "hsl(var(--muted-foreground))",
  daoyou: "hsl(var(--primary))",
  wudao: "hsl(280 60% 60%)",
};

const TIER_ICONS: Record<SubscriptionTier, typeof Star> = {
  free: Star,
  daoyou: Crown,
  wudao: Sparkles,
};

export default function AdminPage() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successUserId, setSuccessUserId] = useState<string | null>(null);

  // Check admin status
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false));
  }, [user]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_admin_id: user.id,
        p_search: search,
        p_limit: 100,
      });
      if (error) {
        console.error("[admin] fetch error:", error);
        return;
      }
      if (data && typeof data === "object" && !Array.isArray(data) && "error" in (data as Record<string, unknown>)) {
        setIsAdmin(false);
        return;
      }
      setUsers((data as UserRow[]) || []);
    } finally {
      setLoading(false);
    }
  }, [user, search]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  // Update user tier
  const handleUpdateTier = async (targetUserId: string, newTier: SubscriptionTier) => {
    if (!user) return;
    setUpdatingUserId(targetUserId);
    try {
      const { data, error } = await supabase.rpc("admin_update_user_tier", {
        p_admin_id: user.id,
        p_target_user_id: targetUserId,
        p_tier: newTier,
        p_duration_days: 30,
      });
      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }
      const result = data as Record<string, unknown> | null;
      if (result?.error) {
        alert(`Error: ${result.error}`);
        return;
      }
      setUsers(prev =>
        prev.map(u =>
          u.id === targetUserId
            ? { ...u, subscription_tier: newTier, subscription_expires_at: (result?.expires_at as string) || null }
            : u
        )
      );
      setSuccessUserId(targetUserId);
      setTimeout(() => setSuccessUserId(null), 2000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">{isZh ? "请先登录" : "Please sign in"}</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <Shield className="h-16 w-16 text-destructive/50" />
        <p className="text-muted-foreground text-lg">{isZh ? "无权访问管理后台" : "Access Denied"}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          {isZh ? "返回首页" : "Go Home"}
        </Button>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">{isZh ? "管理后台" : "Admin Dashboard"}</h1>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {users.length} {isZh ? "用户" : "users"}
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isZh ? "搜索用户邮箱..." : "Search by email..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchUsers()}
              className="pl-9"
            />
          </div>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isZh ? "搜索" : "Search"}
          </Button>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isZh ? "邮箱" : "Email"}</TableHead>
                <TableHead>{isZh ? "等级" : "Tier"}</TableHead>
                <TableHead>{isZh ? "到期时间" : "Expires"}</TableHead>
                <TableHead>{isZh ? "今日对话" : "Chats"}</TableHead>
                <TableHead>{isZh ? "API/月" : "API/Mo"}</TableHead>
                <TableHead>{isZh ? "悟道点" : "EP"}</TableHead>
                <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => {
                const Icon = TIER_ICONS[u.subscription_tier] || Star;
                const isUpdating = updatingUserId === u.id;
                const isSuccess = successUserId === u.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{u.email}</span>
                        {u.is_admin && <Shield className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1" style={{ color: TIER_COLORS[u.subscription_tier] }}>
                        <Icon className="h-3 w-3" />
                        {isZh ? TIER_NAMES[u.subscription_tier].zh : TIER_NAMES[u.subscription_tier].en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.subscription_expires_at
                        ? new Date(u.subscription_expires_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs">{u.daily_chat_count}</TableCell>
                    <TableCell className="text-xs">{u.monthly_api_count}</TableCell>
                    <TableCell className="text-xs">{u.enlightenment_points}</TableCell>
                    <TableCell>
                      {isSuccess ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Select
                          value={u.subscription_tier}
                          onValueChange={(val) => handleUpdateTier(u.id, val as SubscriptionTier)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">{isZh ? "免费" : "Free"}</SelectItem>
                            <SelectItem value="daoyou">{isZh ? "道友" : "Dao Friend"}</SelectItem>
                            <SelectItem value="wudao">{isZh ? "悟道" : "Enlightened"}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {isZh ? "暂无用户" : "No users found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
