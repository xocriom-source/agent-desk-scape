import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicIntroProps {
  cityName: string;
  cityFlag: string;
  playerName: string;
  onComplete: () => void;
}

export function CinematicIntro({ cityName, cityFlag, playerName, onComplete }: CinematicIntroProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "city" | "welcome">("loading");
  const [skipped, setSkipped] = useState(false);

  const mainColor = "#6b8fc4";
  const darkColor = "#4a6fa5";

  // Skyline buildings
  const buildings = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      x: (i / 70) * 100,
      width: 0.8 + Math.random() * 1.2,
      height: 8 + Math.random() * 30,
      lit: Math.random() > 0.4,
      windows: Math.floor(Math.random() * 5) + 2,
    })),
  []);

  useEffect(() => {
    if (skipped) return;

    if (phase === "loading") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase("city"), 200);
            return 100;
          }
          return prev + Math.random() * 6 + 2;
        });
      }, 80);
      return () => clearInterval(interval);
    }

    if (phase === "city") {
      const timer = setTimeout(() => setPhase("welcome"), 2500);
      return () => clearTimeout(timer);
    }

    if (phase === "welcome") {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, skipped, onComplete]);

  const handleSkip = useCallback(() => {
    setSkipped(true);
    onComplete();
  }, [onComplete]);

  if (skipped) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #0d1525 50%, #111d33 100%)" }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Skyline */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] overflow-hidden pointer-events-none">
          {buildings.map((b, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${b.x}%`,
                width: `${b.width}%`,
                backgroundColor: b.lit ? `${darkColor}35` : `${darkColor}18`,
                borderTop: `1px solid ${darkColor}40`,
                borderLeft: `1px solid ${darkColor}25`,
                borderRight: `1px solid ${darkColor}25`,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${b.height}%` }}
              transition={{ duration: 0.6, delay: i * 0.01, ease: "easeOut" }}
            >
              {b.lit && Array.from({ length: b.windows }).map((_, j) => (
                <motion.div
                  key={j}
                  className="absolute"
                  style={{
                    width: "25%",
                    height: "2px",
                    left: `${20 + (j % 2) * 40}%`,
                    bottom: `${15 + Math.floor(j / 2) * 25}%`,
                    backgroundColor: `${mainColor}70`,
                    boxShadow: `0 0 3px ${mainColor}40`,
                  }}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                />
              ))}
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          {phase === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1
                className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.25em] mb-6"
                style={{ color: mainColor }}
              >
                THE GOOD CITY
              </h1>
              <p className="text-xs font-mono tracking-[0.3em] uppercase mb-6" style={{ color: darkColor }}>
                FETCHING BUILDINGS...
              </p>
              <div className="w-56 h-3 mx-auto border rounded-sm overflow-hidden" style={{ borderColor: `${mainColor}30` }}>
                <div className="h-full rounded-sm transition-all" style={{ backgroundColor: mainColor, width: `${Math.min(progress, 100)}%` }} />
              </div>
              <p className="text-[10px] font-mono tracking-[0.2em] uppercase mt-6" style={{ color: `${darkColor}60` }}>
                CLICK ANY BUILDING TO SEE THAT DEV'S PROFILE
              </p>
            </motion.div>
          )}

          {phase === "city" && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <motion.span
                className="text-6xl block mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {cityFlag}
              </motion.span>
              <h2 className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.2em]" style={{ color: mainColor }}>
                {cityName.toUpperCase()}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.3em]" style={{ color: "#34d399" }}>LIVE</span>
              </div>
            </motion.div>
          )}

          {phase === "welcome" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-5xl mb-6">🏢</div>
              <p className="text-sm font-mono tracking-[0.2em] uppercase mb-2" style={{ color: darkColor }}>
                WELCOME,
              </p>
              <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.2em]" style={{ color: mainColor }}>
                {playerName.toUpperCase()}
              </h2>
              <div className="flex items-center justify-center gap-1 mt-6">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: mainColor }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <p className="text-[10px] font-mono tracking-[0.3em] mt-3" style={{ color: `${darkColor}50` }}>
                ENTERING CITY...
              </p>
            </motion.div>
          )}
        </div>

        {/* Skip */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
          className="absolute bottom-6 right-6 text-[10px] font-mono tracking-[0.2em] hover:opacity-100 transition-opacity z-20"
          style={{ color: `${darkColor}60` }}
        >
          SKIP →
        </motion.button>

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-[0.02]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
