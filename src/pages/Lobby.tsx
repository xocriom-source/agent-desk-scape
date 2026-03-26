import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PlanBadge } from "@/components/plan/PlanBadge";
import logoOriginal from "@/assets/logo-original.svg";

const SKIN_TONES = [
  { id: "light", color: "#FDDCB5" },
  { id: "medium", color: "#E8B88A" },
  { id: "tan", color: "#C8956C" },
  { id: "dark", color: "#8D5B3E" },
];

function AvatarPreview({ color, skinTone, hairStyle, outfit, accessory }: {
  color: string; skinTone: string; hairStyle: string; outfit: string; accessory: string;
}) {
  const skin = SKIN_TONES.find(s => s.id === skinTone)?.color || "#E8B88A";
  return (
    <svg width="120" height="120" viewBox="0 0 96 96">
      <rect x="30" y="82" width="10" height="5" rx="2" fill="hsl(var(--foreground))" />
      <rect x="56" y="82" width="10" height="5" rx="2" fill="hsl(var(--foreground))" />
      <rect x="32" y="70" width="8" height="14" fill="hsl(var(--muted-foreground))" />
      <rect x="56" y="70" width="8" height="14" fill="hsl(var(--muted-foreground))" />
      <rect x="26" y="40" width="44" height="32" rx="4" fill={color} />
      {outfit === "suit" && (
        <>
          <rect x="46" y="42" width="3" height="20" fill="hsl(var(--destructive))" />
          <rect x="32" y="38" width="32" height="5" rx="2" fill="hsl(var(--primary-foreground))" />
        </>
      )}
      {outfit === "tech" && (
        <>
          <rect x="26" y="40" width="44" height="32" rx="4" fill="hsl(var(--foreground))" />
          <circle cx="48" cy="56" r="4" fill={color} />
        </>
      )}
      {outfit === "lab" && (
        <>
          <rect x="24" y="38" width="48" height="36" rx="4" fill="hsl(var(--muted))" />
          <rect x="38" y="42" width="20" height="12" rx="2" fill={color} />
        </>
      )}
      <rect x="30" y="16" width="36" height="26" rx="6" fill={skin} />
      {hairStyle === "spiky" && <path d="M28 22 L36 6 L42 16 L48 4 L54 16 L60 6 L68 22" fill="hsl(var(--foreground))" />}
      {hairStyle === "flat" && <rect x="28" y="10" width="40" height="14" rx="6" fill="#4A3728" />}
      {hairStyle === "mohawk" && <rect x="42" y="2" width="12" height="20" rx="4" fill="hsl(var(--destructive))" />}
      {hairStyle === "curly" && (
        <>
          <circle cx="34" cy="14" r="6" fill="hsl(var(--accent))" />
          <circle cx="42" cy="12" r="6" fill="hsl(var(--accent))" />
          <circle cx="50" cy="12" r="6" fill="hsl(var(--accent))" />
          <circle cx="58" cy="14" r="6" fill="hsl(var(--accent))" />
        </>
      )}
      <rect x="36" y="26" width="6" height="6" rx="2" fill="hsl(var(--primary-foreground))" />
      <rect x="54" y="26" width="6" height="6" rx="2" fill="hsl(var(--primary-foreground))" />
      <rect x="38" y="28" width="3" height="3" rx="1" fill="hsl(var(--foreground))" />
      <rect x="56" y="28" width="3" height="3" rx="1" fill="hsl(var(--foreground))" />
      <rect x="42" y="36" width="12" height="2" rx="1" fill={skin} opacity="0.6" />
      {accessory === "glasses" && (
        <>
          <rect x="34" y="24" width="10" height="8" rx="2" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
          <rect x="52" y="24" width="10" height="8" rx="2" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
          <line x1="44" y1="28" x2="52" y2="28" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
        </>
      )}
      {accessory === "headphones" && (
        <>
          <path d="M28 26 Q28 8 48 8 Q68 8 68 26" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="3" />
          <rect x="24" y="22" width="6" height="10" rx="2" fill="hsl(var(--muted-foreground))" />
          <rect x="66" y="22" width="6" height="10" rx="2" fill="hsl(var(--muted-foreground))" />
        </>
      )}
      <text x="48" y="8" textAnchor="middle" fontSize="14">👑</text>
    </svg>
  );
}

