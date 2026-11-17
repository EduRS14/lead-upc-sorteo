import { describe, expect, it } from 'vitest';
import { createDraw, drawNext, eligiblePool, weightedSample } from './draw';
import { presetPrizes } from './prizes';
import type { Participant } from './types';

function participant(id: string, tickets: number): Participant {
  return {
    id,
    name: id,
    nameKey: id,
    area: 'Marketing',
    tickets,
    rows: tickets,
    submissions: 1,
    consent: true,
    flags: [],
  };
}

const prizes = presetPrizes(1);

describe('motor de sorteo', () => {
  it('selecciona según el peso de tickets', () => {
    const state = createDraw([participant('Ana', 3), participant('Luis', 1)]);
    // total = 4; pick 0..2 -> Ana, pick 3 -> Luis
    expect(drawNext(state, prizes, 'never', () => 0).logs[0].winnerId).toBe('Ana');
    expect(drawNext(state, prizes, 'never', () => 3).logs[0].winnerId).toBe('Luis');
  });

  it('retira al ganador cuando la política es never', () => {
    const state = createDraw([participant('Ana', 3), participant('Luis', 1)]);
    const next = drawNext(state, prizes, 'never', () => 0);
    const pool = eligiblePool(next, 'never');
    expect(pool.map((p) => p.id)).toEqual(['Luis']);
  });

  it('descuenta un ticket cuando puede volver a ganar', () => {
    const state = createDraw([participant('Ana', 3)]);
    const next = drawNext(state, prizes, 'always', () => 0);
    expect(next.pool[0].tickets).toBe(2);
    expect(eligiblePool(next, 'always').map((p) => p.id)).toEqual(['Ana']);
  });

  it('avanza al siguiente premio al completar los ganadores', () => {
    const twoPrizes = [
      { id: 'a', name: 'Premio A', winners: 2 },
      { id: 'b', name: 'Premio B', winners: 1 },
    ];
    const state = createDraw([participant('Ana', 5), participant('Luis', 5)]);
    const first = drawNext(state, twoPrizes, 'never', () => 0);
    expect(first.prizeIndex).toBe(0);
    const second = drawNext(first, twoPrizes, 'never', () => 0);
    expect(second.prizeIndex).toBe(1);
    expect(second.slot).toBe(0);
  });

  it('reinicia el pool con la política after-all', () => {
    const state = createDraw([participant('Ana', 1), participant('Luis', 1)]);
    const one = drawNext(state, prizes, 'after-all', () => 0);
    const two = drawNext(one, prizes, 'after-all', () => 0);
    const three = drawNext(two, prizes, 'after-all', () => 0);
    expect(three.won).toHaveLength(1);
    expect(eligiblePool(three, 'after-all').length).toBeGreaterThan(0);
  });

  it('la muestra ponderada respeta el peso', () => {
    const pool = [
      { id: 'Ana', name: 'Ana', area: '', tickets: 9, originalTickets: 9 },
      { id: 'Luis', name: 'Luis', area: '', tickets: 1, originalTickets: 1 },
    ];
    const sample = weightedSample(pool, 1000, () => 0);
    expect(sample.every((entry) => entry.id === 'Ana')).toBe(true);
  });
});
