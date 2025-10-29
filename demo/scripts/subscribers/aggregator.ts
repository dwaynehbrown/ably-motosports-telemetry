// v2
import "dotenv/config";
import { Realtime } from "ably";

const RACE_ID = process.env.RACE_ID || "demo-123";
const API_KEY = process.env.ABLY_API_KEY;
if (!API_KEY) {
  console.error("ABLY_API_KEY missing");
  process.exit(1);
}

type Speed = { carId: string; speed: number; unit?: string; ts: number };
type Lap   = { carId: string; lap: number; time: number; ts: number };

// TODO update to use cars from Ably.presence
// ? add a car for each user device open
const cars = ["A", "B"];

const rt = new Realtime(API_KEY);
rt.connection.once("connected", () => console.log("[aggregator] connected"));

const state: Record<string, { emaSpeed?: number; lastTwoLaps: Lap[] }> =
  Object.fromEntries(cars.map(c => [c, { lastTwoLaps: [] as Lap[] }]));

function ema(prev: number | undefined, next: number, alpha = 0.3) {
  return prev === undefined ? next : alpha * next + (1 - alpha) * prev;
}

function chSpeedRaw(c: string)       { return `race:${RACE_ID}:car:${c}:speed`; }
function chLapRaw(c: string)         { return `race:${RACE_ID}:car:${c}:lap`; }
function chSpeedDerived(c: string)   { return `race:${RACE_ID}:car:${c}:speed:derived`; }
function chLapsLast2(c: string)      { return `race:${RACE_ID}:car:${c}:laps:last2`; }

async function main() {
  const totals: Record<string, { speedIn: number; speedOut: number; lapsOut: number; ema?: number }> =
    Object.fromEntries(["A","B"].map(c => [c, { speedIn:0, speedOut:0, lapsOut:0 } as any]));

  for (const carId of cars) {
    const speedRaw = rt.channels.get(chSpeedRaw(carId));
    const lapRaw   = rt.channels.get(chLapRaw(carId));

    speedRaw.subscribe(async (msg) => {
      const data = msg.data as Speed;
      const s = state[carId];
      s.emaSpeed = ema(s.emaSpeed, data.speed, 0.3);

      totals[carId].speedIn++;
      totals[carId].ema = s.emaSpeed;

      await rt.channels.get(chSpeedDerived(carId)).publish("speed-derived", {
        carId, speed: data.speed, ema: s.emaSpeed, unit: data.unit || "km/h", ts: data.ts
      });
      
      totals[carId].speedOut++;
    });

    lapRaw.subscribe(async (msg) => {
      const data = msg.data as Lap;
      const s = state[carId];
      s.lastTwoLaps = [...s.lastTwoLaps, data].slice(-2);

      await rt.channels.get(chLapsLast2(carId)).publish("laps-last2", {
        carId, laps: s.lastTwoLaps
      });
      
      totals[carId].lapsOut++;
    });
  }

  console.log("[aggregator] subs active");

  // heartbeat every 10s
  setInterval(() => {
    for (const c of ["A","B"]) {
      const t = totals[c];
      console.log(
        `[AGG/${c}] in=${t.speedIn} speed msgs | out=${t.speedOut} speed, ${t.lapsOut} laps | ema≈${t.ema?.toFixed(1) ?? "—"}`
      );
      t.speedIn = t.speedOut = 0; // reset counters (leave laps cumulative if you prefer)
    }
  }, 10_000);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
