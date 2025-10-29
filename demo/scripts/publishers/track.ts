// v1
import { Realtime } from "ably";

const RACE_ID = process.env.RACE_ID || "demo-123";
const API_KEY = process.env.ABLY_API_KEY!;
if (!API_KEY) throw new Error("Missing ABLY_API_KEY");

const rt = new Realtime(API_KEY);
const meteoCh = rt.channels.get(`race:${RACE_ID}:track:meteo`);
const opsCh   = rt.channels.get(`race:${RACE_ID}:track:ops`);

function now() { return Date.now(); }

// ~1–3 Hz external sensors (within 0.1–10 Hz window)
let temp = 27.0, humidity = 0.45, wind = 12, rain = 0;
setInterval(async () => {
  // tiny random walk
  temp += (Math.random() - 0.5) * 0.2;
  humidity = Math.min(0.95, Math.max(0.15, humidity + (Math.random() - 0.5) * 0.01));
  wind = Math.max(0, wind + (Math.random() - 0.5) * 0.6);
  rain = Math.max(0, rain + (Math.random() - 0.5) * 0.1);

  await meteoCh.publish("meteo", {
    ts: now(),
    tempC: +temp.toFixed(1),
    humidity: +humidity.toFixed(3),
    windKph: +wind.toFixed(1),
    rainMmHr: +rain.toFixed(2),
  });
}, 400); // 2.5 Hz

// Operational events (race control / flags) ~0.1–0.2 Hz (every 5–10s)
const FLAGS = [
  { type: "FLAG", code: "GREEN", msg: "Track clear" },
  { type: "FLAG", code: "YELLOW", msg: "Incident sector 2" },
  { type: "FLAG", code: "SC", msg: "Safety car deployed" },
  { type: "FLAG", code: "VSC", msg: "Virtual safety car" },
  { type: "FLAG", code: "RED", msg: "Session stopped" },
  { type: "NOTE", code: "PEN", msg: "5s time penalty car B" },
];

function jitter(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

async function pumpOps() {
  const ev = FLAGS[Math.floor(Math.random() * FLAGS.length)];
  await opsCh.publish("ops", { ts: now(), ...ev });
  setTimeout(pumpOps, jitter(5000, 10000)); // 5–10s
}

pumpOps();

console.log(`[track] publishing to race:${RACE_ID}:track:meteo / :ops`);