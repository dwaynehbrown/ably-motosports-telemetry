// v1
"use client";
import { useTrackFeeds } from "../../app/lib/useTrack"; 

export default function TrackPanel({ raceId }: { raceId: string }) {
  const { meteo, ops } = useTrackFeeds(raceId);

  return (
    <div className="space-y-3 text-sm">
      <div className="border rounded p-3">
        <div className="font-semibold mb-1">External Sensors (Meteo)</div>
        {meteo ? (
          <div className="grid grid-cols-2 gap-y-1">
            <Row k="Temp" v={`${meteo.tempC.toFixed(1)} °C`} />
            <Row k="Humidity" v={`${Math.round(meteo.humidity * 100)} %`} />
            <Row k="Wind" v={`${meteo.windKph.toFixed(1)} kph`} />
            <Row k="Rain" v={`${meteo.rainMmHr.toFixed(2)} mm/hr`} />
            <Row k="Updated" v={new Date(meteo.ts).toLocaleTimeString()} />
          </div>
        ) : (
          <div className="text-gray-500">Waiting for sensor data…</div>
        )}
      </div>

      <div className="border rounded p-3">
        <div className="font-semibold mb-1">Operational Events</div>
        <div className="max-h-48 overflow-auto divide-y">
          {ops.length ? ops.map((o, i) => (
            <div key={i} className="py-1 flex items-center gap-2">
              <span className="font-mono text-xs">{new Date(o.ts).toLocaleTimeString()}</span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100">{o.type}</span>
              <span className="px-1.5 py-0.5 rounded text-xs bg-black text-white">{o.code}</span>
              <span className="text-xs">{o.msg}</span>
            </div>
          )) : <div className="text-gray-500">No ops yet…</div>}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-mono">{v}</span></div>;
}