export default function Lobby() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [name, setName] = useState(() => profile?.display_name || "");
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [skipLobby, setSkipLobby] = useState(false);

  // Load saved visual config (cosmetic only, safe in localStorage)
  const config = useMemo(() => {
    try {
      const saved = localStorage.getItem("playerConfig");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { color: "#4F46E5", hairStyle: "spiky", outfitStyle: "suit", skinTone: "medium", accessory: "none" };
  }, []);

  const buildingName = profile?.company_name || "Meu Espaço";

  // Memoize floating stars so they don't re-generate on every render
  const stars = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.7 ? "text-lg" : "text-xs",
      delay: Math.random() * 4,
    })),
  []);

  const handleJoin = () => {
    if (name.trim()) {
      localStorage.setItem("playerName", name.trim());
    }
    localStorage.setItem("lobbyMic", micOn ? "1" : "0");
    localStorage.setItem("lobbyCam", camOn ? "1" : "0");
    if (skipLobby) localStorage.setItem("skipLobby", "1");
    navigate("/office");
  };

  // Skip if user previously checked "skip" — use useMemo to avoid useEffect flash
  useMemo(() => {
    if (localStorage.getItem("skipLobby") === "1") {
      // Will redirect on first render
    }
  }, []);

  // Redirect immediately if skip is set (safe in render since navigate is stable)
  if (localStorage.getItem("skipLobby") === "1") {
    navigate("/office", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      {/* Floating stars */}
      {stars.map(star => (
        <motion.span
          key={star.id}
          className={`absolute ${star.size} text-muted-foreground/30 pointer-events-none select-none`}
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3 + star.delay * 0.5, repeat: Infinity, delay: star.delay }}
        >
          ✦
        </motion.span>
      ))}

      {/* Logo top-left */}
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <img src={logoOriginal} alt="Logo" className="w-8 h-8" />
        <span className="text-primary font-bold text-sm tracking-wider font-mono">THE GOOD CITY</span>
      </div>
      <div className="absolute top-4 right-6">
        <PlanBadge />
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Este é o Espaço{" "}
          <span className="text-primary">{buildingName}</span>
        </h1>
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
      >
        {/* Camera/Audio preview box */}
        <div className="w-72 h-56 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          {camOn ? (
            <div className="text-muted-foreground text-sm">📹 Câmera ativa</div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">Seu áudio está desativado</p>
              <p className="text-muted-foreground text-sm">Sua câmera está desligada</p>
            </>
          )}
        </div>

        {/* Right side: Avatar + Name + Join */}
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-card/60 border-2 border-border/50 flex items-center justify-center overflow-hidden">
              <AvatarPreview
                color={config.color}
                skinTone={config.skinTone || "medium"}
                hairStyle={config.hairStyle || "spiky"}
                outfit={config.outfitStyle || "suit"}
                accessory={config.accessory || "none"}
              />
            </div>
            <button
              onClick={() => navigate("/onboarding")}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Editar
            </button>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome..."
            maxLength={20}
            className="w-56 px-4 py-2.5 rounded-lg bg-card/80 border border-border/50 text-foreground text-center text-base font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="w-56 py-3 rounded-lg bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground text-accent-foreground font-bold text-base transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30"
          >
            Participar
          </button>

          {/* Skip checkbox */}
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={skipLobby}
              onChange={e => setSkipLobby(e.target.checked)}
              className="w-4 h-4 rounded border-border/50 bg-card/50 accent-primary"
            />
            <span className="text-xs text-muted-foreground">
              Salvar minhas configurações e pular esta etapa
            </span>
          </label>
        </div>
      </motion.div>

      {/* Audio/Video toggle buttons below preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3 mt-6"
      >
        <button
          onClick={() => setMicOn(!micOn)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            micOn
              ? "bg-card/60 text-foreground border border-border/50"
              : "bg-destructive/80 text-destructive-foreground"
          }`}
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => setCamOn(!camOn)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            camOn
              ? "bg-card/60 text-foreground border border-border/50"
              : "bg-destructive/80 text-destructive-foreground"
          }`}
        >
          {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <ChevronUp className="w-3 h-3" />
        </button>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-muted-foreground/50 text-center max-w-md px-4">
        Ao entrar neste Espaço, você concorda com os nossos{" "}
        <span className="underline cursor-pointer hover:text-muted-foreground">Termos de serviço</span>{" "}
        e{" "}
        <span className="underline cursor-pointer hover:text-muted-foreground">Política de privacidade</span>{" "}
        e confirma que é maior de 18 anos.
      </p>
    </div>
  );
}
