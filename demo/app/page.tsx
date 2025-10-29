// v3

"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { getChannel } from "./lib/ablyClient";
import { useStaleness } from "./lib/useStaleness";
import { StalenessBadge } from "./components/StalenessBadge";
import { useRollingChannel } from "./lib/useRollingChannel";
import { HistoryPanel } from "./components/HistoryPanel";
import Card from "./components/Card";
import BootMetaBar from "./components/BootMetaBar";
import { useHydratedLaps } from "./lib/useHydratedLaps";
import SidePanel from "./components/SidePanel";
import TelemetryPanel from "./components/TelemetryPanel";
import ConnectionBadge from "./components/ConnectionBadge";
import RaceControl from "./components/RaceControl";

//raw stream recovery
import { useOfflineWindow } from "./lib/useOfflineWindow";
import { useCatchupCounter } from "./lib/useCatchupCounter";
import TokenStatusButton from "./components/TokenStatusButton";
import { useTier } from "./lib/useTier";
import TrackPanel from "./components/TrackPanel";



//raw stream recovery
type SpeedDerived = { carId: string; speed: number; ema: number; unit: string; ts: number };
type LapsLast2 = { carId: string; laps: { lap: number; time: number; ts: number }[] };


// derived speed gives a less random speed than the raw stream for a smoother curve and less "jumping around"
function useDerivedSpeed(car: "A" | "B") {
  const [val, setVal] = useState<SpeedDerived | null>(null);
  useEffect(() => {
    const raceId = process.env.NEXT_PUBLIC_RACE_ID || "demo-123";
    const ch = getChannel(`race:${raceId}:car:${car}:speed:derived`);
    const h = (m: any) => setVal(m.data as SpeedDerived);
    ch.subscribe(h);
    return () => ch.unsubscribe(h);
  }, [car]);
  return val;
}

