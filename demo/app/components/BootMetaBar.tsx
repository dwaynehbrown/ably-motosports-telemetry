// v1
"use client";
import { useEffect, useState } from "react";
import { fetchBootMeta, setupRaceControl, type BootMeta } from "../lib/useBootMetaBar";

export default function BootMetaBar({ raceId, children }: { raceId: string, children: React.ReactNode }) {
  const [meta, setMeta] = useState<Record<string, BootMeta>>({});
  const [raceState, setRaceState] = useState<"idle" | "running" | "finished">("idle");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  useEffect(() => { fetchBootMeta(raceId).then(setMeta).catch(console.error); }, [raceId]);
  useEffect(() => {
    let chControl: any;
    setupRaceControl(raceId, (state, event, timestamp) => {
      console.log("BootMetaBar: onUpdate called with state:", state, "event:", event, "timestamp:", timestamp);
      setRaceState(state);
      if (event === "start_race") {
        setStartTime(timestamp);
      } else if (event === "end_race") {
        setEndTime(timestamp);
      }
    }).then(ch => { 
      chControl = ch;
      console.log("BootMetaBar: setupRaceControl completed");
    });
    return () => { if (chControl) chControl.detach().catch(() => {}); };
  }, [raceId]);

  return (
    <div style={{padding:8, border:"1px dashed #ccc", borderRadius:8, marginBottom:12, fontSize:12}}>
      <b>Session meta</b> · race={raceId} · {children} · {" "}
      
      <span style={{
        marginLeft: 8,
        padding: "2px 6px",
        borderRadius: 4,
        background: raceState === "running" ? "#dcfce7" : raceState === "finished" ? "#fee2e2" : "#f3f4f6",
        color: raceState === "running" ? "#166534" : raceState === "finished" ? "#991b1b" : "#6b7280",
        fontWeight: 600
      }}>
        Race: {raceState}
        {startTime && <> · started: {new Date(startTime).toISOString().slice(11,19)}</>}
        {endTime && <> · ended: {new Date(endTime).toISOString().slice(11,19)}</>}
      </span>

      {Object.keys(meta).length > 0 && (
        <span style={{marginLeft: 12}}>
          · {Object.entries(meta).map(([car, m]) => (
            <span key={car} style={{marginRight:12}}>
              <b>{car}</b> ready={new Date(m.firstSeenTs).toISOString().slice(11,19)}
              {m.publisher?.version && <> · v{m.publisher.version}</>}
              {m.publisher?.host && <> · {m.publisher.host}</>}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}