// v1
'use client';
export function Sparkline({ data }:{ data: number[] }) {
  const w = 280, h = 60, max = Math.max(1, ...data);
  const points = data.map((v, i) => {
    const x = (i/(data.length-1))*w;
    const y = h - (v/max)*h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="border rounded bg-gray-50">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}