// v1
import { useEffect, useState } from "react";
import { getChannel } from "./ablyClient";

export function useRollingChannel(name: string, limit = 50) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const ch = getChannel(name);
    const handler = (m: any) => {
      setItems(prev => {
        const row = {
          t: new Date().toISOString(),
          channel: name,
          name: m.name,
          data: m.data,
        };
        const next = [...prev, row];
        if (next.length > limit) next.shift();
        return next;
      });
    };
    ch.subscribe(handler);
    return () => ch.unsubscribe(handler);
  }, [name, limit]);
  return items;
}