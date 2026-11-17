import { describe, expect, it } from 'vitest';
import { aggregate } from './aggregate';
import type { RawRow } from './types';

function row(overrides: Partial<RawRow> = {}): RawRow {
  return {
    ts: '10:00',
    nombres: 'María',
    apellidos: 'Pérez',
    area: 'Marketing',
    tickets: '3',
    operacion: 'OP1',
    disponible: 'Sí',
    consent: 'Sí, autorizo',
    ...overrides,
  };
}

function ticketsOf(rows: RawRow[], name = 'María Pérez'): number {
  const roster = aggregate(rows);
  return roster.participants.find((p) => p.name === name)?.tickets ?? 0;
}

describe('agregación de tickets', () => {
  it('respeta lo declarado cuando la fila no está duplicada', () => {
    expect(ticketsOf([row({ tickets: '3' })])).toBe(3);
  });

  it('no duplica el conteo cuando las filas están multiplicadas', () => {
    const rows = [row(), row(), row()];
    expect(ticketsOf(rows)).toBe(3);
  });

  it('cuenta filas si cada fila quedó con 1 ticket', () => {
    const rows = [row({ tickets: '1' }), row({ tickets: '1' }), row({ tickets: '1' })];
    expect(ticketsOf(rows)).toBe(3);
  });

  it('suma envíos distintos de la misma persona', () => {
    const rows = [row({ ts: '10:00', tickets: '3' }), row({ ts: '11:00', tickets: '2' })];
    expect(ticketsOf(rows)).toBe(5);
  });

  it('interpreta "2 tickets" como 2', () => {
    expect(ticketsOf([row({ tickets: '2 tickets' })])).toBe(2);
  });

  it('asume 1 ticket cuando el campo está vacío', () => {
    expect(ticketsOf([row({ tickets: '' })])).toBe(1);
  });

  it('une nombres con y sin tilde', () => {
    const rows = [row({ nombres: 'José', apellidos: 'Núñez' }), row({ nombres: 'JOSE', apellidos: 'NUNEZ' })];
    const roster = aggregate(rows);
    expect(roster.stats.people).toBe(1);
  });
});

describe('alertas', () => {
  it('marca consentimiento negado', () => {
    const roster = aggregate([row({ consent: 'No' })]);
    expect(roster.participants[0].consent).toBe(false);
    expect(roster.participants[0].flags.map((f) => f.code)).toContain('no-consent');
    expect(roster.stats.withoutConsent).toBe(1);
  });

  it('detecta el mismo N° de operación en personas distintas', () => {
    const rows = [
      row({ nombres: 'Ana', apellidos: 'Rojas', operacion: 'OP9' }),
      row({ nombres: 'Luis', apellidos: 'Vega', operacion: 'OP9' }),
    ];
    const roster = aggregate(rows);
    expect(roster.sharedOperations).toHaveLength(1);
    expect(roster.sharedOperations[0].participants).toHaveLength(2);
  });

  it('no marca operación compartida dentro de una misma persona', () => {
    const rows = [row({ ts: '10:00' }), row({ ts: '11:00' })];
    const roster = aggregate(rows);
    expect(roster.sharedOperations).toHaveLength(0);
  });

  it('advierte cuando la expansión de filas no coincide con lo declarado', () => {
    const rows = [row({ tickets: '4' }), row({ tickets: '4' })];
    const roster = aggregate(rows);
    expect(roster.participants[0].flags.map((f) => f.code)).toContain('rows-mismatch');
    expect(roster.participants[0].tickets).toBe(4);
  });
});
