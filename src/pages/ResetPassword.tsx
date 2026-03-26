import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import logoOriginal from "@/assets/logo-original.svg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    console.log("[ResetPassword:submit]");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      console.warn("[ResetPassword:error]", updateError.message);
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <SEOHead title="Redefinir Senha" description="Redefina sua senha do The Good City." path="/reset-password" />
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-mono font-bold tracking-wider text-foreground mb-4">LINK INVÁLIDO</h1>
          <p className="text-sm font-mono text-muted-foreground mb-6">
            Este link de redefinição é inválido ou expirou. Solicite um novo.
          </p>
          <Link to="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors">
            SOLICITAR NOVO LINK <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEOHead title="Redefinir Senha" description="Redefina sua senha do The Good City." path="/reset-password" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <img src={logoOriginal} alt="" className="w-7 h-7" />
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-primary">THE GOOD CITY</span>
        </Link>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-xl font-mono font-bold tracking-wider text-foreground mb-2">SENHA ATUALIZADA</h1>
            <p className="text-sm font-mono text-muted-foreground">
              Redirecionando para login...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-mono font-bold tracking-wider text-foreground text-center mb-1">NOVA SENHA</h1>
            <p className="text-[10px] font-mono tracking-wider text-center mb-8 text-muted-foreground/70">
              DEFINA UMA NOVA SENHA PARA SUA CONTA
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">NOVA SENHA</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">CONFIRMAR SENHA</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(""); }}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="flex items-center gap-1 text-[10px] font-mono text-destructive">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono font-bold text-sm tracking-wider disabled:opacity-50 transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>REDEFINIR SENHA <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
