import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface Props {
  xp: number;
  show: boolean;
}

export function XPRewardPopup({ xp, show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-400/90 text-yellow-900 font-bold text-lg shadow-2xl shadow-yellow-400/30"
        >
          <Star className="w-6 h-6 fill-yellow-900" />
          +{xp} XP
          <Star className="w-6 h-6 fill-yellow-900" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
