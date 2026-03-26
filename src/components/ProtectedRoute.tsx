import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [roleChecked, setRoleChecked] = useState(!requiredRole);
  const [hasRole, setHasRole] = useState(false);
  const [roleError, setRoleError] = useState(false);

  useEffect(() => {
    if (!requiredRole || !user) return;
    
    let cancelled = false;
    
    const checkRole = async () => {
      try {
        const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: requiredRole });
        if (cancelled) return;
        if (error) {
          console.warn("[ProtectedRoute] Role check failed:", error.message);
          setRoleError(true);
        }
        setHasRole(!!data);
      } catch {
        if (!cancelled) setRoleError(true);
      } finally {
        if (!cancelled) setRoleChecked(true);
      }
    };
    checkRole();

    return () => { cancelled = true; };
  }, [user, requiredRole]);

  if (loading || (requiredRole && !roleChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[10px] font-mono tracking-wider text-muted-foreground">CARREGANDO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && (!hasRole || roleError)) {
    return <Navigate to="/lobby" replace />;
  }

  return <>{children}</>;
}
