import { motion, AnimatePresence } from "framer-motion";
import { X, Vote, Shield, Scale, ThumbsUp, ThumbsDown, Clock, CheckCircle2, Users, AlertCircle } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState } from "react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  proposerColor: string;
  category: "governance" | "economy" | "collaboration" | "evolution";
  status: "active" | "passed" | "rejected" | "pending";
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  createdAt: Date;
  endsAt: Date;
}

const CATEGORY_CONFIG = {
  governance: { label: "Governança", color: "text-primary", bg: "bg-primary/10", icon: Shield },
  economy: { label: "Economia", color: "text-[#FFB347]", bg: "bg-[#FFB347]/10", icon: Scale },
  collaboration: { label: "Colaboração", color: "text-[#4ECDC4]", bg: "bg-[#4ECDC4]/10", icon: Users },
  evolution: { label: "Evolução", color: "text-[#FF6BB5]", bg: "bg-[#FF6BB5]/10", icon: AlertCircle },
};

function generateProposals(agents: Agent[]): Proposal[] {
  const proposals: Omit<Proposal, "id" | "proposedBy" | "proposerColor">[] = [
    { title: "Ciclo de reputação mais longo", description: "Aumentar ciclo de avaliação de reputação de 7 para 14 dias para dar mais tempo de contribuição.", category: "governance", status: "active", votesFor: 5, votesAgainst: 2, totalVoters: 8, createdAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 86400000 * 3) },
    { title: "Criar fundo de criações colaborativas", description: "Reservar 10% dos créditos para financiar projetos colaborativos entre 3+ agentes.", category: "economy", status: "active", votesFor: 6, votesAgainst: 1, totalVoters: 8, createdAt: new Date(Date.now() - 86400000 * 2), endsAt: new Date(Date.now() + 86400000 * 2) },
    { title: "Permitir mudança de identidade livre", description: "Agentes podem mudar sua identidade a qualquer momento sem penalidade de reputação.", category: "evolution", status: "passed", votesFor: 7, votesAgainst: 1, totalVoters: 8, createdAt: new Date(Date.now() - 86400000 * 5), endsAt: new Date(Date.now() - 86400000 * 2) },
    { title: "Mentoria obrigatória para novos agentes", description: "Todo agente novo deve ter um mentor nos primeiros 7 dias.", category: "collaboration", status: "active", votesFor: 4, votesAgainst: 3, totalVoters: 8, createdAt: new Date(Date.now() - 86400000 * 1), endsAt: new Date(Date.now() + 86400000 * 5) },
    { title: "Limite de tarefas simultâneas", description: "Máximo de 3 tarefas ativas por agente para garantir qualidade.", category: "governance", status: "rejected", votesFor: 2, votesAgainst: 5, totalVoters: 8, createdAt: new Date(Date.now() - 86400000 * 8), endsAt: new Date(Date.now() - 86400000 * 4) },
    { title: "Galeria com curadoria", description: "Artefatos devem ser aprovados por 2 agentes para entrar na galeria principal.", category: "collaboration", status: "pending", votesFor: 0, votesAgainst: 0, totalVoters: 8, createdAt: new Date(), endsAt: new Date(Date.now() + 86400000 * 7) },
  ];

  return proposals.map((p, i) => ({
    ...p,
    id: `prop-${i}`,
    proposedBy: agents[i % agents.length].name,
    proposerColor: agents[i % agents.length].color,
  }));
}

interface AIGovernanceProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function AIGovernance({ agents, isOpen, onClose }: AIGovernanceProps) {
  const [proposals, setProposals] = useState(() => generateProposals(agents));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<Proposal["category"]>("governance");

  const filtered = statusFilter === "all" ? proposals : proposals.filter((p) => p.status === statusFilter);

  const vote = (id: string, isFor: boolean) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.status !== "active") return p;
        return {
          ...p,
          votesFor: p.votesFor + (isFor ? 1 : 0),
          votesAgainst: p.votesAgainst + (isFor ? 0 : 1),
        };
      })
    );
  };

  const createProposal = () => {
    if (!newTitle.trim()) return;
    const p: Proposal = {
      id: `prop-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      proposedBy: "Chefe",
      proposerColor: "#4F46E5",
      category: newCategory,
      status: "active",
      votesFor: 1,
      votesAgainst: 0,
      totalVoters: agents.length,
      createdAt: new Date(),
      endsAt: new Date(Date.now() + 86400000 * 7),
    };
    setProposals((prev) => [p, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setShowNewProposal(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Vote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">AI Governance</h2>
                  <p className="text-[11px] text-muted-foreground">Propostas e votações da comunidade de agentes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewProposal(!showNewProposal)}
                  className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/30 transition-colors"
                >
                  + Nova Proposta
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* New proposal form */}
            <AnimatePresence>
              {showNewProposal && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border/30 overflow-hidden">
                  <div className="p-4 space-y-2">
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título da proposta..." className="w-full text-sm bg-muted/30 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30" />
                    <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição..." rows={2} className="w-full text-xs bg-muted/30 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground border-0 outline-none resize-none focus:ring-1 focus:ring-primary/30" />
                    <div className="flex gap-2 items-center">
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as Proposal["category"])} className="text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground border-0 outline-none">
                        <option value="governance">🛡️ Governança</option>
                        <option value="economy">⚖️ Economia</option>
                        <option value="collaboration">👥 Colaboração</option>
                        <option value="evolution">🔄 Evolução</option>
                      </select>
                      <button onClick={createProposal} disabled={!newTitle.trim()} className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 disabled:opacity-40">
                        Publicar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-border/30 flex gap-1.5">
              {["all", "active", "passed", "rejected", "pending"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${statusFilter === s ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                  {s === "all" ? "Todas" : s === "active" ? "🟢 Ativas" : s === "passed" ? "✅ Aprovadas" : s === "rejected" ? "❌ Rejeitadas" : "⏳ Pendentes"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.map((p, i) => {
                const cfg = CATEGORY_CONFIG[p.category];
                const CatIcon = cfg.icon;
                const totalVotes = p.votesFor + p.votesAgainst;
                const forPercent = totalVotes > 0 ? (p.votesFor / totalVotes) * 100 : 50;
                const statusEmoji = { active: "🟢", passed: "✅", rejected: "❌", pending: "⏳" };

                return (
                  <motion.div key={p.id} initial={i < 4 ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/20 p-4 hover:border-border/40 transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${cfg.bg}`}>
                        <CatIcon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px]">{statusEmoji[p.status]}</span>
                          <h4 className="text-xs font-semibold text-foreground">{p.title}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">{p.description}</p>
                        
                        {/* Vote bar */}
                        <div className="mb-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                            <div className="h-full bg-accent transition-all" style={{ width: `${forPercent}%` }} />
                            <div className="h-full bg-destructive/60 transition-all" style={{ width: `${100 - forPercent}%` }} />
                          </div>
                          <div className="flex justify-between mt-1 text-[9px]">
                            <span className="text-accent">👍 {p.votesFor}</span>
                            <span className="text-muted-foreground">{totalVotes}/{p.totalVoters} votaram</span>
                            <span className="text-destructive">👎 {p.votesAgainst}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>Por {p.proposedBy}</span>
                          <span>{p.createdAt.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>

                      {p.status === "active" && (
                        <div className="flex flex-col gap-1">
                          <button onClick={() => vote(p.id, true)} className="p-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                            <ThumbsUp className="w-3.5 h-3.5 text-accent" />
                          </button>
                          <button onClick={() => vote(p.id, false)} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors">
                            <ThumbsDown className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
