// v4
import { getChannel } from "./ablyClient";

// * identify latency between producer and Ably server time
export type HistoryRow = {
  publishTs: number;        // Ably server time (canonical)
  producerTs: number | null; //  m.data.ts if present
  name: string;
  data: any;
};

type FetchOpts = {
  minutes?: number;
  hardLimit?: number; // absolute cap across pages
};

export async function fetchHistory(
  channel: string,
  opts: FetchOpts = { minutes: 2, hardLimit: 2000 }
): Promise<HistoryRow[]> {
  const ch = getChannel(channel);
  const end = Date.now();
  const start = opts.minutes ? end - opts.minutes * 60_000 : undefined;

  // Start with a large page; we’ll paginate if needed.
  let page = await ch.history({ start, end, direction: "backwards", limit: 1000 });

  const out: HistoryRow[] = [];
  let done = false;

  while (!done) {
    for (const m of page.items) {
      const publishTs = m.timestamp ?? Date.now();

      // Stop if we’ve crossed the requested window
      if (start !== undefined && publishTs < start) {
        done = true;
        break;
      }

      // weird linting but runs correctly 
      out.push({
        publishTs,
        producerTs: m.data?.ts ?? null,
        name: m.name,
        data: m.data,
      });

      // Respect hard cap
      if (opts.hardLimit && out.length >= opts.hardLimit) {
        done = true;
        break;
      }
    }

    if (done) break;
    if (!page.hasNext()) break;
    // weird linting but runs correctly
    // eslint-disable-next-line no-await-in-loop
    page = await page.next();
  }

  // newest first
  out.sort((a, b) => b.publishTs - a.publishTs);
  return out;
}