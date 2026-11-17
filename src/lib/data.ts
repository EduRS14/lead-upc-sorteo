import type { ApiPayload } from './types';

export interface Connection {
  url: string;
  token: string;
}

/** Normaliza la URL y le agrega el token como query param. */
export function buildUrl(connection: Connection): string {
  const raw = connection.url.trim();
  if (!raw) throw new Error('Falta la URL del Apps Script');

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('La URL no es válida');
  }

  // Google a veces inserta /macros/u/1/s/... cuando hay varias cuentas abiertas.
  parsed.pathname = parsed.pathname.replace(/^\/macros\/u\/\d+\//, '/macros/');

  if (!parsed.pathname.endsWith('/exec')) {
    throw new Error('La URL debe terminar en /exec');
  }

  if (connection.token.trim()) {
    parsed.searchParams.set('token', connection.token.trim());
  }
  return parsed.toString();
}

export async function fetchRoster(connection: Connection): Promise<ApiPayload> {
  const url = buildUrl(connection);
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      'El endpoint no devolvió JSON. Revisa que la implementación sea "Aplicación web" y esté publicada.',
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Respuesta inesperada del endpoint');
  }

  const payload = parsed as Record<string, unknown>;
  if (typeof payload.error === 'string') {
    throw new Error(`El script respondió: ${payload.error}`);
  }
  if (!Array.isArray(payload.rows)) {
    throw new Error('La respuesta no contiene una lista de filas');
  }

  return payload as unknown as ApiPayload;
}
