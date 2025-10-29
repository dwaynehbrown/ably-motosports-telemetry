// v1
"use client";
import { useState } from "react";
import SidePanel from "./SidePanel";
import { TokenStatusPanel } from "./TokenStatusPanel";

export default function TokenStatusButton({ raceId }: { raceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-16 bg-white border shadow px-4 py-2 rounded"
        title="View Ably token info"
      >
        Token Status
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Token & Capabilities</h2>
              <button onClick={() => setOpen(false)} className="text-sm underline">Close</button>
            </div>
            <TokenStatusPanel raceId={raceId} />
          </div>
        </div>
      )}
    </>
  );
}