// v1
"use client";
import { useEffect, useState } from "react";
import { getRealtime } from "./ablyClient";
import { getTokenSnapshot } from "./useTokenSnapshot"; 

export function useTier() {
  const rt = getRealtime();
  const [clientId, setClientId] = useState<string | null>(rt.auth.clientId ?? null);

  const refresh = () => {
    // Prefer typed clientId; fall back to token snapshot if needed
    const cid = rt.auth.clientId ?? getTokenSnapshot(rt).clientId ?? null;
    setClientId(cid);
  };

  useEffect(() => {
    refresh();

    rt.connection.on("connected", refresh);
    return () => rt.connection.off("connected", refresh);
  }, [rt]);

  const isPremium = typeof clientId === "string" && clientId.includes("premium");
  return { clientId, isPremium };
}

export default useTier;