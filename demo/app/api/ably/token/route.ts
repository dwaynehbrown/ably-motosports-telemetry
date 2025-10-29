// v2 - updated to include channel capability + logging
import { NextResponse } from "next/server";
import { Rest } from "ably";
import usePublic from "../../../lib/usePublic";
import usePremium from "../../../lib/usePremium";

const IS_PREMIUM = process.env.DEMO_PREMIUM === "true" || process.env.NEXT_PUBLIC_DEMO_PREMIUM === "true";
const RACE_ID = process.env.RACE_ID || "demo-123";

export async function GET() {
  try {
    const rest = new Rest(process.env.ABLY_API_KEY!);

    const pub = usePublic(RACE_ID).channels;
    const prem = IS_PREMIUM ? usePremium(RACE_ID).channels : [];

    console.log(`Token generation - IS_PREMIUM: ${IS_PREMIUM}, Race ID: ${RACE_ID}`);
    console.log(`Public channels:`, pub);
    console.log(`Premium channels:`, prem);
    console.log(`All channels:`, [...pub, ...prem]);

    // Build capability map: resources with wildcards (e.g., car.*.speed) are supported by Ably
    const cap: Record<string, string[]> = {};
        
    // * cast to set to deduplicate channels and then cast to array to iterate over
    // ! this should be done in the usePublic and usePremium functions
    // ! this is a workaround to avoid duplicate channels in the capability map - Ably may not like duplicates
    [...new Set([...pub, ...prem])].forEach((channel) => {
      // Control channel needs subscribe, publish, and history
      if (channel.includes(':control')) {
        cap[channel] = ["subscribe", "publish", "history"];
      } else {
        // All other channels need subscribe and history for fetching past events
        cap[channel] = ["subscribe", "history"];
      }
    });

    console.log(`Capabilities being granted:`, cap);

    const tokenRequest = await rest.auth.createTokenRequest({
      capability: JSON.stringify(cap),
      ttl: 60 * 60 * 1000, // 1 hour
      clientId: IS_PREMIUM ? usePremium(RACE_ID).clientId : usePublic(RACE_ID).clientId,
    });

    console.log(`Token generated for clientId: ${tokenRequest.clientId}`);

    return NextResponse.json(tokenRequest, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("Auth error:", e);
    return new NextResponse(`Auth error: ${e?.message || e}`, { status: 500 });
  }
}