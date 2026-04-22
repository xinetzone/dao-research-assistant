import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  sendPasswordResetOTP: (email: string) => Promise<{ error: Error | null }>;
  verifyPasswordResetOTP: (email: string, token: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      // Detect recovery link click
      if (event === "PASSWORD_RECOVERY") {
        setTimeout(() => setIsPasswordRecovery(true), 0);
      }
    });

    setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session: existing } }) => {
        setSession(existing);
        setUser(existing?.user ?? null);
        setLoading(false);
      });
    }, 0);

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sendPasswordResetOTP = async (email: string) => {
    // Send 6-digit OTP via email (avoids clicking links through Kong gateway)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    return { error };
  };

  const verifyPasswordResetOTP = async (email: string, token: string) => {
    // Verify OTP — signs the user in so they can update their password
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    // Ensure a valid session exists before updating
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      // Try refreshing the session first
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        return { error: new Error("Auth session missing! Please sign out and sign in again.") };
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setIsPasswordRecovery(false);
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, isPasswordRecovery,
      signIn, signUp, signOut, sendPasswordResetOTP, verifyPasswordResetOTP, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
