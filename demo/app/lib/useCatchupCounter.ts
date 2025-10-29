// v1
"use client";
import { useEffect, useRef, useState } from "react";
import type { Realtime } from "ably";
import { getRealtime } from "./ablyClient";

// FIXED: Recovery counter logic to prevent over-counting
// - Tighten window to 1000ms (was 3000ms) to reduce false positives
// - Auto-reset count after window expires
// - Only count messages that arrive within recovery window after reconnect
export function useCatchupCounter(windowMs = 1000) {
  const rt: Realtime = getRealtime();
  const [recovering, setRecovering] = useState(false);
  const [count, setCount] = useState(0);
  const untilRef = useRef<number>(0);

  useEffect(() => {
    const onChange = (chg: any) => {
      if (chg.current === "connected") {
        setRecovering(true);
        setCount(0);
        untilRef.current = Date.now() + windowMs;
        // Auto-reset after window expires
        setTimeout(() => {
          setRecovering(false);
          setCount(0);
        }, windowMs + 100);
      }
    };
    rt.connection.on(onChange);
    return () => rt.connection.off(onChange);
  }, [rt, windowMs]);

  const markIfRecovered = () => {
    if (recovering && Date.now() <= untilRef.current) {
      setCount(n => n + 1);
      return true;
    }
    return false;
  };

  // Manual reset function for explicit cleanup
  const reset = () => {
    setRecovering(false);
    setCount(0);
  };

  return { recovering, count, markIfRecovered, reset };
}