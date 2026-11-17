export type RandomInt = (maxExclusive: number) => number;

/**
 * Entero uniforme en [0, maxExclusive) usando la CSPRNG del navegador.
 * Rechaza valores del tramo final para evitar sesgo.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive debe ser mayor que 0');
  }
  const max = Math.floor(maxExclusive);
  if (max === 1) return 0;

  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

/** RNG determinista para pruebas y para generar datos mock. */
export function makeSeededRng(seed: number): RandomInt {
  let state = seed >>> 0;
  return (maxExclusive: number) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    return Math.min(maxExclusive - 1, Math.floor(value * maxExclusive));
  };
}

/** Copia mezclada (Fisher-Yates) usando el RNG recibido. */
export function shuffle<T>(items: readonly T[], rng: RandomInt): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng(i + 1);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}
