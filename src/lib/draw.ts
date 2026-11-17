import type { Participant } from './types';
import type { Prize, RepeatPolicy } from './prizes';
import type { RandomInt } from './rng';

export interface PoolEntry {
  id: string;
  name: string;
  area: string;
  tickets: number;
  originalTickets: number;
}

export interface DrawLogEntry {
  prizeId: string;
  prizeName: string;
  prizeIndex: number;
  slot: number;
  winnerId: string;
  winnerName: string;
  ticketsAtWin: number;
  poolTotal: number;
  poolSize: number;
  pick: number;
  at: string;
}

export interface DrawState {
  pool: PoolEntry[];
  won: string[];
  logs: DrawLogEntry[];
  prizeIndex: number;
  slot: number;
  startedAt: string;
}

export function createDraw(participants: Participant[], now: Date = new Date()): DrawState {
  return {
    pool: participants
      .filter((p) => p.tickets > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        area: p.area,
        tickets: p.tickets,
        originalTickets: p.tickets,
      })),
    won: [],
    logs: [],
    prizeIndex: 0,
    slot: 0,
    startedAt: now.toISOString(),
  };
}

export function currentPrize(state: DrawState, prizes: Prize[]): Prize | null {
  return prizes[state.prizeIndex] ?? null;
}

export function isFinished(state: DrawState, prizes: Prize[]): boolean {
  return state.prizeIndex >= prizes.length;
}

export function eligiblePool(state: DrawState, policy: RepeatPolicy): PoolEntry[] {
  const alive = state.pool.filter((entry) => entry.tickets > 0);
  if (policy === 'always') return alive;
  return alive.filter((entry) => !state.won.includes(entry.id));
}

export function totalTickets(pool: PoolEntry[]): number {
  return pool.reduce((sum, entry) => sum + entry.tickets, 0);
}

function pickWeighted(pool: PoolEntry[], rng: RandomInt): { entry: PoolEntry; pick: number; total: number } {
  const total = totalTickets(pool);
  const pick = rng(total);
  let accumulated = 0;
  for (const entry of pool) {
    accumulated += entry.tickets;
    if (pick < accumulated) return { entry, pick, total };
  }
  return { entry: pool[pool.length - 1], pick, total };
}

/**
 * Ejecuta un sorteo: devuelve el estado nuevo y el registro del ganador.
 * La selección es uniforme sobre los tickets, no sobre las personas.
 */
export function drawNext(
  state: DrawState,
  prizes: Prize[],
  policy: RepeatPolicy,
  rng: RandomInt,
  now: Date = new Date(),
): DrawState {
  const prize = prizes[state.prizeIndex];
  if (!prize) throw new Error('No quedan premios por sortear');

  let base = state;
  let pool = eligiblePool(base, policy);

  // Política "after-all": si ya ganaron todos, se reinicia el pool.
  if (pool.length === 0 && policy === 'after-all' && base.pool.length > 0) {
    base = {
      ...base,
      won: [],
      pool: base.pool.map((entry) => ({ ...entry, tickets: entry.originalTickets })),
    };
    pool = eligiblePool(base, policy);
  }

  if (pool.length === 0) {
    throw new Error('No hay participantes elegibles en el sorteo');
  }

  const { entry: winner, pick, total } = pickWeighted(pool, rng);
  const ticketsAtWin = winner.tickets;

  const newPool = base.pool.map((entry) => {
    if (entry.id !== winner.id) return entry;
    if (policy === 'always') {
      return { ...entry, tickets: Math.max(0, entry.tickets - 1) };
    }
    return { ...entry, tickets: 0 };
  });

  const log: DrawLogEntry = {
    prizeId: prize.id,
    prizeName: prize.name,
    prizeIndex: base.prizeIndex,
    slot: base.slot,
    winnerId: winner.id,
    winnerName: winner.name,
    ticketsAtWin,
    poolTotal: total,
    poolSize: pool.length,
    pick,
    at: now.toISOString(),
  };

  const nextSlot = base.slot + 1;
  const prizeComplete = nextSlot >= Math.max(1, prize.winners);

  return {
    ...base,
    pool: newPool,
    won: base.won.includes(winner.id) ? base.won : [...base.won, winner.id],
    logs: [...base.logs, log],
    prizeIndex: prizeComplete ? base.prizeIndex + 1 : base.prizeIndex,
    slot: prizeComplete ? 0 : nextSlot,
  };
}

/**
 * Muestra ponderada para la tira del reel: las personas con más tickets
 * aparecen proporcionalmente más veces.
 */
export function weightedSample(pool: PoolEntry[], count: number, rng: RandomInt): PoolEntry[] {
  if (pool.length === 0 || count <= 0) return [];
  const sample: PoolEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    sample.push(pickWeighted(pool, rng).entry);
  }
  return sample;
}
