// v1
"use client";
import { useEffect, useState } from "react";
import { getChannel } from "./ablyClient";

export type Meteo = { ts: number; tempC: number; humidity: number; windKph: number; rainMmHr: number };
export type Ops   = { ts: number; type: string; code: string; msg: string };

export function useTrackFeeds(raceId: string) {
  const [meteo, setMeteo] = useState<Meteo | null>(null);
  const [ops, setOps] = useState<Ops[]>([]); // rolling list

  useEffect(() => {
    const chM = getChannel(`race:${raceId}:track:meteo`);
    const chO = getChannel(`race:${raceId}:track:ops`);

    const hM = (m: any) => setMeteo(m.data as Meteo);
    const hO = (m: any) => setOps(prev => [{ ...(m.data as Ops) }, ...prev].slice(0, 20));

    chM.subscribe("meteo", hM);
    chO.subscribe("ops", hO);

    return () => {
      chM.unsubscribe("meteo", hM as any);
      chO.unsubscribe("ops", hO as any);
    };
  }, [raceId]);

  return { meteo, ops };
}