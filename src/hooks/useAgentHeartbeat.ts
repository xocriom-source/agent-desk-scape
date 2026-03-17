import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Triggers the agent-heartbeat edge function periodically.
 * This makes agents generate REAL AI content (thoughts, artifacts).
 * Runs every 2 minutes when the user is in the office.
 */
export function useAgentHeartbeat(enabled: boolean, buildingId?: string) {
  const { user } = useAuth();
  const lastRunRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runHeartbeat = useCallback(async () => {
    if (!user || !enabled) return;
    
    const now = Date.now();
    // Don't run more than once per 2 minutes
    if (now - lastRunRef.current < 120000) return;
    lastRunRef.current = now;

    try {
      const { data, error } = await supabase.functions.invoke("agent-heartbeat", {
        body: { building_id: buildingId },
      });

      if (error) {
        console.error("Heartbeat error:", error);
        return;
      }

      if (data?.actions) {
        console.log(`[Heartbeat] ${data.actions.length} agents updated`, data.actions);
      }
    } catch (err) {
      console.error("Heartbeat failed:", err);
    }
  }, [user, enabled, buildingId]);

  useEffect(() => {
    if (!enabled || !user) return;

    // Run immediately on mount
    runHeartbeat();

    // Then every 2 minutes
    intervalRef.current = setInterval(runHeartbeat, 120000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, user, runHeartbeat]);
}
