// v2
import { Realtime } from "ably";

let rt: Realtime | null = null;

export function getRealtime() {
  if (!rt) {
    rt = new Realtime({
      authUrl: "/api/ably/token",
      echoMessages: true, // Enable echo to receive own messages (needed for race control UI updates)
    });
  }
  return rt!;
}

export function getChannel(name: string, opts?: { params?: Record<string, string> }) {
  const rt = getRealtime();
  const ch = rt.channels.get(name);
  if (opts?.params) {
    ch.setOptions({ params: opts.params as any });
  }
  return ch;
}
