// v1
import type { Realtime } from "ably";
import usePremium from "./usePremium";
import usePublic from "./usePublic";

function readTokenDetails(rt: Realtime) {
  // tokenDetails exists at runtime but isn't in Ably TS typings
  return (rt as any)?.auth?.tokenDetails ?? null;
}

// Parse capability JSON safely (silent fallback)
function parseCap(s?: string) {
  if (!s) return {};
  try { return JSON.parse(s) as Record<string, string[]>; } catch { return {}; }
}

export function getTokenSnapshot(rt: Realtime) {
  const td = readTokenDetails(rt);
  const capObj = parseCap(td?.capability);
  return {
    clientId: td?.clientId ?? null,
    issued: td?.issued ?? null,
    expires: td?.expires ?? null,
    capabilityRaw: td?.capability ?? "{}",
    capability: capObj,
  };
}

// Check if a single resource has "subscribe"
export function hasSubscribe(cap: Record<string, string[]>, resource: string) {
  const perms = cap[resource];
  return Array.isArray(perms) && perms.includes("subscribe");
}

// Premium = token can subscribe to *all* premium-declared channels
export function tokenIsPremium(cap: Record<string, string[]>, raceId: string) {
    // TODO improve: premium and public channel management and check if token has subscribe permission for all channels
        // ? combine usePremium and usePublic into a single function
        // kept separate for now to avoid complexity and save time
        // ! Ably expects `capability` : [`action<subscribe|publish|presence>`]
  const channels: string[] = [...usePremium(raceId).channels, ...usePublic(raceId).channels]; 
  return channels.length > 0 && channels.every((res: string) => hasSubscribe(cap, res));
}

export type CapabilityRow = { resource: string; permissions: string };
export function capabilitiesToRows(cap: Record<string, string[]>): CapabilityRow[] {
  return Object.entries(cap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resource, perms]) => ({ resource, permissions: (perms || []).join(", ") }));
}

export function fmtTs(ts?: number | null) {
  if (!ts) return "—";
  try { return new Date(ts).toISOString(); } catch { return String(ts); }
}