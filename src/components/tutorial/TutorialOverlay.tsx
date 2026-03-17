import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Star } from "lucide-react";

export interface TutorialStep {
  title: string;
  description: string;
  emoji: string;
  xp?: number;
  /** CSS position hint: "top-left" | "top-right" | "bottom-center" | "center" */
  position?: string;
}

interface Props {
  steps: TutorialStep[];
  storageKey: string;
  onComplete?: () => void;
}

export function TutorialOverlay({ steps, storageKey, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    const xp = step.xp || 0;
    setTotalXP(prev => prev + xp);

    if (isLast) {
      localStorage.setItem(storageKey, "true");
      setVisible(false);
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm"
          />

          {/* Tutorial card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: `${(currentStep / steps.length) * 100}%` }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      key={currentStep}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl"
                    >
                      {step.emoji}
                    </motion.div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                        Passo {currentStep + 1} de {steps.length}
                      </p>
                      <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {step.description}
                </p>

                {/* XP badge */}
                {step.xp && (
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">+{step.xp} XP</span>
                    {totalXP > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-2">
                        Total: {totalXP + step.xp} XP
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pular tutorial
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {isLast ? "Começar!" : "Próximo"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
