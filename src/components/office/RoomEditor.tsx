import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Edit3, Check, Home, Maximize2, Palette, Lock, Unlock, DoorOpen, ChevronRight, Armchair, Monitor, Lamp, Coffee, BookOpen, Server, Gamepad2, FlowerIcon, Sofa, Table, ChevronDown } from "lucide-react";
import type { RoomDef } from "@/data/officeMap";
import type { FurnitureItem } from "@/data/officeMap";

const ROOM_COLORS = [
  { floor: "#E2D6C0", wall: "#8B95A8", carpet: "#C8BCA8", label: "Madeira" },
  { floor: "#C8CCE0", wall: "#7B85A0", carpet: "#B0B8D8", label: "Azul" },
  { floor: "#CEE0C4", wall: "#6B9080", carpet: "#B8D4AC", label: "Verde" },
  { floor: "#D8D0D0", wall: "#808088", carpet: "#C0B8B8", label: "Cinza" },
  { floor: "#E4DCC8", wall: "#9B8B70", carpet: "#D0C8B4", label: "Bege" },
  { floor: "#E0D4E8", wall: "#7B70A0", carpet: "#C8BCD8", label: "Roxo" },
  { floor: "#D0E0D8", wall: "#608870", carpet: "#A8C8BC", label: "Menta" },
  { floor: "#E8D0C8", wall: "#A07868", carpet: "#D4B8AC", label: "Coral" },
  { floor: "#1A1A2E", wall: "#2D2D44", carpet: "#252540", label: "Escuro" },
  { floor: "#F5F0E8", wall: "#C8C0B0", carpet: "#E8E0D4", label: "Claro" },
];

const ROOM_PRESETS = [
  { name: "Escritório", icon: "🖥️", w: 12, h: 8 },
  { name: "Sala de Reunião", icon: "📋", w: 8, h: 6 },
  { name: "Lounge / Copa", icon: "☕", w: 10, h: 7 },
  { name: "Servidor", icon: "🖧", w: 6, h: 5 },
  { name: "Biblioteca", icon: "📚", w: 8, h: 6 },
  { name: "Sala Zen", icon: "🧘", w: 7, h: 6 },
  { name: "Game Room", icon: "🎮", w: 8, h: 7 },
  { name: "Recepção", icon: "🏢", w: 12, h: 6 },
  { name: "Sala Privativa", icon: "🔒", w: 5, h: 4 },
  { name: "Sala do Chefe", icon: "👑", w: 8, h: 6 },
];

const FURNITURE_CATALOG: { category: string; icon: React.ReactNode; items: { type: string; emoji: string; label: string }[] }[] = [
  {
    category: "Mesas & Cadeiras",
    icon: <Table className="w-4 h-4" />,
    items: [
      { type: "desk", emoji: "🖥️", label: "Mesa com PC" },
      { type: "chair", emoji: "🪑", label: "Cadeira" },
      { type: "table", emoji: "📋", label: "Mesa simples" },
      { type: "desk_large", emoji: "💼", label: "Mesa grande" },
    ],
  },
  {
    category: "Eletrônicos",
    icon: <Monitor className="w-4 h-4" />,
    items: [
      { type: "monitor", emoji: "🖥️", label: "Monitor" },
      { type: "screen", emoji: "📺", label: "TV / Tela" },
      { type: "printer", emoji: "🖨️", label: "Impressora" },
      { type: "server", emoji: "🖧", label: "Servidor" },
      { type: "phone", emoji: "📞", label: "Telefone" },
      { type: "laptop", emoji: "💻", label: "Laptop" },
    ],
  },
  {
    category: "Sofás & Conforto",
    icon: <Sofa className="w-4 h-4" />,
    items: [
      { type: "sofa", emoji: "🛋️", label: "Sofá" },
      { type: "beanbag", emoji: "🫧", label: "Pufe" },
      { type: "rug", emoji: "🟫", label: "Tapete" },
    ],
  },
  {
    category: "Decoração",
    icon: <FlowerIcon className="w-4 h-4" />,
    items: [
      { type: "plant", emoji: "🌿", label: "Planta" },
      { type: "plant_large", emoji: "🪴", label: "Planta grande" },
      { type: "bookshelf", emoji: "📚", label: "Estante" },
      { type: "whiteboard", emoji: "📋", label: "Quadro branco" },
      { type: "painting", emoji: "🖼️", label: "Quadro" },
      { type: "lamp", emoji: "💡", label: "Luminária" },
      { type: "clock", emoji: "🕐", label: "Relógio" },
      { type: "trophy", emoji: "🏆", label: "Troféu" },
    ],
  },
  {
    category: "Copa & Cozinha",
    icon: <Coffee className="w-4 h-4" />,
    items: [
      { type: "coffee", emoji: "☕", label: "Cafeteira" },
      { type: "vending", emoji: "🥤", label: "Vending Machine" },
      { type: "water", emoji: "🚰", label: "Bebedouro" },
      { type: "microwave", emoji: "📦", label: "Microondas" },
      { type: "fridge", emoji: "🧊", label: "Geladeira" },
    ],
  },
  {
    category: "Diversão",
    icon: <Gamepad2 className="w-4 h-4" />,
    items: [
      { type: "arcade", emoji: "🕹️", label: "Arcade" },
      { type: "foosball", emoji: "⚽", label: "Pebolim" },
      { type: "pingpong", emoji: "🏓", label: "Ping-pong" },
      { type: "dartboard", emoji: "🎯", label: "Alvo de dardos" },
    ],
  },
  {
    category: "Estrutura",
    icon: <DoorOpen className="w-4 h-4" />,
    items: [
      { type: "door", emoji: "🚪", label: "Porta" },
      { type: "stairs_up", emoji: "⬆️", label: "Escada (subir)" },
      { type: "stairs_down", emoji: "⬇️", label: "Escada (descer)" },
      { type: "divider", emoji: "🧱", label: "Divisória" },
      { type: "window", emoji: "🪟", label: "Janela" },
      { type: "trash", emoji: "🗑️", label: "Lixeira" },
    ],
  },
];

