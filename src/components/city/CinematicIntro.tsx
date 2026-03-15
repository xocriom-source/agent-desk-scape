import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CinematicIntroProps {
  cityName: string;
  cityFlag: string;
  playerName: string;
  onComplete: () => void;
}

const PHASES = [
  { duration: 2200, label: "CONNECTING TO SERVER..." },
  { duration: 2000, label: "" },
  { duration: 2500, label: "" },
  { duration: 2000, label: "" },
];

export function CinematicIntro({ cityName, cityFlag, playerName, onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) return;
    const timer = setTimeout(() => {
      if (phase < PHASES.length - 1) {
        setPhase(phase + 1);
      } else {
        onComplete();
      }
    }, PHASES[phase].duration);
    return () => clearTimeout(timer);
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
        style={{ background: "radial-gradient(ellipse at center, #0A1628 0%, #000 100%)" }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Starfield background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Phase 0: Loading/connecting */}
        {phase === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-xs text-emerald-400 tracking-[0.3em] font-mono">{PHASES[0].label}</p>
            <motion.div
              className="mt-4 h-0.5 bg-gray-800 rounded-full w-48 mx-auto overflow-hidden"
            >
              <motion.div
                className="h-full bg-emerald-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Phase 1: Globe view */}
        {phase === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center z-10"
          >
            <motion.div
              className="text-8xl mb-6"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              🌍
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black text-white tracking-[0.15em] font-mono"
            >
              AGENT OFFICE
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-gray-500 tracking-[0.3em] mt-2 font-mono"
            >
              GLOBAL AI CITY NETWORK
            </motion.p>
          </motion.div>
        )}

        {/* Phase 2: Zoom to city */}
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center z-10"
          >
            {/* City rings */}
            <div className="relative w-64 h-64 mx-auto mb-6 flex items-center justify-center">
              {[1, 2, 3].map(ring => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border border-emerald-400/20"
                  style={{ width: ring * 80, height: ring * 80 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: ring * 0.2, duration: 0.5 }}
                />
              ))}
              <motion.span
                className="text-6xl relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {cityFlag}
              </motion.span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-black text-white tracking-wider font-mono"
            >
              {cityName.toUpperCase()}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-3 mt-3"
            >
              <span className="text-[10px] text-emerald-400 tracking-wider font-mono bg-emerald-400/10 px-3 py-1 rounded-full">
                ● LIVE
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Phase 3: Welcome */}
        {phase === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30"
            >
              🏢
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-gray-400 font-mono tracking-wider"
            >
              BEM-VINDO,
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-black text-white tracking-wider font-mono mt-1"
            >
              {playerName.toUpperCase()}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6"
            >
              <div className="flex items-center justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-600 font-mono tracking-wider mt-2">
                ENTERING CITY...
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
          className="absolute bottom-8 right-8 text-[10px] text-gray-600 hover:text-gray-400 font-mono tracking-wider transition-colors z-20"
        >
          SKIP →
        </motion.button>

        {/* Scan lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
