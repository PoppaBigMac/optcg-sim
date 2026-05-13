// Mulberry32: a simple, fast, deterministic 32-bit PRNG.
// Returns a value in [0, 1) and the next seed state.
export function mulberry32(state: number): { value: number; next: number } {
  let t = (state + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const next = ((t ^ (t >>> 14)) >>> 0);
  return { value: next / 0x100000000, next };
}

// Fisher-Yates shuffle using seeded PRNG. Returns shuffled array + new RNG state.
export function seededShuffle<T>(arr: readonly T[], rngState: number): { result: T[]; rngState: number } {
  const out = [...arr];
  let state = rngState;
  for (let i = out.length - 1; i > 0; i--) {
    const { value, next } = mulberry32(state);
    state = next;
    const j = Math.floor(value * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { result: out, rngState: state };
}
