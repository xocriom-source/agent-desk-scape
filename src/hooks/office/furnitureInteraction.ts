import { useState, useCallback, useMemo } from "react";
import type { Player } from "@/types/agent";
import { FURNITURE } from "@/data/officeMap";
import type { FurnitureItem } from "@/data/officeMap";
import { tileFromFloat } from "@/hooks/office/movementUtils";

export type InteractionType = "sit" | "use" | "view" | "train" | "relax" | "browse";

export interface FurnitureInteraction {
  furniture: FurnitureItem;
  action: InteractionType;
  label: string;
  emoji: string;
}

const INTERACTION_MAP: Record<string, { action: InteractionType; label: string; emoji: string }> = {
  chair: { action: "sit", label: "Sentar", emoji: "🪑" },
  sofa: { action: "sit", label: "Sentar", emoji: "🛋️" },
  beanbag: { action: "sit", label: "Relaxar", emoji: "🫘" },
  meeting_chair: { action: "sit", label: "Sentar", emoji: "🪑" },
  couch_l: { action: "sit", label: "Deitar", emoji: "🛋️" },
  coffee: { action: "use", label: "Tomar café", emoji: "☕" },
  coffee_bar: { action: "use", label: "Preparar café", emoji: "☕" },
  vending: { action: "use", label: "Comprar", emoji: "🛒" },
  water: { action: "use", label: "Beber água", emoji: "💧" },
  microwave: { action: "use", label: "Esquentar", emoji: "🔥" },
  screen: { action: "view", label: "Visualizar", emoji: "🖥️" },
  tv: { action: "view", label: "Assistir", emoji: "📺" },
  monitor: { action: "view", label: "Usar computador", emoji: "💻" },
  laptop: { action: "view", label: "Abrir laptop", emoji: "💻" },
  whiteboard: { action: "view", label: "Escrever", emoji: "✍️" },
  kanban_board: { action: "view", label: "Gerenciar tarefas", emoji: "📋" },
  treadmill: { action: "train", label: "Correr", emoji: "🏃" },
  dumbbell_rack: { action: "train", label: "Treinar", emoji: "💪" },
  punching_bag: { action: "train", label: "Socar", emoji: "🥊" },
  yoga_mat: { action: "relax", label: "Meditar", emoji: "🧘" },
  arcade: { action: "use", label: "Jogar", emoji: "🕹️" },
  foosball: { action: "use", label: "Jogar", emoji: "⚽" },
  pingpong: { action: "use", label: "Jogar", emoji: "🏓" },
  dartboard: { action: "use", label: "Jogar", emoji: "🎯" },
  bookshelf: { action: "browse", label: "Ler", emoji: "📚" },
  aquarium: { action: "view", label: "Observar", emoji: "🐠" },
  fridge: { action: "use", label: "Abrir", emoji: "🧊" },
};

const INTERACTION_RANGE = 2;

export function useFurnitureInteraction(player: Player, furniture: FurnitureItem[]) {
  const [activeInteraction, setActiveInteraction] = useState<FurnitureInteraction | null>(null);
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null);

  const nearbyInteractable = useMemo(() => {
    const pTile = tileFromFloat(player.x, player.y);
    let closest: FurnitureInteraction | null = null;
    let closestDist = Infinity;

    for (const f of furniture) {
      const interaction = INTERACTION_MAP[f.type];
      if (!interaction) continue;
      const dist = Math.abs(f.x - pTile.x) + Math.abs(f.y - pTile.y);
      if (dist <= INTERACTION_RANGE && dist < closestDist) {
        closestDist = dist;
        closest = { furniture: f, ...interaction };
      }
    }
    return closest;
  }, [player.x, player.y, furniture]);

  const interact = useCallback(() => {
    if (!nearbyInteractable) return;
    const { emoji, label, furniture: f } = nearbyInteractable;
    setActiveInteraction(nearbyInteractable);
    setInteractionMessage(`${emoji} ${label}...`);
    
    // Auto-clear interaction after a few seconds
    setTimeout(() => {
      setActiveInteraction(null);
      setInteractionMessage(null);
    }, 3000);
  }, [nearbyInteractable]);

  return {
    nearbyInteractable,
    activeInteraction,
    interactionMessage,
    interact,
  };
}
