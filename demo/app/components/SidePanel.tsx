// v1
'use client';
import { useState } from 'react';

export default function SidePanel({ children }:{children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  return (
    <>
        
      <button onClick={() => setOpen(true)} className="fixed right-4 bottom-4 bg-black text-white px-4 py-2 rounded">
        Open Telemetry
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Race Telemetry</h2>
              <button onClick={() => setOpen(false)} className="text-sm underline">Close</button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}