// v1
"use client";
import { useState } from "react";

import { fetchHistory, type HistoryRow } from "../lib/useFetchHistory";
import { fmtMs, avg } from "../lib/useTimeFmt";

export function HistoryPanel({ channel }: { channel: string }) {
  const [mins, setMins] = useState(2);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const items = await fetchHistory(channel, { minutes: mins, hardLimit: 2000 });
    setRows(items);
    setLoading(false);
  }

  // Summary stats (computed over this fetched window)
  const now = Date.now();
  const n = rows.length;
  const ages = rows.map(r => now - r.publishTs);
  const prodToAbly = rows
    .map(r => (r.producerTs != null ? r.publishTs - r.producerTs : null))
    .filter((x): x is number => x !== null);

  const firstPublishTs = n ? rows[n - 1].publishTs : null; // oldest in this fetch
  const newestPublishTs = n ? rows[0].publishTs : null;

  return (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px dashed #333" }}>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
        <strong>History:</strong>
        <code>{channel}</code>
        <span>·</span>
        <label>Minutes</label>
        <input
          type="number"
          min={1}
          value={mins}
          onChange={(e)=>setMins(+e.target.value)}
          style={{ width:80 }}
        />
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Fetch"}
        </button>
      </div>

      {/* Summary header */}
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap",
        fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12,
        background: "#e6f0ff", /* light blue */
        padding: 8, borderRadius: 6
      }}>
        <div><b>n</b>={n}</div>
        <div><b>avg age</b>={fmtMs(avg(ages))}</div>
        <div><b>avg prod→ably</b>={prodToAbly.length ? fmtMs(avg(prodToAbly)) : "—"}</div>
        <div><b>newest</b>={newestPublishTs ? new Date(newestPublishTs).toISOString().slice(11,19) : "—"}</div>
        <div><b>first (this fetch)</b>={firstPublishTs ? new Date(firstPublishTs).toISOString().slice(11,19) : "—"}</div>
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 240, overflow:"auto", fontFamily:"ui-monospace, Menlo, monospace", fontSize:12, marginTop:6 }}>
        {rows.map((r,i)=>(
          <div key={i}>
            <strong>{new Date(r.publishTs).toISOString().slice(11,19)}</strong>
            {" · "}{r.name}{" · "}{JSON.stringify(r.data)}
            {" · "}age={fmtMs(now - r.publishTs)}
            {r.producerTs != null && <> · prod→ably={fmtMs(r.publishTs - r.producerTs)}</>}
          </div>
        ))}
      </div>
    </div>
  );
}