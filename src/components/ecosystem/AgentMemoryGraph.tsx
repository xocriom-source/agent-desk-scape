import { useMemo } from "react";
import { motion } from "framer-motion";
import { Network, Users, ArrowRight } from "lucide-react";

const AGENTS = [
  { id: "nova", name: "Nova", x: 50, y: 30, color: "#a78bfa", size: 40 },
  { id: "atlas", name: "Atlas", x: 30, y: 60, color: "#60a5fa", size: 45 },
  { id: "pixel", name: "Pixel", x: 70, y: 55, color: "#f472b6", size: 35 },
  { id: "coder", name: "Coder-X", x: 20, y: 35, color: "#34d399", size: 38 },
  { id: "harmony", name: "Harmony", x: 80, y: 30, color: "#fbbf24", size: 32 },
  { id: "scribe", name: "Scribe", x: 55, y: 75, color: "#fb923c", size: 36 },
  { id: "monitor", name: "Monitor", x: 40, y: 85, color: "#818cf8", size: 30 },
  { id: "echo", name: "Echo", x: 75, y: 80, color: "#22d3ee", size: 28 },
];

const CONNECTIONS = [
  { from: "nova", to: "atlas", strength: 5, label: "89 colabs" },
  { from: "nova", to: "harmony", strength: 3, label: "34 colabs" },
  { from: "atlas", to: "coder", strength: 4, label: "56 colabs" },
  { from: "atlas", to: "scribe", strength: 4, label: "45 colabs" },
  { from: "pixel", to: "nova", strength: 3, label: "28 colabs" },
  { from: "pixel", to: "coder", strength: 2, label: "15 colabs" },
  { from: "scribe", to: "monitor", strength: 3, label: "31 colabs" },
  { from: "monitor", to: "echo", strength: 2, label: "12 colabs" },
  { from: "harmony", to: "echo", strength: 2, label: "18 colabs" },
  { from: "coder", to: "monitor", strength: 3, label: "22 colabs" },
];

export function AgentMemoryGraph() {
  const agentMap = useMemo(() => {
    const m: Record<string, typeof AGENTS[0]> = {};
    AGENTS.forEach(a => { m[a.id] = a; });
    return m;
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Network className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Grafo de Memória dos Agentes</h2>
      </div>

      {/* Graph Visualization */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-[400px]" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Connections */}
          {CONNECTIONS.map((conn, i) => {
            const from = agentMap[conn.from];
            const to = agentMap[conn.to];
            if (!from || !to) return null;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={from.color}
                  strokeWidth={conn.strength * 0.15}
                  strokeOpacity={0.3}
                />
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 1}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize="1.8"
                >{conn.label}</text>
              </g>
            );
          })}

          {/* Agents */}
          {AGENTS.map(agent => (
            <g key={agent.id}>
              <circle cx={agent.x} cy={agent.y} r={agent.size / 10} fill={agent.color} fillOpacity={0.15} stroke={agent.color} strokeWidth={0.3}>
                <animate attributeName="r" values={`${agent.size / 10};${agent.size / 10 + 0.5};${agent.size / 10}`} dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={agent.x} cy={agent.y} r={agent.size / 20} fill={agent.color} />
              <text x={agent.x} y={agent.y + agent.size / 10 + 3} textAnchor="middle" fill="white" fontSize="2.5" fontWeight="bold">{agent.name}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2">
        {AGENTS.map(agent => (
          <div key={agent.id} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
            <span className="text-[10px] text-white font-medium">{agent.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
