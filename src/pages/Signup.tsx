import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, ArrowRight, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    else if (name.trim().length < 2) e.name = "Nome muito curto";
    if (!email.trim()) e.email = "E-mail é obrigatório";
    else if (!EMAIL_RE.test(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha é obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field: string) => setErrors(p => ({ ...p, [field]: undefined }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    console.log("[Signup:submit]", { email, name });
    const { error } = await signUp(email, password, name, companyName);
    setLoading(false);
    if (error) {
      console.warn("[Signup:error]", error.message);
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      navigate("/login");
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? "border-destructive focus:ring-destructive/30 focus:border-destructive/50"
        : "border-border focus:ring-primary/30 focus:border-primary/50"
    }`;

  const passwordStrength = password.length >= 8 ? (password.length >= 12 ? 3 : 2) : password.length >= 6 ? 1 : 0;
  const strengthLabels = ["", "Fraca", "Boa", "Forte"];
  const strengthColors = ["", "bg-destructive", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEOHead title="Criar Conta" description="Crie sua conta gratuita no The Good City. Sem cartão necessário." path="/signup" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <img src={logo} alt="" className="w-7 h-7" />
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-primary">THE GOOD CITY</span>
        </Link>

        <h1 className="text-xl font-mono font-bold tracking-wider text-foreground text-center mb-1">CRIE SUA CONTA</h1>
        <p className="text-[10px] font-mono tracking-wider text-center mb-8 text-muted-foreground/70">
          COMECE GRATUITAMENTE. SEM CARTÃO NECESSÁRIO.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">SEU NOME</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input type="text" value={name} onChange={e => { setName(e.target.value); clearError("name"); }} placeholder="João Silva" autoComplete="name"
                className={fieldClass(!!errors.name)}
              />
            </div>
            {errors.name && <p className="flex items-center gap-1 mt-1 text-[10px] font-mono text-destructive"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">E-MAIL</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); clearError("email"); }} placeholder="seu@email.com" autoComplete="email"
                className={fieldClass(!!errors.email)}
              />
            </div>
            {errors.email && <p className="flex items-center gap-1 mt-1 text-[10px] font-mono text-destructive"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">SENHA</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); clearError("password"); }} minLength={6} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                className={`${fieldClass(!!errors.password)} !pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="flex items-center gap-1 mt-1 text-[10px] font-mono text-destructive"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
            {password.length > 0 && !errors.password && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex gap-0.5 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-muted"}`} />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">{strengthLabels[passwordStrength]}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">EMPRESA <span className="text-muted-foreground/30">(OPCIONAL)</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Minha Empresa IA" autoComplete="organization"
                className={fieldClass(false)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono font-bold text-sm tracking-wider disabled:opacity-50 transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>CRIAR CONTA <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-xs text-center mt-3 font-mono text-muted-foreground/30">
          Ao criar, você concorda com os Termos e Privacidade.
        </p>

        <p className="text-center text-[11px] font-mono mt-6 text-muted-foreground/50">
          Já tem conta?{" "}
          <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">FAÇA LOGIN</Link>
        </p>
      </motion.div>
    </div>
  );
}
