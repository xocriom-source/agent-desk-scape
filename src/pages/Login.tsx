import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "E-mail é obrigatório";
    else if (!EMAIL_RE.test(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha é obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    console.log("[Login:submit]", { email });
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      console.warn("[Login:error]", error.message);
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/spaces");
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? "border-destructive focus:ring-destructive/30 focus:border-destructive/50"
        : "border-border focus:ring-primary/30 focus:border-primary/50"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <SEOHead title="Login" description="Entre na sua conta The Good City para acessar seu escritório virtual e agentes IA." path="/login" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <img src={logo} alt="" className="w-7 h-7" />
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-primary">THE GOOD CITY</span>
        </Link>

        <h1 className="text-xl font-mono font-bold tracking-wider text-foreground text-center mb-1">BEM-VINDO DE VOLTA</h1>
        <p className="text-[10px] font-mono tracking-wider text-center mb-8 text-muted-foreground/70">
          ENTRE NA SUA CONTA PARA ACESSAR SEU ESCRITÓRIO
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">E-MAIL</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                placeholder="seu@email.com" autoComplete="email"
                className={fieldClass(!!errors.email)}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1 mt-1 text-[10px] font-mono text-destructive">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5 text-muted-foreground/70">SENHA</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                placeholder="••••••••" autoComplete="current-password"
                className={`${fieldClass(!!errors.password)} !pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1 mt-1 text-[10px] font-mono text-destructive">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-[10px] font-mono text-primary/70 hover:text-primary transition-colors">
              Esqueceu a senha?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono font-bold text-sm tracking-wider disabled:opacity-50 transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>ENTRAR <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-[11px] font-mono mt-8 text-muted-foreground/50">
          Não tem uma conta?{" "}
          <Link to="/signup" className="font-bold text-primary hover:text-primary/80 transition-colors">CRIE GRATUITAMENTE</Link>
        </p>
      </motion.div>
    </div>
  );
}
