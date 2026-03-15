import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Check, Plus } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  is_system: boolean;
}

interface Props {
  skills: Skill[];
  agentSkills: string[];
  onAttach: (skillId: string) => void;
  onDetach: (skillId: string) => void;
}

const SKILL_CATEGORIES = [
  { id: "all", name: "Todas" },
  { id: "sales", name: "Vendas" },
  { id: "marketing", name: "Marketing" },
  { id: "research", name: "Pesquisa" },
  { id: "communication", name: "Comunicação" },
  { id: "development", name: "Desenvolvimento" },
  { id: "analytics", name: "Analytics" },
  { id: "productivity", name: "Produtividade" },
];

export function SkillSystem({ skills, agentSkills, onAttach, onDetach }: Props) {
  const [category, setCategory] = useState("all");

  const filtered = category === "all" ? skills : skills.filter(s => s.category === category);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        Skills Disponíveis ({skills.length})
      </h3>

      <div className="flex gap-1.5 flex-wrap">
        {SKILL_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${category === c.id ? "bg-primary/20 text-primary" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {filtered.map(skill => {
          const isAttached = agentSkills.includes(skill.id);
          return (
            <motion.button
              key={skill.id}
              layout
              onClick={() => isAttached ? onDetach(skill.id) : onAttach(skill.id)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                isAttached
                  ? "border-primary/30 bg-primary/5"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{skill.icon}</span>
                <span className="text-xs font-medium text-white">{skill.name}</span>
                {isAttached && <Check className="w-3 h-3 text-primary ml-auto" />}
              </div>
              {skill.description && (
                <p className="text-[10px] text-gray-400 line-clamp-2">{skill.description}</p>
              )}
              <span className="text-[9px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded mt-1.5 inline-block">{skill.category}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
