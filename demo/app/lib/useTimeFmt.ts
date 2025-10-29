// v1
export function fmtMs(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(2)}s`;
    const m = Math.floor(s / 60), r = (s % 60).toFixed(0);
    return `${m}m ${r}s`;
  }
  
  export function avg(nums: number[]) {
    return nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length) : 0;
  }