// v1
"use client";
import { useEffect, useRef, useState } from "react";
import type { Realtime } from "ably";
import { getRealtime } from "./ablyClient"; // should return Realtime (non-promises)

export function useOfflineWindow() {
  const rt: Realtime = getRealtime();
  const [state, setState] = useState(rt.connection.state);
  const offlineStartRef = useRef<number | null>(null);
  const reconnectAtRef  = useRef<number | null>(null);

  useEffect(() => {
    const onChange = (chg: any) => {
      setState(chg.current);
      // left connected -> mark start
      if (chg.previous === "connected" && chg.current !== "connected") {
        offlineStartRef.current = Date.now();
      }
      // reconnected -> mark end
      if (chg.current === "connected") {
        reconnectAtRef.current = Date.now();
      }
    };
    rt.connection.on(onChange);
    return () => rt.connection.off(onChange);
  }, [rt]);

  const isRecovered = (ts?: number) => {
    if (!ts) return false;
    const s = offlineStartRef.current;
    const e = reconnectAtRef.current;
    return !!(s && e && ts >= s && ts <= e);
  };

  // Reset offline window after recovery is complete
  // Call this after displaying the recovery banner to prevent stale windows
  const resetWindow = () => {
    offlineStartRef.current = null;
    reconnectAtRef.current = null;
  };

  return { state, offlineStart: offlineStartRef.current, reconnectAt: reconnectAtRef.current, isRecovered, resetWindow };
}