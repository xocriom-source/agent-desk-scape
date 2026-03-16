import { useState } from "react";
import { X, TrendingUp, DollarSign, Building2, Send, MessageSquare, ShoppingCart, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Business {
  id: string;
  name: string;
  category: string;
  description: string | null;
  mrr: number;
  growth_percent: number;
  sale_price: number | null;
  revenue_multiple: number;
  founder_name: string;
  status: string;
  building_id: string | null;
  owner_id: string;
  product_url: string | null;
}

interface Props {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  saas: "bg-blue-500/20 text-blue-400",
  ecommerce: "bg-green-500/20 text-green-400",
  agency: "bg-purple-500/20 text-purple-400",
  tool: "bg-amber-500/20 text-amber-400",
  startup: "bg-rose-500/20 text-rose-400",
  marketplace: "bg-cyan-500/20 text-cyan-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  ecommerce: "E-commerce",
  agency: "Agência",
  tool: "Ferramenta",
  startup: "Startup",
  marketplace: "Marketplace",
};

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}k`;
  return `R$ ${n.toFixed(0)}`;
}

export function BusinessDetailPanel({ business, isOpen, onClose }: Props) {
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!business || !isOpen) return null;

  const catColor = CATEGORY_COLORS[business.category] || "bg-muted text-muted-foreground";
  const catLabel = CATEGORY_LABELS[business.category] || business.category;

  const handleBuy = () => {
    toast.info("🏢 Compra direta será implementada em breve!", { description: "Use 'Fazer Oferta' para negociar." });
  };

  const handleSendOffer = async () => {
    if (!offerAmount || Number(offerAmount) <= 0) {
      toast.error("Informe um valor válido para a oferta.");
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para enviar ofertas."); return; }

      const { error } = await supabase.from("business_offers").insert({
        business_id: business.id,
        from_user_id: user.id,
        offer_amount: Number(offerAmount),
        message: offerMessage || null,
      });
      if (error) throw error;
      toast.success("✅ Oferta enviada com sucesso!", { description: `${formatCurrency(Number(offerAmount))} para ${business.name}` });
      setShowOffer(false);
      setOfferAmount("");
      setOfferMessage("");
    } catch (e: any) {
      toast.error("Erro ao enviar oferta", { description: e.message });
    } finally {
      setSending(false);
    }
  };

  const annualRevenue = business.mrr * 12;

  return (
    <>
      <div className={`fixed inset-y-0 right-0 w-full max-w-md z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full glass-panel border-l border-border/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border/30 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-lg text-foreground truncate">{business.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={catColor}>{catLabel}</Badge>
                <span className="text-xs text-muted-foreground">por {business.founder_name}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Description */}
            {business.description && (
              <div className="bg-muted/20 rounded-xl p-3">
                <p className="text-sm text-foreground/80 leading-relaxed">{business.description}</p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={DollarSign} label="MRR" value={formatCurrency(business.mrr)} color="text-emerald-400" />
              <MetricCard icon={TrendingUp} label="Crescimento" value={`${business.growth_percent}%`} color={business.growth_percent > 0 ? "text-emerald-400" : "text-red-400"} />
              <MetricCard icon={DollarSign} label="Receita Anual" value={formatCurrency(annualRevenue)} color="text-blue-400" />
              <MetricCard icon={Briefcase} label="Múltiplo" value={`${business.revenue_multiple}x`} color="text-amber-400" />
            </div>

            {/* Price */}
            {business.sale_price && (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <span className="text-xs text-muted-foreground block mb-1">Preço de Venda</span>
                <span className="text-2xl font-display font-bold text-foreground">{formatCurrency(business.sale_price)}</span>
              </div>
            )}

            {business.product_url && (
              <a href={business.product_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                🔗 Ver produto
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border/30 space-y-2">
            <Button onClick={handleBuy} className="w-full" size="lg">
              <ShoppingCart className="w-4 h-4 mr-2" /> Comprar Negócio
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowOffer(true)}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Fazer Oferta
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => toast.info("💬 Chat com fundador em breve!")}>
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Contatar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Dialog */}
      <Dialog open={showOffer} onOpenChange={setShowOffer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fazer Oferta - {business.name}</DialogTitle>
            <DialogDescription>Envie uma proposta ao fundador {business.founder_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Valor da Oferta (R$)</label>
              <Input type="number" placeholder="Ex: 500000" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Mensagem (opcional)</label>
              <Textarea placeholder="Descreva sua proposta..." value={offerMessage} onChange={e => setOfferMessage(e.target.value)} rows={3} />
            </div>
            <Button onClick={handleSendOffer} disabled={sending} className="w-full">
              {sending ? "Enviando..." : "Enviar Oferta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string; color: string }) {
  return (
    <div className="bg-muted/20 rounded-xl p-3 flex items-center gap-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <span className="text-[10px] text-muted-foreground block">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}
