import type { DrawState } from './draw';
import type { ApiPayload, Participant, RosterStats } from './types';
import { presetPrizes, type PresetId, type Prize, type RepeatPolicy } from './prizes';

export type Stage = 'setup' | 'roster' | 'draw' | 'winners';

export interface Settings {
  preset: PresetId;
  prizes: Prize[];
  repeatPolicy: RepeatPolicy;
  excludeNoConsent: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  preset: 1,
  prizes: presetPrizes(1),
  repeatPolicy: 'never',
  excludeNoConsent: true,
};

export interface FrozenRoster {
  participants: Participant[];
  hash: string;
  frozenAt: string;
  source: string;
  stats: RosterStats;
  totalTickets: number;
}

export interface Session {
  stage: Stage;
  payload: ApiPayload | null;
  frozen: FrozenRoster | null;
  draw: DrawState | null;
  prizes: Prize[];
  policy: RepeatPolicy;
}

export const EMPTY_SESSION: Session = {
  stage: 'setup',
  payload: null,
  frozen: null,
  draw: null,
  prizes: [],
  policy: 'never',
};
