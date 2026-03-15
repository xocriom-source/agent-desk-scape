import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/spaces");
    }
  };

  const mainColor = "#6b8fc4";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #0d1525 50%, #111d33 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <img src={logo} alt="" className="w-7 h-7" />
          <span className="font-mono font-bold text-sm tracking-[0.2em]" style={{ color: mainColor }}>AGENT OFFICE</span>
        </Link>

        <h1 className="text-xl font-mono font-bold tracking-wider text-white text-center mb-1">BEM-VINDO DE VOLTA</h1>
        <p className="text-[10px] font-mono tracking-wider text-center mb-8" style={{ color: `${mainColor}70` }}>
          ENTRE NA SUA CONTA PARA ACESSAR SEU ESCRITÓRIO
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5" style={{ color: `${mainColor}70` }}>E-MAIL</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${mainColor}40` }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-mono bg-transparent text-white placeholder-gray-600 focus:outline-none"
                style={{ borderColor: `${mainColor}25` }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-wider mb-1.5" style={{ color: `${mainColor}70` }}>SENHA</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${mainColor}40` }} />
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 rounded-lg border text-sm font-mono bg-transparent text-white placeholder-gray-600 focus:outline-none"
                style={{ borderColor: `${mainColor}25` }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: `${mainColor}40` }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-mono font-bold text-sm tracking-wider disabled:opacity-50 transition-all" style={{ backgroundColor: mainColor, color: "#0a0e1a" }}>
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>ENTRAR <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-[11px] font-mono mt-8" style={{ color: `${mainColor}50` }}>
          Não tem uma conta?{" "}
          <Link to="/signup" className="font-bold" style={{ color: mainColor }}>CRIE GRATUITAMENTE</Link>
        </p>
      </motion.div>
    </div>
  );
}
