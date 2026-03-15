import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Tag, Copy, Trash2, Search, Eye, EyeOff, Hash } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  version: number;
  is_public: boolean;
  usage_count: number;
}

const CATEGORIES = [
  { id: "all", name: "Todos", emoji: "📚" },
  { id: "general", name: "Geral", emoji: "📝" },
  { id: "coding", name: "Código", emoji: "💻" },
  { id: "marketing", name: "Marketing", emoji: "📣" },
  { id: "sales", name: "Vendas", emoji: "💰" },
  { id: "research", name: "Pesquisa", emoji: "🔍" },
  { id: "creative", name: "Criativo", emoji: "🎨" },
];

interface Props {
  prompts: Prompt[];
  onAdd: (p: { title: string; content: string; category: string; tags: string[]; is_public: boolean }) => void;
  onRemove: (id: string) => void;
  onUse: (id: string) => void;
}

export function PromptLibrary({ prompts, onAdd, onRemove, onUse }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "", is_public: false });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = prompts;
    if (category !== "all") items = items.filter(p => p.category === category);
    if (search) items = items.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase())));
    return items;
  }, [prompts, category, search]);

  const handleAdd = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    onAdd({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) });
    setForm({ title: "", content: "", category: "general", tags: "", is_public: false });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Biblioteca de Prompts ({prompts.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
          <Plus className="w-3 h-3" />
          Novo Prompt
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar prompts..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${category === c.id ? "bg-primary/20 text-primary" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do prompt..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Conteúdo do prompt..." rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary resize-none" />
            <div className="flex gap-2">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary">
                {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (separar por vírgula)" className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded border-gray-600" />
              Tornar público na comunidade
            </label>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">Salvar Prompt</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-xs hover:text-white transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            {search || category !== "all" ? "Nenhum prompt encontrado" : "Biblioteca vazia — crie seu primeiro prompt"}
          </div>
        )}
        {filtered.map(prompt => (
          <motion.div key={prompt.id} layout className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)} className="w-full p-3 flex items-center gap-3 text-left">
              <span className="text-lg">{CATEGORIES.find(c => c.id === prompt.category)?.emoji || "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{prompt.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>v{prompt.version}</span>
                  <span>• {prompt.usage_count}x usado</span>
                  {prompt.is_public && <span className="text-emerald-400">• Público</span>}
                </div>
              </div>
              {prompt.tags.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {prompt.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </button>
            <AnimatePresence>
              {expanded === prompt.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{prompt.content}</pre>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(prompt.content); onUse(prompt.id); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
                        <Copy className="w-3 h-3" />Copiar & Usar
                      </button>
                      <button onClick={() => onRemove(prompt.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-3 h-3" />Remover
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
