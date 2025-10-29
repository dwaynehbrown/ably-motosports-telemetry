// v1
export function usePublic(raceId: string) {
    return {
        //TODO define client ID here for public channels
        // * implemented in token service 
        // clien ID is used to determine tier and so what can be displayed in the UI
        clientId: "demo-public",
        channels: [
            // Car telemetry - wildcard matches car:A and car:B
            `race:${raceId}:car:*:speed:derived`,
            `race:${raceId}:car:*:speed`,
            `race:${raceId}:car:*:lap`,
            // Race control and metadata
            `race:${raceId}:meta`,
            `race:${raceId}:control`,
        ],
        descriptions: [
            "Derived speed data with EMA smoothing (5Hz) - all cars",
            "Raw speed telemetry data (5Hz) - all cars",
            "Lap completion events (~30s intervals) - all cars",
            "Session metadata - publisher boot events and system information",
            "Race control events - start, end, reset, etc.",
        ],
    }
}

export default usePublic;