function RawStreamDisplay({ rawA, rawB, allLapsA, allLapsB, raceId }: any) {
  const { isRecovered } = useOfflineWindow();
  const { recovering, count, markIfRecovered } = useCatchupCounter(1000);
  const [items, setItems] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Track accumulated items across re-renders
  const accumulatedRef = useRef<Map<string, any>>(new Map());
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    const speedEvents = [...rawA, ...rawB].map(e => ({ ...e, phase: "live", type: "speed" }));
    const lapEvents = [...allLapsA, ...allLapsB].map(e => ({
      t: new Date(e.ts).toISOString(),
      channel: `race:${raceId}:car:${e.carId}:lap`,
      name: e.carId,
      data: e,
      type: "lap",
      phase: "live"
    }));

    const merged = [...speedEvents, ...lapEvents].map(e => {
      const id = [e.data?.ts || e.t, e.channel, JSON.stringify(e.data)].join("::");
      const isLap = e.type === "lap" || e.channel.includes(".lap");
      const recovered = isLap && (markIfRecovered() || isRecovered(e.data?.ts));

      return { ...e, id, recovered, phase: recovered ? "recovered" : "live" };
    });

    // Fetch history once on initial load to show recent events
    if (!historyLoadedRef.current) {
      historyLoadedRef.current = true;
      // TODO usePublic and usePremium to get channels
      // ! channel names risk inconsistency with scale and permissioning (premium)
      // * centralised is better
      const channels = [
        `race:${raceId}:car:A:speed`,
        `race:${raceId}:car:B:speed`,
        `race:${raceId}:car:A:lap`,
        `race:${raceId}:car:B:lap`,
      ];

      Promise.all(channels.map(async (chName) => {
        const ch = getChannel(chName);
        try {
          const hist = await ch.history({ limit: 50 });
          hist.items.forEach((m) => {
            const histEvent = {
              t: new Date(m.timestamp).toISOString(),
              channel: chName,
              data: m.data,
              name: chName.split(".").slice(-2).join("."),
              phase: "history" as const,
              id: [m.timestamp, chName, JSON.stringify(m.data)].join("::"),
              type: chName.includes(".lap") ? "lap" : "speed",
              recovered: false
            };
            accumulatedRef.current.set(histEvent.id, histEvent);
          });
        } catch (err) {
          console.warn(`Failed to fetch history for ${chName}:`, err);
        }
      })).then(() => {
        // After history loaded, add live events
        merged.forEach(ev => {
          accumulatedRef.current.set(ev.id, ev);
        });
        const all = Array.from(accumulatedRef.current.values())
          .sort((a, b) => (a.t < b.t ? 1 : -1));
        setItems(showAll ? all : all.slice(0, 50));
      });
    } else {
      // Add new events to accumulated map
      merged.forEach(ev => {
        accumulatedRef.current.set(ev.id, ev);
      });

      // Convert map to array and sort by timestamp
      const all = Array.from(accumulatedRef.current.values())
        .sort((a, b) => (a.t < b.t ? 1 : -1));

      setItems(showAll ? all : all.slice(0, 50));
    }
  }, [rawA, rawB, allLapsA, allLapsB, raceId, recovering, showAll]);

  const getBg = (phase: string) => {
    switch (phase) {
      case "history": return "rgba(200,200,200,.2)";
      case "recovered": return "rgba(255,220,0,.4)"; // More visible yellow for recovered messages
      default: return "transparent";
    }
  };

  const getBorder = (phase: string) => {
    return phase === "recovered" ? "2px solid rgba(255,180,0,.6)" : "none";
  };

  return (
    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Raw Stream ({showAll ? "Full Race" : "Last 50"})</div>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            padding: "4px 8px",
            background: "#222",
            color: "#fff",
            borderRadius: 4,
            border: "1px solid #444",
          }}
        >
          {showAll ? "View Last 50" : "View Full Race"}
        </button>
      </div>

      {count > 0 && (
        <div style={{
          position: "sticky",
          top: 0,
          background: "#FFB020",
          color: "#111",
          padding: "4px 8px",
          borderRadius: 4,
          marginBottom: 8,
          zIndex: 1
        }}>
          Recovered {count} message{count > 1 ? "s" : ""} while offline
        </div>
      )}

      <div style={{
        maxHeight: showAll ? "60vh" : 400,
        overflow: "auto",
        border: "1px solid #eee",
        borderRadius: 8,
        marginTop: 8,
        background: "#fafafa",
      }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              borderBottom: "1px dashed #eee",
              borderLeft: getBorder(it.phase),
              padding: "4px 6px",
              background: getBg(it.phase),
              transition: "background 0.5s ease, border-color 0.5s ease",
              marginLeft: it.phase === "recovered" ? "2px" : "0",
            }}
          >
            <strong>{it.t.slice(11, 19)}</strong> · <em>{it.channel}</em> ·{" "}
            <code>{JSON.stringify(it.data)}</code>{" "}
            {it.phase !== "live" && (
              <span style={{
                marginLeft: 6,
                fontSize: 10,
                opacity: 0.8,
                fontWeight: it.phase === "recovered" ? "bold" : "normal",
                color: it.phase === "recovered" ? "#d97700" : "inherit",
              }}>
                [{it.phase}]
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const raceId = process.env.NEXT_PUBLIC_RACE_ID || "demo-123";
  // premium detection from token service
  const { isPremium, clientId } = useTier();

  const sA = useDerivedSpeed("A");
  const sB = useDerivedSpeed("B");

  // Use the new hydrated laps hook with rewind=2m
  const allLapsA = useHydratedLaps("A", "2m");
  const allLapsB = useHydratedLaps("B", "2m");

  // Get last 2 laps from hydrated data, showing unique laps when available
  const lA = useMemo(() => {
    // If we have duplicate lap numbers, deduplicate and keep the most recent by timestamp
    const lapMap = new Map<number, { lap: number; time: number; ts: number }>();
    allLapsA.forEach(lap => {
      const existing = lapMap.get(lap.lap);
      if (!existing || lap.ts > existing.ts) {
        lapMap.set(lap.lap, lap);
      }
    });
    // Get unique laps sorted by lap number, then take last 2
    const unique = Array.from(lapMap.values()).sort((a, b) => a.lap - b.lap);

    // If we only have 1 unique lap, show it (don't duplicate it)
    if (unique.length <= 1) return unique;

    // Otherwise return last 2 unique laps
    return unique.slice(-2);
  }, [allLapsA]);

  const lB = useMemo(() => {
    // If we have duplicate lap numbers, deduplicate and keep the most recent by timestamp
    const lapMap = new Map<number, { lap: number; time: number; ts: number }>();
    allLapsB.forEach(lap => {
      const existing = lapMap.get(lap.lap);
      if (!existing || lap.ts > existing.ts) {
        lapMap.set(lap.lap, lap);
      }
    });
    // Get unique laps sorted by lap number, then take last 2
    const unique = Array.from(lapMap.values()).sort((a, b) => a.lap - b.lap);

    // If we only have 1 unique lap, show it (don't duplicate it)
    if (unique.length <= 1) return unique;

    // Otherwise return last 2 unique laps
    return unique.slice(-2);
  }, [allLapsB]);

  const msA = useStaleness(sA?.ts);
  const msB = useStaleness(sB?.ts);

  // FIXED: Removed duplicate lap subscriptions
  // useRollingChannel for lap channels created duplicates of useHydratedLaps
  // Now only subscribe to speed channels for raw stream, use hydrated laps for display
  const rawA = useRollingChannel(`race:${raceId}:car:A:speed`, 50);;
  const rawB = useRollingChannel(`race:${raceId}:car:B:speed`, 50);
  // rawALap and rawBLap removed - duplicate of allLapsA/allLapsB from useHydratedLaps

  return (
    <main style={{ padding: 16 }}>
      <h2>Telemetry (Derived Streams)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Card title="Car A — Speed (derived)">
          {sA ? (<>
            <div style={{ fontSize: 22 }}>{sA.speed.toFixed(1)} {sA.unit}</div>
            <small>EMA: {sA.ema.toFixed(1)}</small>
            <StalenessBadge ms={msA} />
          </>) : "—"}
        </Card>
        <Card title="Car B — Speed (derived)">
          {sB ? (<>
            <div style={{ fontSize: 22 }}>{sB.speed.toFixed(1)} {sB.unit}</div>
            <small>EMA: {sB.ema.toFixed(1)}</small>
            <StalenessBadge ms={msB} />
          </>) : "—"}
        </Card>
        <Card title="Car A — Last 2 laps">
          <LapList laps={lA} />
        </Card>
        <Card title="Car B — Last 2 laps">
          <LapList laps={lB} />
        </Card>
      </div>

      <BootMetaBar raceId={raceId}>
        <ConnectionBadge />
      </BootMetaBar>

      <RaceControl raceId={raceId} />

      {isPremium && <>
        <Card title="Raw Stream">
          <RawStreamDisplay rawA={rawA} rawB={rawB} allLapsA={allLapsA} allLapsB={allLapsB} raceId={raceId} />
        </Card>

      </>}

      {!isPremium && <>
        <Card title="Raw Stream">
          <p>Premium members get access to the full history of the race.</p>
        </Card>
      </>}

      <Card title={`History (last 2 mins)`}>


        <HistoryPanel channel={`race:${raceId}:car:A:lap`} />
        <HistoryPanel channel={`race:${raceId}:car:B:lap`} />
        <HistoryPanel channel={`race:${raceId}:car:A:speed`} />
        <HistoryPanel channel={`race:${raceId}:car:B:speed`} />
        <HistoryPanel channel={`race:${raceId}:car:A:speed:derived`} />
        <HistoryPanel channel={`race:${raceId}:car:B:speed:derived`} />
        <HistoryPanel channel={`race:${raceId}:car:A:laps:last2`} />
        <HistoryPanel channel={`race:${raceId}:car:B:laps:last2`} />




        <TokenStatusButton raceId={raceId} />
        <SidePanel>
          <TelemetryPanel raceId={raceId} />
        </SidePanel>

      </Card>

      <Card title="Track (premium)">
        {isPremium ? (
          <TrackPanel raceId={raceId} />
        ) : (
          <div className="text-gray-500 text-sm">Requires premium token.</div>
        )}
      </Card>
    </main>
  );
}



function LapList({ laps }: { laps: { lap: number; time: number; ts: number }[] }) {
  // FIXED: Removed offline window check here - recovery counting now centralized in Raw stream
  if (!laps.length) return <div style={{ opacity: 0.5 }}>No laps yet...</div>;
  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {laps.map((l, i) => (
        <li key={i}>
          Lap {l.lap}: {l.time.toFixed(3)}s
        </li>
      ))}
    </ul>
  );
}