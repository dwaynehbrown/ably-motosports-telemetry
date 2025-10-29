// v1
import type { Realtime, RealtimeChannel } from 'ably';

export async function reattachWithRewind(
  realtime: Realtime,
  baseName: string,
  rewind: string | null
) {
  const name = rewind ? `${baseName}?rewind=${rewind}` : baseName;
  const ch: RealtimeChannel = realtime.channels.get(name);
  await ch.attach();
  return ch;
}