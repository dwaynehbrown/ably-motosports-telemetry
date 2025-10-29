// v1
"use client";
import { useEffect, useRef, useState } from "react";
import { getChannel, getRealtime } from "./ablyClient";

export type LapEvt = { carId: string; lap: number; time: number; ts: number };

export function useHydratedLaps(car: "A" | "B", rewind = "2m") {
  const [laps, setLaps] = useState<LapEvt[]>([]);
  const attachedRef = useRef(false);
  const channelNameRef = useRef<string>("");
  const handlerRef = useRef<((msg: any) => void) | null>(null);

  // attach + subscribe with rewind
  async function attachAndHydrate() {
    const raceId = process.env.NEXT_PUBLIC_RACE_ID || "demo-123";
    const name = `race:${raceId}:car:${car}:lap`;
    channelNameRef.current = name;

    const ch = getChannel(name, { params: { rewind } });

    // Clean up previous subscription if exists
    if (attachedRef.current && handlerRef.current) {
      ch.unsubscribe(handlerRef.current);
      await ch.detach();
      attachedRef.current = false;
    }

    // Create new handler function
    const onMsg = (msg: any) => {
      const data = msg.data as LapEvt;
      setLaps(prev => [...prev, data].slice(-10));
    };
    handlerRef.current = onMsg;

    // Explicitly attach with new params
    await ch.attach();
    ch.subscribe(onMsg);
    attachedRef.current = true;
  }

  useEffect(() => {
    attachAndHydrate();

    // Rehydrate after reconnects (offline -> online, suspended -> connected)
    const rt = getRealtime();
    const onConnChange = (stateChange: any) => {
      const current = stateChange.current;
      const previous = stateChange.previous;
      
      // After any non-connected -> connected transition, re-hydrate laps
      if (current === "connected" && 
          previous && 
          previous !== "connected") {
        attachAndHydrate();
      }
    };
    
    rt.connection.on(onConnChange);

    return () => {
      rt.connection.off(onConnChange);
      // best-effort cleanup: unsubscribe current channel
      const name = channelNameRef.current;
      if (name && handlerRef.current) {
        const ch = getChannel(name);
        ch.unsubscribe(handlerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car, rewind]);

  return laps;
}

