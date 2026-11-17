function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a-${hash.toString(16).padStart(8, '0')}`;
}

/**
 * Huella de la nómina congelada. Se muestra en el sorteo para demostrar
 * que la lista no cambió después de bloquearla.
 */
export async function sha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return fnv1a(input);
  try {
    const data = new TextEncoder().encode(input);
    const digest = await subtle.digest('SHA-256', data);
    return toHex(new Uint8Array(digest));
  } catch {
    return fnv1a(input);
  }
}

export function shortHash(hash: string): string {
  const clean = hash.replace(/^fnv1a-/, '');
  return clean.slice(0, 8).toUpperCase();
}