interface RoomEditorProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomDef[];
  onUpdateRooms: (rooms: RoomDef[]) => void;
  furniture: FurnitureItem[];
  onUpdateFurniture: (items: FurnitureItem[]) => void;
}

type Tab = "rooms" | "furniture" | "structure";

export function RoomEditor({ isOpen, onClose, rooms, onUpdateRooms, furniture, onUpdateFurniture }: RoomEditorProps) {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [tab, setTab] = useState<Tab>("rooms");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [lockedRooms, setLockedRooms] = useState<Set<string>>(new Set());

  const handleDeleteRoom = (id: string) => {
    onUpdateRooms(rooms.filter(r => r.id !== id));
    onUpdateFurniture(furniture.filter(f => f.roomId !== id));
  };

  const handleUpdateRoom = (id: string, updates: Partial<RoomDef>) => {
    onUpdateRooms(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const toggleLock = (roomId: string) => {
    setLockedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const handleAddRoom = (preset: typeof ROOM_PRESETS[0], colorIdx: number) => {
    const color = ROOM_COLORS[colorIdx];
    const id = `room-${Date.now()}`;
    let px = 1, py = 1, found = false;
    for (let y = 1; y < 30 && !found; y += 2) {
      for (let x = 1; x < 40 && !found; x += 2) {
        const occupied = rooms.some(r =>
          x < r.x + r.w + 2 && x + preset.w + 2 > r.x &&
          y < r.y + r.h + 2 && y + preset.h + 2 > r.y
        );
        if (!occupied) { px = x; py = y; found = true; }
      }
    }
    const newRoom: RoomDef = {
      id, name: newRoomName || `${preset.icon} ${preset.name}`,
      x: px, y: py, w: preset.w, h: preset.h,
      floorColor: color.floor, wallColor: color.wall, carpetColor: color.carpet,
    };
    onUpdateRooms([...rooms, newRoom]);
    setShowAddRoom(false);
    setNewRoomName("");
  };

  const addFurnitureToRoom = (roomId: string, type: string, emoji: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    // Find empty spot inside the room
    let placed = false;
    for (let y = room.y + 1; y < room.y + room.h - 1 && !placed; y++) {
      for (let x = room.x + 1; x < room.x + room.w - 1 && !placed; x++) {
        const occupied = furniture.some(f => f.x === x && f.y === y);
        if (!occupied) {
          const item: FurnitureItem = {
            id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type, x, y, emoji, roomId,
          };
          onUpdateFurniture([...furniture, item]);
          placed = true;
        }
      }
    }
  };

  const removeFurniture = (id: string) => {
    onUpdateFurniture(furniture.filter(f => f.id !== id));
  };

  const roomFurniture = selectedRoom ? furniture.filter(f => f.roomId === selectedRoom) : [];

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
            className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Editor de Escritório</h2>
                  <p className="text-xs text-muted-foreground">Salas, mobília, estrutura e personalização completa</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
              {([
                { key: "rooms" as Tab, label: "Salas", icon: <Home className="w-3.5 h-3.5" /> },
                { key: "furniture" as Tab, label: "Mobília", icon: <Armchair className="w-3.5 h-3.5" /> },
                { key: "structure" as Tab, label: "Estrutura", icon: <DoorOpen className="w-3.5 h-3.5" /> },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                    tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {tab === "rooms" && (
                <>
                  {rooms.map((room) => (
                    <div key={room.id} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border border-border" style={{ backgroundColor: room.floorColor }}>
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
                              {room.w}×{room.h} tiles • Pos: ({room.x}, {room.y}) • {furniture.filter(f => f.roomId === room.id).length} itens
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleLock(room.id)}
                            className={`p-2 rounded-lg transition-colors ${lockedRooms.has(room.id) ? "bg-destructive/10 text-destructive" : "hover:bg-muted text-muted-foreground"}`}
                            title={lockedRooms.has(room.id) ? "Desbloquear sala" : "Trancar sala"}
                          >
                            {lockedRooms.has(room.id) ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setEditingRoom(room.id)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Renomear">
                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => { setSelectedRoom(room.id); setTab("furniture"); }} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Adicionar mobília">
                            <Armchair className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Remover">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>

                      {/* Size & Position */}
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Maximize2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Tamanho:</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleUpdateRoom(room.id, { w: Math.max(4, room.w - 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">-</button>
                            <span className="text-xs text-foreground font-mono w-6 text-center">{room.w}</span>
                            <button onClick={() => handleUpdateRoom(room.id, { w: Math.min(20, room.w + 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">+</button>
                          </div>
                          <span className="text-muted-foreground">×</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleUpdateRoom(room.id, { h: Math.max(3, room.h - 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">-</button>
                            <span className="text-xs text-foreground font-mono w-6 text-center">{room.h}</span>
                            <button onClick={() => handleUpdateRoom(room.id, { h: Math.min(16, room.h + 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">+</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Posição:</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleUpdateRoom(room.id, { x: Math.max(1, room.x - 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">←</button>
                            <button onClick={() => handleUpdateRoom(room.id, { x: Math.min(40, room.x + 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">→</button>
                            <button onClick={() => handleUpdateRoom(room.id, { y: Math.max(1, room.y - 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">↑</button>
                            <button onClick={() => handleUpdateRoom(room.id, { y: Math.min(30, room.y + 1) })} className="w-5 h-5 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-muted/70">↓</button>
                          </div>
                        </div>
                      </div>

                      {/* Color */}
                      <div className="mt-3 flex items-center gap-2">
                        <Palette className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Tema:</span>
                        <div className="flex gap-1.5">
                          {ROOM_COLORS.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => handleUpdateRoom(room.id, { floorColor: c.floor, wallColor: c.wall, carpetColor: c.carpet })}
                              className={`w-5 h-5 rounded-md border transition-all ${room.floorColor === c.floor ? "border-primary ring-1 ring-primary/30 scale-110" : "border-border"}`}
                              style={{ backgroundColor: c.floor }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Lock indicator */}
                      {lockedRooms.has(room.id) && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-destructive bg-destructive/5 rounded-lg px-2 py-1 w-fit">
                          <Lock className="w-3 h-3" />
                          Sala trancada — agentes não podem entrar
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add room */}
                  {!showAddRoom ? (
                    <button
                      onClick={() => setShowAddRoom(true)}
                      className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 p-6 flex flex-col items-center gap-2 transition-colors group"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium">Adicionar Nova Sala</span>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      <button onClick={() => setShowAddRoom(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                    </div>
                  )}
                </>
              )}

              {tab === "furniture" && (
                <>
                  {/* Room selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Selecione a sala:</label>
                    <div className="flex flex-wrap gap-2">
                      {rooms.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRoom(r.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedRoom === r.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedRoom && (
                    <>
                      {/* Current furniture in room */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          Itens na sala ({roomFurniture.length}):
                        </h4>
                        {roomFurniture.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">Nenhum item. Adicione abaixo.</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {roomFurniture.map(f => (
                            <div key={f.id} className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 text-xs group">
                              <span>{f.emoji}</span>
                              <span className="text-foreground">{f.type}</span>
                              <button
                                onClick={() => removeFurniture(f.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Catalog */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Catálogo de mobília:</h4>
                        {FURNITURE_CATALOG.map(cat => (
                          <div key={cat.category} className="border border-border rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedCat(expandedCat === cat.category ? null : cat.category)}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {cat.icon}
                                <span className="text-sm font-medium text-foreground">{cat.category}</span>
                                <span className="text-[10px] text-muted-foreground">({cat.items.length})</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCat === cat.category ? "rotate-180" : ""}`} />
                            </button>
                            {expandedCat === cat.category && (
                              <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {cat.items.map(item => (
                                  <button
                                    key={item.type}
                                    onClick={() => addFurnitureToRoom(selectedRoom, item.type, item.emoji)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                                  >
                                    <span className="text-lg">{item.emoji}</span>
                                    <span className="text-xs text-foreground">{item.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {tab === "structure" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <h4 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-primary" />
                      Portas & Acessos
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Selecione uma sala na aba "Mobília" e adicione portas, escadas e divisórias do catálogo de estrutura.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <h4 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Salas Trancadas
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {lockedRooms.size === 0
                        ? "Nenhuma sala trancada. Use o cadeado na aba 'Salas' para trancar."
                        : `${lockedRooms.size} sala(s) trancada(s). Agentes não podem entrar nessas salas.`
                      }
                    </p>
                    {lockedRooms.size > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(lockedRooms).map(id => {
                          const r = rooms.find(r => r.id === id);
                          return r ? (
                            <span key={id} className="flex items-center gap-1 bg-destructive/10 text-destructive rounded-lg px-2 py-1 text-xs">
                              <Lock className="w-3 h-3" />
                              {r.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <h4 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                      🏗️ Andares
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Adicione escadas (Estrutura → Catálogo) para criar acesso entre andares. Funcionalidade de múltiplos andares em breve!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
              <span className="text-[10px] text-muted-foreground">{rooms.length} salas • {furniture.length} itens</span>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                Aplicar Mudanças
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
