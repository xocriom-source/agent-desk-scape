import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string;
  company_name: string;
  avatar_url: string;
  city: string;
  building_id: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string, companyName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const initialized = useRef(false);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("[Auth:fetchProfile] Profile not ready yet, retrying...");
          await new Promise(r => setTimeout(r, 2000));
          const { data: retryData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          if (retryData) setProfile(retryData as Profile);
        } else {
          console.warn("[Auth:fetchProfile]", error.message);
        }
        return;
      }
      if (data) setProfile(data as Profile);
    } catch (err) {
      console.warn("[Auth:fetchProfile] Unexpected:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const handleUserSession = useCallback((session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      // Defer to avoid Supabase auth deadlock
      setTimeout(() => {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }, 0);
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
  }, [fetchProfile, checkAdminRole]);

  useEffect(() => {
    // Set up auth state listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Auth:stateChange]", event);
        handleUserSession(session);

        if (event === "INITIAL_SESSION") {
          setLoading(false);
          initialized.current = true;
        }
      }
    );

    // Fallback: if INITIAL_SESSION doesn't fire within 3s, force loading=false
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        console.warn("[Auth] INITIAL_SESSION timeout, forcing loading=false");
        setLoading(false);
        initialized.current = true;
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [handleUserSession]);

  const signUp = useCallback(async (email: string, password: string, displayName: string, companyName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, company_name: companyName || "" } },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Erro inesperado ao criar conta") };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Erro inesperado ao fazer login") };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Auth:signOut] Error:", err);
    }
    setProfile(null);
    setIsAdmin(false);
    setUser(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };
    try {
      const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
      if (error) return { error: new Error(error.message) };
      setProfile(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Erro ao atualizar perfil") };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, profileLoading, isAdmin,
      signUp, signIn, signOut, updateProfile, refreshProfile,
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
