import { useCallback, useState } from "react";

export type PanelName =
  | "feed" | "tasks" | "messaging" | "gallery" | "studios"
  | "analytics" | "marketplace" | "governance" | "memory"
  | "command" | "artifacts" | "npcs" | "observation"
  | "districts" | "events" | "cityChat"
  | "customizer" | "roomEditor";

export function usePanelState() {
  const [openPanel, setOpenPanel] = useState<PanelName | null>(null);

  const open = useCallback((panel: PanelName) => setOpenPanel(panel), []);
  const close = useCallback(() => setOpenPanel(null), []);
  const isOpen = useCallback((panel: PanelName) => openPanel === panel, [openPanel]);

  return { openPanel, open, close, isOpen };
}
