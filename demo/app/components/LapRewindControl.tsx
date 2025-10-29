// v1
// ? not currently used?
// * Inline history preferred for demo
// TODO implement this in the UI for auto connectivity drops and reconnects
'use client';
import { useState, useEffect, useRef } from 'react';
import { getRealtime } from '../lib/ablyClient';
import { reattachWithRewind } from '../lib/useRewind';

type LapMsg = { carId: string; lap: number; time: number; ts: number };

export default function LapRewindControl({ raceId, carId }:{
  raceId: string; carId: 'A' | 'B';
}) {
  const [rewind, setRewind] = useState('2m'); // default covers ≥2 laps
  const [laps, setLaps] = useState<LapMsg[]>([]);
  const rt = getRealtime();
  // weird linting but types available at runtime
  const subRef = useRef<ably.Types.Subscription | null>(null);
  const chRef = useRef<ably.Types.RealtimeChannelPromise | null>(null);

  async function hydrateAndSubscribe() {
    // Clean up previous sub & channel
    if (subRef.current && chRef.current) chRef.current.unsubscribe(subRef.current);
    if (chRef.current) await chRef.current.detach().catch(() => {});

    // Reattach with rewind=...
    const base = `race:${raceId}:car:${carId}:lap`;
    const ch = await reattachWithRewind(rt, base, rewind);
    chRef.current = ch;
    setLaps([]);

    // Optional: explicit history to guarantee exactly last 2 items
    // const hist = await ch.history({ limit: 2, direction: 'backwards' });
    // setLaps(hist.items.reverse().map(i => i.data as LapMsg));

    // Live subscription
    const sub = (msg: ably.Types.Message) => {
      setLaps(prev => [...prev.slice(-9), msg.data as LapMsg]); // keep last 10
    };
    ch.subscribe(sub);
    subRef.current = sub;
  }

  useEffect(() => { hydrateAndSubscribe(); /* on mount */ }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={rewind}
          onChange={e => setRewind(e.target.value)}
          placeholder="e.g. 2m or 5m"
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={hydrateAndSubscribe}
          className="px-3 py-1 rounded bg-black text-white"
        >
          Rewind & Hydrate
        </button>
      </div>

      <ul className="text-sm bg-white rounded p-2 border">
        {laps.slice(-5).reverse().map((l, i) => (
          <li key={i} className="flex justify-between">
            <span>Lap {l.lap}</span>
            <span>{l.time.toFixed(3)}s</span>
            <span className="tabular-nums">{new Date(l.ts).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}