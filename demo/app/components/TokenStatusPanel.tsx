// v1
"use client";
import { useEffect, useMemo, useState } from "react";
import { getRealtime } from "../lib/ablyClient";
import {
  getTokenSnapshot,
  tokenIsPremium,
  capabilitiesToRows,
  fmtTs,
} from "../lib/useTokenSnapshot";

export function TokenStatusPanel({ raceId }: { raceId: string }) {
  const rt = getRealtime();
  const [snap, setSnap] = useState(getTokenSnapshot(rt));
  const rows = useMemo(() => capabilitiesToRows(snap.capability), [snap.capability]);
  const isPremium = useMemo(
    () => tokenIsPremium(snap.capability, raceId),
    [snap.capability, raceId]
  );

  useEffect(() => {

    // * Ably refreshes token under the hood, so we need to refresh the snapshot when the connection is re-established
    // * the connection is re-established on page refresh or on server restart
    // ! for Premium demo - update .env and then restart the server
    // ! restart will handle the refresh of the token and the snapshot
    // * this is a workaround to ensure the snapshot is always up to date
        // ? add auth0 handle premium subscription lookup in action or clerk and supabase DB lookup from clerk id

    const refresh = () => setSnap(getTokenSnapshot(rt));
    refresh ();     
    rt.connection.on("connected", refresh);
    return () => {
      rt.connection.off("connected", refresh);
    };
  }, [rt]);

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <h3 className="font-semibold">Token Status</h3>
        <span className={`text-xs px-2 py-0.5 rounded ${isPremium ? "bg-green-600 text-white" : "bg-gray-200"}`}>
          {isPremium ? "PREMIUM" : "BASIC"}
        </span>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        <Info label="Race ID" value={raceId} />
        <Info label="Client ID" value={snap.clientId ?? "—"} />
        <Info label="Issued" value={fmtTs(snap.issued)} />
        <Info label="Expires" value={fmtTs(snap.expires)} />
      </div>

      <div className="border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Resource</th>
              <th className="text-left px-3 py-2 font-semibold">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-mono">{r.resource}</td>
                <td className="px-3 py-2">{r.permissions}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={2}>
                  No capabilities present.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <details className="text-xs text-gray-600">
        <summary className="cursor-pointer">Raw capability JSON</summary>
        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
{snap.capabilityRaw}
        </pre>
      </details>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="font-mono text-[13px]">{value}</div>
    </div>
  );
}

export default TokenStatusPanel;