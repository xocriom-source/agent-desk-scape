import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0e1a" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#6b8fc4]/30 border-t-[#6b8fc4] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[10px] font-mono tracking-wider text-gray-500">CARREGANDO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
