// TODO properly  - starter principles applied to get a sparkline working
'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkline } from './Sparkline';
import { getRealtime, getChannel } from '../lib/ablyClient';

export default function TelemetryPanel({ raceId }:{ raceId: string }) {
  const rt = getRealtime();
  const [aBuf, setABuf] = useState<number[]>([]);
  const [bBuf, setBBuf] = useState<number[]>([]);
  const [lat, setLat] = useState<number>(0);
  const [raceRunning, setRaceRunning] = useState<boolean>(false);
  const aRef = useRef<any>(null);
  const bRef = useRef<any>(null);

  // Track previous race running state to clear buffers when race ends
  const prevRaceRunningRef = useRef(false);

  // Clear buffers when race ends
  useEffect(() => {
    if (prevRaceRunningRef.current && !raceRunning) {
      console.log("TelemetryPanel: Race ended, clearing buffers");
      setABuf([]);
      setBBuf([]);
    }
    prevRaceRunningRef.current = raceRunning;
  }, [raceRunning]);

  // Separate effect for race control channel subscription
  useEffect(() => {
    const chControl = getChannel(`race:${raceId}:control`);
    
    chControl.attach().then(() => {
      chControl.subscribe((msg) => {
        console.log("TelemetryPanel: Control message received", msg.name);
        if (msg.name === "start") {
          setRaceRunning(true);
        } else if (msg.name === "end") {
          setRaceRunning(false);
        }
      });
    });

    return () => {
      chControl.detach().catch(() => {});
    };
  }, [raceId]);

  // Track raceRunning state with ref for use in subscription callback
  const raceRunningRef = useRef(raceRunning);
  useEffect(() => {
    raceRunningRef.current = raceRunning;
  }, [raceRunning]);

  // Separate effect for speed channel subscriptions
  useEffect(() => {
    async function sub(car:'A'|'B') {
      const ch = rt.channels.get(`race:${raceId}:car:${car}:speed`);
      await ch.attach();
      ch.subscribe(msg => {
        // Only collect data when race is running (using ref to avoid stale closure)
        if (raceRunningRef.current) {
          const d = msg.data as { speed:number; ts:number };
          console.log(`TelemetryPanel: Collecting data for car ${car}, raceRunning: ${raceRunningRef.current}`);
          if (car === 'A') setABuf(prev => [...prev.slice(-99), d.speed]);
          else setBBuf(prev => [...prev.slice(-99), d.speed]);
        }
      });
      return ch;
    }
    Promise.all([sub('A'), sub('B')]).then(([a,b]) => { aRef.current=a; bRef.current=b; });

    const t = setInterval(async () => {
      const start = Date.now();
      try {
        await rt.time();
        setLat(Date.now() - start);
      } catch {}
    }, 5000);

    return () => { 
      clearInterval(t);
      if (aRef.current) aRef.current.detach().catch(()=>{});
      if (bRef.current) bRef.current.detach().catch(()=>{});
    };
  }, [raceId, rt]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-gray-500 mb-1">Connection</div>
        <div className="text-sm">Latency ~ {lat} ms</div>
      </div>
      {!raceRunning && (
        <div className="text-xs text-gray-500 mb-1">⏸️ Race not running</div>
      )}
      <div>
        <div className="font-medium mb-1">Car A Speed</div>
        <Sparkline data={aBuf} />
      </div>
      <div>
        <div className="font-medium mb-1">Car B Speed</div>
        <Sparkline data={bBuf} />
      </div>
    </div>
  );
}
