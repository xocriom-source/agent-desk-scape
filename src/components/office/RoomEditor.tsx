import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Edit3, Check, Home, Maximize2, Palette } from "lucide-react";
import type { RoomDef } from "@/data/officeMap";

const ROOM_COLORS = [
  { floor: "#E2D6C0", carpet: "#C8BCA8", label: "Madeira" },
  { floor: "#C8CCE0", carpet: "#B0B8D8", label: "Azul" },
  { floor: "#CEE0C4", carpet: "#B8D4AC", label: "Verde" },
  { floor: "#D8D0D0", carpet: "#C0B8B8", label: "Cinza" },
  { floor: "#E4DCC8", carpet: "#D0C8B4", label: "Bege" },
  { floor: "#E0D4E8", carpet: "#C8BCD8", label: "Roxo" },
  { floor: "#D0E0D8", carpet: "#A8C8BC", label: "Menta" },
  { floor: "#E8D0C8", carpet: "#D4B8AC", label: "Coral" },
];

const ROOM_PRESETS = [
  { name: "Escritório", icon: "🖥️", w: 10, h: 8 },
  { name: "Sala de Reunião", icon: "📋", w: 8, h: 6 },
  { name: "Lounge", icon: "☕", w: 8, h: 7 },
  { name: "Servidor", icon: "🖧", w: 6, h: 5 },
  { name: "Biblioteca", icon: "📚", w: 7, h: 5 },
  { name: "Sala Zen", icon: "🧘", w: 6, h: 6 },
];

interface RoomEditorProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomDef[];
  onUpdateRooms: (rooms: RoomDef[]) => void;
}

export function RoomEditor({ isOpen, onClose, rooms, onUpdateRooms }: RoomEditorProps) {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);

  const handleDeleteRoom = (id: string) => {
    onUpdateRooms(rooms.filter(r => r.id !== id));
  };

  const handleUpdateRoom = (id: string, updates: Partial<RoomDef>) => {
    onUpdateRooms(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleAddRoom = (preset: typeof ROOM_PRESETS[0], colorIdx: number) => {
    const color = ROOM_COLORS[colorIdx];
    const id = `room-${Date.now()}`;
    // Find a free position
    let px = 1, py = 1;
    let found = false;
    for (let y = 1; y < 20 && !found; y += 2) {
      for (let x = 1; x < 30 && !found; x += 2) {
        const occupied = rooms.some(r =>
          x < r.x + r.w + 2 && x + preset.w + 2 > r.x &&
          y < r.y + r.h + 2 && y + preset.h + 2 > r.y
        );
        if (!occupied) {
          px = x;
          py = y;
          found = true;
        }
      }
    }

    const newRoom: RoomDef = {
      id,
      name: `${preset.icon} ${newRoomName || preset.name}`,
      x: px,
      y: py,
      w: preset.w,
      h: preset.h,
      floorColor: color.floor,
      wallColor: "#7C8CA0",
      carpetColor: color.carpet,
    };
    onUpdateRooms([...rooms, newRoom]);
    setShowAddRoom(false);
    setNewRoomName("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-border max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Editor de Escritório</h2>
                  <p className="text-xs text-muted-foreground">Crie e personalize as salas do seu escritório virtual</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Room list */}
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: room.floorColor }}
                      >
                        {room.name.match(/\p{Emoji}/u)?.[0] || "🏠"}
                      </div>
                      <div>
                        {editingRoom === room.id ? (
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => handleUpdateRoom(room.id, { name: e.target.value })}
                            onBlur={() => setEditingRoom(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingRoom(null)}
                            className="text-sm font-medium bg-muted px-2 py-1 rounded-lg border border-border text-foreground outline-none"
                            autoFocus
                          />
                        ) : (
                          <h3 className="text-sm font-display font-bold text-foreground">{room.name}</h3>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {room.w}×{room.h} tiles • Pos: ({room.x}, {room.y})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRoom(room.id)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Renomear"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Size controls */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Tamanho:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateRoom(room.id, { w: Math.max(4, room.w - 1) })}
                          className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70"
                        >-</button>
                        <span className="text-xs text-foreground font-mono w-6 text-center">{room.w}</span>
                        <button
                          onClick={() => handleUpdateRoom(room.id, { w: Math.min(16, room.w + 1) })}
                          className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70"
                        >+</button>
                      </div>
                      <span className="text-muted-foreground">×</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateRoom(room.id, { h: Math.max(3, room.h - 1) })}
                          className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70"
                        >-</button>
                        <span className="text-xs text-foreground font-mono w-6 text-center">{room.h}</span>
                        <button
                          onClick={() => handleUpdateRoom(room.id, { h: Math.min(12, room.h + 1) })}
                          className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70"
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Color */}
                  <div className="mt-3 flex items-center gap-2">
                    <Palette className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Piso:</span>
                    <div className="flex gap-1">
                      {ROOM_COLORS.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleUpdateRoom(room.id, {
                            floorColor: c.floor,
                            carpetColor: c.carpet,
                          })}
                          className={`w-5 h-5 rounded-md border transition-all ${
                            room.floorColor === c.floor ? "border-primary ring-1 ring-primary/30 scale-110" : "border-border"
                          }`}
                          style={{ backgroundColor: c.floor }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add room */}
              {!showAddRoom ? (
                <button
                  onClick={() => setShowAddRoom(true)}
                  className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 p-6 flex flex-col items-center gap-2 transition-colors group"
                >
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium">
                    Adicionar Nova Sala
                  </span>
                </button>
              ) : (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
                  <h4 className="font-display font-bold text-foreground text-sm">Nova Sala</h4>

                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Nome da sala (opcional)"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    {ROOM_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleAddRoom(preset, 0)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <div>
                          <span className="text-xs font-medium text-foreground block">{preset.name}</span>
                          <span className="text-[10px] text-muted-foreground">{preset.w}×{preset.h}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAddRoom(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                Aplicar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
