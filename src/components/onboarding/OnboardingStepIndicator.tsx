import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

interface Step {
  label: string;
  xp: number;
  icon: string;
}

const STEPS: Step[] = [
  { label: "Tipo do prédio", xp: 50, icon: "🏢" },
  { label: "Nome", xp: 30, icon: "✏️" },
  { label: "Cidade", xp: 70, icon: "🌍" },
];

interface Props {
  currentStep: number; // 1-indexed
  totalXP: number;
}

export function OnboardingStepIndicator({ currentStep, totalXP }: Props) {
  return (
    <div className="w-full max-w-lg mx-auto mb-8">
      {/* XP badge */}
      <motion.div
        key={totalXP}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="flex items-center justify-center gap-1.5 mb-4"
      >
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-bold text-yellow-400">{totalXP} XP</span>
      </motion.div>

      {/* Steps */}
      <div className="flex items-center justify-between relative">
        {/* Connection line */}
        <div className="absolute top-5 left-[15%] right-[15%] h-0.5 bg-border" />
        <motion.div
          className="absolute top-5 left-[15%] h-0.5 bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.max(0, (currentStep - 1) / (STEPS.length - 1)) * 70}%` }}
          transition={{ duration: 0.5 }}
        />

        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={i} className="flex flex-col items-center relative z-10 w-24">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  borderColor: isCompleted || isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                  isCompleted
                    ? "bg-primary border-primary"
                    : isActive
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <span>{step.icon}</span>
                )}
              </motion.div>
              <span className={`text-[10px] mt-1.5 font-medium ${
                isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
              {isCompleted && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] text-yellow-400 font-bold"
                >
                  +{step.xp} XP
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const STEP_XP = STEPS.map(s => s.xp);
