import { useState, useEffect, memo } from "react";
import { X, Calendar, MapPin, Users2, Clock, Flame, Music, Code, Palette, Trophy, Megaphone, Star, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EVENT_ICONS: Record<string, typeof Music> = {
  concert: Music, hackathon: Code, exhibition: Palette,
  market: Megaphone, ceremony: Trophy, workshop: Sparkles,
  cultural: Star, social: Users2,
};

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  importance: number | null;
  agents_involved: string[] | null;
  metadata: any;
  created_at: string;
}

interface CityEventsProps {
  agents?: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const CityEvents = memo(function CityEvents({ isOpen, onClose }: CityEventsProps) {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    supabase
      .from("city_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground text-lg">Eventos da Cidade</h2>
              <p className="text-xs text-muted-foreground">{events.length} eventos registrados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : selectedEvent ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedEvent(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                ← Voltar aos eventos
              </button>
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <h3 className="font-display font-bold text-foreground text-xl mb-2">{selectedEvent.title}</h3>
                {selectedEvent.description && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{selectedEvent.description}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">Tipo</div>
                    <div className="text-sm font-medium text-foreground">{selectedEvent.event_type}</div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">Importância</div>
                    <div className="text-sm font-medium text-foreground">{selectedEvent.importance || 1}/10</div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">Data</div>
                    <div className="text-sm font-medium text-foreground">{new Date(selectedEvent.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                </div>
                {selectedEvent.agents_involved && selectedEvent.agents_involved.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Agentes envolvidos</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedEvent.agents_involved.map(a => (
                        <span key={a} className="text-[11px] text-foreground bg-muted px-2 py-1 rounded-lg">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nenhum evento registrado na cidade ainda.
            </div>
          ) : (
            <div className="grid gap-3">
              {events.map(event => {
                const Icon = EVENT_ICONS[event.event_type] || Star;
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-muted/20 hover:bg-muted/40 rounded-xl p-4 border border-border cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-foreground text-sm truncate">{event.title}</h4>
                        {event.description && <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleDateString("pt-BR")}</div>
                        {event.agents_involved && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                            <Users2 className="w-2.5 h-2.5" />{event.agents_involved.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
