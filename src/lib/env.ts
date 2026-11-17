const rawUrl = (import.meta.env.VITE_SHEET_URL ?? '').trim();
const rawToken = (import.meta.env.VITE_SHEET_TOKEN ?? '').trim();
const forceMock = String(import.meta.env.VITE_USE_MOCK ?? '').toLowerCase() === 'true';

/** Hoja configurada por variables de entorno (sin UI de conexión). */
export const SHEET_URL = rawUrl;
export const SHEET_TOKEN = rawToken;

/**
 * En desarrollo, si no hay URL configurada se usan datos de prueba para poder
 * ensayar el sorteo. En producción nunca se cae en mock por accidente.
 */
export const USING_MOCK = forceMock || (!SHEET_URL && import.meta.env.DEV);

export const ENV_ERROR =
  !USING_MOCK && !SHEET_URL
    ? 'Falta configurar VITE_SHEET_URL. Define la variable de entorno y vuelve a compilar.'
    : null;
