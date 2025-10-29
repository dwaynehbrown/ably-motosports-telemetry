//  v2
import { useEffect, useState } from "react";
import { getChannel } from "./ablyClient";

export type BootMeta = {
  raceId: string;
  carId: string;
  firstSeenTs: number;
  publisher?: { version?: string; host?: string };
};

/** Fetch historical boot metadata from the last 50 events, deduplicated by car */
export async function fetchBootMeta(raceId: string): Promise<Record<string, BootMeta>> {
  const ch = getChannel(`race:${raceId}:meta`);
  const page = await ch.history({ direction: "backwards", limit: 50 });
  const out: Record<string, BootMeta> = {};
  for (const m of page.items) {
    const d = m.data as BootMeta;
    if (m.name === "boot" && d?.carId && !out[d.carId]) {
      out[d.carId] = d; // keep newest boot per car
    }
  }
  return out;
}

/** Set up race control channel subscription and call onUpdate when start/end events occur */
export async function setupRaceControl(raceId: string, onUpdate: (state: "running" | "finished", event: string, timestamp: number) => void) {
  const chControl = getChannel(`race:${raceId}:control`);
  await chControl.attach();
  
  // Fetch recent history to get current race state
  try {
    const page = await chControl.history({ direction: "backwards", limit: 5 });
    console.log("BootMetaBar: Fetched history, items:", page.items.length);
    for (const m of page.items) {
      console.log("BootMetaBar: History item:", m.name, "timestamp:", new Date(m.timestamp).toISOString());
      if (m.name === "end") {
        console.log("BootMetaBar: Found 'end' in history, setting state to finished");
        onUpdate("finished", "end_race", m.timestamp);
        // Don't break - continue to look for start time
      } else if (m.name === "start") {
        console.log("BootMetaBar: Found 'start' in history, setting state to running");
        onUpdate("running", "start_race", m.timestamp);
        // Don't break - continue to look for end time
      }
    }
  } catch (e) {
    console.error("Failed to fetch race control history:", e);
  }
  
  // Subscribe to new messages
  chControl.subscribe((msg) => {
    console.log("BootMetaBar: Received control message:", msg.name);
    if (msg.name === "start") {
      console.log("BootMetaBar: Calling onUpdate('running')");
      onUpdate("running", "start_race", msg.timestamp);
    } else if (msg.name === "end") {
      console.log("BootMetaBar: Calling onUpdate('finished')");
      onUpdate("finished", "end_race", msg.timestamp);
    }
  });
  
  console.log("BootMetaBar: Subscribed to control channel");
  return chControl;
}

export type RaceState = "idle" | "running" | "finished";
export type RaceEvent = { timestamp: number; action: string };

export function useRaceControl(raceId: string) {
  const [raceState, setRaceState] = useState<RaceState>("idle");
  const [lastEvent, setLastEvent] = useState<RaceEvent | null>(null);

  useEffect(() => {
    const chControl = getChannel(`race:${raceId}:control`);
    chControl.attach().then(() => {
      chControl.subscribe((msg) => {
        if (msg.name === "start") {
          setRaceState("running");
          setLastEvent({ timestamp: Date.now(), action: "start_race" });
        } else if (msg.name === "end") {
          setRaceState("finished");
          setLastEvent({ timestamp: Date.now(), action: "end_race" });
        }
      });
    });
    return () => {
      chControl.detach().catch(() => {});
    };
  }, [raceId]);

  return { raceState, lastEvent };
}