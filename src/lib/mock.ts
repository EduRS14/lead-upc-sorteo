import type { ApiPayload, RawRow } from './types';
import { makeSeededRng } from './rng';

const NOMBRES = [
  'María', 'José', 'Luis', 'Ana', 'Carlos', 'Andrea', 'Jorge', 'Camila', 'Diego', 'Valeria',
  'Miguel', 'Sofía', 'Fernando', 'Lucía', 'Ricardo', 'Daniela', 'Alonso', 'Gabriela', 'Pedro',
  'Mariana', 'Sebastián', 'Paola', 'Raúl', 'Fernanda', 'Iván', 'Renata', 'Hugo', 'Alessandra',
  'Bruno', 'Katherine', 'Emilio', 'Nicole', 'Álvaro', 'Ximena', 'Rodrigo', 'Bianca', 'Mateo',
  'Valentina', 'Cristian', 'Ariana', 'Eduardo', 'Melissa', 'Joaquín', 'Fiorella', 'Sergio',
];

const APELLIDOS = [
  'Quispe', 'Flores', 'Sánchez', 'Rodríguez', 'Vargas', 'Ramos', 'Castillo', 'Mendoza', 'Huamán',
  'García', 'Torres', 'Rojas', 'Chávez', 'Salazar', 'Cárdenas', 'Paredes', 'Espinoza', 'Gutiérrez',
  'Silva', 'Ríos', 'Pérez', 'Medina', 'Aguilar', 'Campos', 'Cruz', 'Delgado', 'Herrera', 'León',
  'Palacios', 'Reyes', 'Suárez', 'Tello', 'Valdivia', 'Zamora', 'Bautista', 'Córdova', 'Farfán',
];

const AREAS = [
  'Marketing',
  'Finanzas',
  'Logística',
  'Transformación Digital',
  'Operaciones',
];

const TICKET_WEIGHTS = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5];

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Genera filas que imitan la hoja real, incluyendo los casos difíciles:
 * filas multiplicadas, tickets como texto, envíos repetidos, consentimientos
 * negados y números de operación compartidos.
 */
export function buildMockRows(seed = 20261122): RawRow[] {
  const rng = makeSeededRng(seed);
  const rows: RawRow[] = [];

  const totalPeople = 165;

  for (let i = 0; i < totalPeople; i += 1) {
    const nombres = NOMBRES[Math.floor(rng(NOMBRES.length))];
    const apellidos = `${APELLIDOS[Math.floor(rng(APELLIDOS.length))]} ${
      APELLIDOS[Math.floor(rng(APELLIDOS.length))]
    }`;
    const area = AREAS[Math.floor(rng(AREAS.length))];
    const tickets = TICKET_WEIGHTS[Math.floor(rng(TICKET_WEIGHTS.length))];
    const consent = rng(100) < 4 ? 'No autorizo' : 'Sí, autorizo el uso de mis datos';
    const operation = `OP${(100000 + Math.floor(rng(899999))).toString()}`;
    const duplicated = rng(100) < 35;
    const ticketsText = rng(100) < 20 ? `${tickets} tickets` : String(tickets);

    const minute = Math.floor(rng(600));
    const ts = `${pad(10 + Math.floor(minute / 60))}:${pad(minute % 60)}`;

    const repetitions = duplicated ? tickets : 1;
    for (let r = 0; r < repetitions; r += 1) {
      rows.push({
        ts,
        nombres,
        apellidos,
        area,
        tickets: ticketsText,
        operacion: operation,
        disponible: rng(100) < 72 ? 'Sí' : 'No',
        consent,
      });
    }

    // Algunas personas vuelven a comprar en otro momento.
    if (i % 23 === 0) {
      const extra = 1 + Math.floor(rng(3));
      const minute2 = Math.floor(rng(600));
      rows.push({
        ts: `${pad(12 + Math.floor(minute2 / 60))}:${pad(minute2 % 60)}`,
        nombres,
        apellidos,
        area,
        tickets: String(extra),
        operacion: `OP${(100000 + Math.floor(rng(899999))).toString()}`,
        disponible: 'Sí',
        consent,
      });
    }
  }

  return rows;
}

export function buildMockPayload(): ApiPayload {
  const rows = buildMockRows();
  return {
    generatedAt: new Date().toISOString(),
    sheet: 'Datos de prueba',
    count: rows.length,
    rows,
  };
}

export const MOCK_BASE_DATE = new Date('2026-11-18T09:00:00-05:00');
