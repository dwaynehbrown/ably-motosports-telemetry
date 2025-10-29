// v1
"use client";
import { useState, useEffect, useRef } from "react";
import { getChannel } from "../lib/ablyClient";

type RaceState = "idle" | "running" | "finished";

export default function RaceControl({ raceId }: { raceId: string }) {
  const [state, setState] = useState<RaceState>("idle");
  const [isChannelReady, setIsChannelReady] = useState(false);
  const chControlRef = useRef<any>(null);

  useEffect(() => {
    // Attach to the control channel and listen for state changes
    const chControl = getChannel(`race:${raceId}:control`);
    chControlRef.current = chControl;
    
    let isSubscribed = true;
    let unsubscribeHandle: any = null;

    chControl.attach().then(() => {
      if (isSubscribed) {
        setIsChannelReady(true);
        console.log("RaceControl: Channel attached and ready");
        
        // Subscribe AFTER attach completes
        unsubscribeHandle = chControl.subscribe((msg) => {
          console.log("RaceControl: Received control message:", msg.name, msg.data);
          if (isSubscribed) {
            if (msg.name === "start") {
              console.log("RaceControl: Setting state to running");
              setState("running");
            } else if (msg.name === "end") {
              console.log("RaceControl: Setting state to finished");
              setState("finished");
            }
          }
        });
      }
    }).catch((err) => {
      if (isSubscribed) {
        console.error("RaceControl: Failed to attach channel:", err);
      }
    });

    return () => {
      isSubscribed = false;
      if (unsubscribeHandle) {
        chControl.unsubscribe(unsubscribeHandle);
      }
    };
  }, [raceId]);

  const handleStart = async () => {
    if (!isChannelReady || !chControlRef.current) {
      console.error("Channel not ready yet");
      return;
    }
    try {
      await chControlRef.current.publish("start", {
        raceId,
        timestamp: Date.now(),
        action: "start_race"
      });
      console.log("Race started");
      // Immediately update local state
      setState("running");
    } catch (err) {
      console.error("Failed to start race:", err);
    }
  };

  const handleEnd = async () => {
    console.log("handleEnd button clicked");
    console.log("isChannelReady:", isChannelReady);
    console.log("chControlRef.current:", chControlRef.current);
    console.log("current state:", state);
    
    if (!isChannelReady || !chControlRef.current) {
      console.error("Channel not ready yet");
      return;
    }
    try {
      console.log("Publishing end message...");
      await chControlRef.current.publish("end", {
        raceId,
        timestamp: Date.now(),
        action: "end_race"
      });
      console.log("Race end message published successfully");
      // Immediately update local state
      setState("finished");
    } catch (err) {
      console.error("Failed to end race:", err);
    }
  };

  const handleReset = () => {
    setState("idle");
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #333",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
  };

  const primaryStyle = {
    ...buttonStyle,
    background: state === "running" ? "#FFB020" : "#22c55e",
    color: "white",
  };

  const secondaryStyle = {
    ...buttonStyle,
    background: state === "idle" ? "#e5e7eb" : "#ef4444",
    color: state === "idle" ? "#6b7280" : "white",
  };

  return (
    <div style={{
      display: "flex",
      gap: 8,
      alignItems: "center",
      padding: 12,
      background: "#f9fafb",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      marginTop: 8,
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>
        Race Control:
      </div>
      <button
        onClick={handleStart}
        style={primaryStyle}
        disabled={state === "running" || !isChannelReady}
      >
        {state === "idle" ? "Start Race" : state === "running" ? "Race Running..." : "Restart"}
      </button>
      <button
        onClick={handleEnd}
        style={secondaryStyle}
        disabled={!isChannelReady}
      >
        End Race
      </button>
      {state === "finished" && (
        <button
          onClick={handleReset}
          style={{
            ...buttonStyle,
            background: "#6b7280",
            color: "white",
          }}
        >
          Reset
        </button>
      )}
      <div style={{
        marginLeft: "auto",
        fontSize: 12,
        color: state === "running" ? "#22c55e" : state === "finished" ? "#ef4444" : "#6b7280",
        fontWeight: 600,
      }}>
        State: {state.toUpperCase()}
      </div>
      {!isChannelReady && (
        <div style={{
          fontSize: 11,
          color: "#ef4444",
          fontWeight: 600,
        }}>
          ⚠️ Connecting...
        </div>
      )}
    </div>
  );
}
