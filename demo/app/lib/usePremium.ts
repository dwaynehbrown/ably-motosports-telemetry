//v1 
export function usePremium(raceId: string) {
    return {
        //TODO define client ID here for premium channels
        // * implemented in token service 
        // clien ID is used to determine tier and so what can be displayed in the UI
        clientId: "demo-premium",
        channels: [
            `race:${raceId}:track:*`,
            
            // Future premium channels:
            // `race:${raceId}:car:*:telemetry`,
            // `race:${raceId}:car:*:telemetry:advanced`,
            // `race:${raceId}:car:*:telemetry:premium`,
            // `race:${raceId}:car:*:telemetry:ultimate`,
            // `race:${raceId}:car:*:telemetry:pro`,
            // `race:${raceId}:car:*:telemetry:enterprise`,
        ],
        descriptions: [
            "Track conditions and flags - weather, track status, flags (yellow, red, etc.)",
            // "Comprehensive telemetry data", // future premium channels
            // "Analytical telemetry with advanced metrics",
            // "Comprehensive telemetry data", // future premium channels
            // "Analytical telemetry with advanced metrics",
            // "Comprehensive telemetry data",  // future premium channels
            // "Analytical telemetry with advanced metrics", // future premium channels
        ],
    }
}

export default usePremium;