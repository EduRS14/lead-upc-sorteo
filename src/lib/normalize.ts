export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function collapse(value: string): string {
  return stripAccents(String(value ?? ''))
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanName(nombres: string, apellidos: string): string {
  return `${nombres ?? ''} ${apellidos ?? ''}`.replace(/\s+/g, ' ').trim();
}

export function nameKey(nombres: string, apellidos: string): string {
  return stripAccents(cleanName(nombres, apellidos)).toLowerCase();
}

/**
 * Convierte "3", "3 tickets", " 3 " en 3. Devuelve null si no hay número.
 */
export function parseTickets(raw: string): number | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const match = text.match(/\d{1,5}/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

/**
 * "Sí, autorizo..." -> true · "No" -> false · vacío -> null
 */
export function parseConsent(raw: string): boolean | null {
  const text = collapse(String(raw ?? '')).toLowerCase();
  if (!text) return null;
  if (text.startsWith('no') || text === 'false') return false;
  if (text.startsWith('si') || text === 'yes' || text === 'true') return true;
  return null;
}
