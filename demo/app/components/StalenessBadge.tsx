// v1
export function StalenessBadge({ ms }: { ms: number }) {
    const color =
      ms < 500 ? "#16a34a" : ms < 1500 ? "#f59e0b" : "#ef4444"; // green / amber / red
    const label =
      ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
  
    return (
      <span style={{
        border: `1px solid ${color}`,
        color,
        padding: "2px 6px",
        borderRadius: 6,
        fontSize: 12,
        fontVariantNumeric: "tabular-nums",
      }}>
        {label} since update
      </span>
    );
  }