// v1
import { useEffect, useState } from "react";

export function useStaleness(updatedAt?: number | null) {
  const [ms, setMs] = useState<number>(0);
  useEffect(() => {
    let id: any;
    function tick() {
      if (!updatedAt) return setMs(0);
      setMs(Date.now() - updatedAt);
    }
    tick();
    id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [updatedAt]);
  return ms;
}