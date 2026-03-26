import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import logoOriginal from "@/assets/logo-original.svg";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !EMAIL_RE.test(email)) {
      setError("E-mail inválido");
      return;
    }
    setLoading(true);
    console.log("[ForgotPassword:submit]", { email });
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      console.warn("[ForgotPassword:error]", resetError.message);
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEOHead title="Esqueci minha senha" description="Recupere sua senha do The Good City." path="/forgot-password" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <img src={logoOriginal} alt="" className="w-7 h-7" />
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-primary">THE GOOD CITY</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-xl font-mono font-bold tracking-wider text-foreground mb-2">E-MAIL ENVIADO</h1>
            <p className="text-sm font-mono text-muted-foreground mb-6">
              Verifique sua caixa de entrada em <span className="text-foreground font-bold">{email}</span> para redefinir sua senha.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-primary/80 tracking-wider transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR PARA LOGIN
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-mono font-bold tracking-wider text-foreground text-center mb-1">RECUPERAR SENHA</h1>
            <p className="text-[10px] font-mono tracking-wider text-center mb-8 text-muted-foreground/70">
              INSIRA SEU E-MAIL PARA RECEBER O LINK DE REDEFINIÇÃO
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">E-MAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all ${
                      error ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-primary/30 focus:border-primary/50"
                    }`}
                  />
                </div>
                {error && (
                  <p className="flex items-center gap-1 mt-1 text-[10px] font-mono text-destructive">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono font-bold text-sm tracking-wider disabled:opacity-50 transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>ENVIAR LINK <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-[11px] font-mono mt-8 text-muted-foreground/50">
              Lembrou a senha?{" "}
              <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">FAÇA LOGIN</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
