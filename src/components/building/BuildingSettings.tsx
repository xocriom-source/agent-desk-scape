import { useState } from "react";
import { Settings2, Save, Plus, X, Link2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuildingSettingsProps {
  buildingId: string;
  metadata: Record<string, any>;
  onUpdate: (metadata: Record<string, any>) => void;
}

export function BuildingSettings({ buildingId, metadata, onUpdate }: BuildingSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bio, setBio] = useState(metadata.bio || "");
  const [links, setLinks] = useState<string[]>(metadata.links || []);
  const [newLink, setNewLink] = useState("");
  const [saving, setSaving] = useState(false);

  const addLink = () => {
    if (!newLink.trim()) return;
    setLinks(prev => [...prev, newLink.trim()]);
    setNewLink("");
  };

  const removeLink = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = { ...metadata, bio, links };
    const { error } = await supabase
      .from("city_buildings")
      .update({ metadata: updated as any })
      .eq("id", buildingId);

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas!");
      onUpdate(updated);
    }
    setSaving(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors w-full"
      >
        <Settings2 className="w-4 h-4" />
        Personalizar Assistente & Info
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          Configurações do Prédio
        </h3>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Bio */}
        <div>
          <label className="text-[10px] font-mono font-bold text-muted-foreground block mb-1.5 flex items-center gap-1">
            <FileText className="w-3 h-3" /> BIO / DESCRIÇÃO
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Descreva sua empresa, serviços, produtos..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-[9px] text-muted-foreground mt-1">A IA recepcionista usará essa bio para responder visitantes.</p>
        </div>

        {/* Links */}
        <div>
          <label className="text-[10px] font-mono font-bold text-muted-foreground block mb-1.5 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> LINKS & PORTFÓLIO
          </label>
          <div className="space-y-1.5 mb-2">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                <Link2 className="w-3 h-3 text-primary shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{link}</span>
                <button onClick={() => removeLink(i)} className="p-0.5 rounded hover:bg-accent">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newLink}
              onChange={e => setNewLink(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addLink()}
              placeholder="https://..."
              className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={addLink} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
