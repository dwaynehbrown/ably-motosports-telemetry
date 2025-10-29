// v2
// Preload .env for node scripts
import "dotenv/config";
import { Rest, Realtime } from "ably";

const apiKey = process.env.ABLY_API_KEY;
if (!apiKey) {
    throw new Error("ABLY_API_KEY missing. Put it in .env or export it before running.");
}

const raceId = process.env.RACE_ID || "demo-123";
const carId = "A";

const rest = new Rest(apiKey);
const realtime = new Realtime(apiKey);


// ! announce boot on startup (car enters to race)
async function announceBoot() {
    const meta = rest.channels.get(`race:${raceId}:meta`);
    await meta.publish("boot", {
        carId,
        firstSeenTs: Date.now(),
        version: "0.1.0",
        hostname: process.env.HOSTNAME,
    });
    console.log(`[car ${carId}] boot meta published`);
}
announceBoot();
// ! end announce boot on startup


const chSpeed = rest.channels.get(`race:${raceId}:car:${carId}:speed`);
const chLap = rest.channels.get(`race:${raceId}:car:${carId}:lap`);
const chControl = realtime.channels.get(`race:${raceId}:control`);

let lap = 1;
let raceRunning = false;
const now = () => Date.now();

// Start intervals ONLY after control channel is set up
chControl.attach().then(() => {
  console.log(`[car ${carId}] Control channel attached, waiting for start signal...`);
  
  // Phase 1: Subscribe to control events
  chControl.subscribe((msg) => {
    if (msg.name === "start") {
      raceRunning = true;
      console.log(`[car ${carId}] ✅ Race started - telemetry enabled`);
    } else if (msg.name === "end") {
      raceRunning = false;
      console.log(`[car ${carId}] 🏁 Race ended - telemetry disabled`);
    }
  });

  // Phase 2: Start intervals AFTER channel is ready
  // 200ms == 5 Hz speed (only when race is running)
  setInterval(async () => {
    if (raceRunning) {
      const speed = 220 + Math.random() * 40;
      await chSpeed.publish("speed", { carId, speed, unit: "km/h", ts: now() });
    }
  }, 200);

  // 30s lap (only when race is running)
  setInterval(async () => {
    if (raceRunning) {
      const time = 85 + Math.random() * 10;
      await chLap.publish("lap", { carId, lap: lap++, time, ts: now() });
      console.log(`[car ${carId}] lap ${lap - 1} published`);
    }
  }, 30_000);
});