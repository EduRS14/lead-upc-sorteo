export interface RawRow {
  ts: string;
  nombres: string;
  apellidos: string;
  area: string;
  tickets: string;
  operacion: string;
  disponible: string;
  consent: string;
}

export interface ApiPayload {
  generatedAt: string;
  sheet?: string;
  count?: number;
  headers?: string[];
  rows: RawRow[];
}

export type FlagCode =
  | 'no-consent'
  | 'missing-tickets'
  | 'suspicious-tickets'
  | 'rows-mismatch'
  | 'operation-shared';

export interface Flag {
  code: FlagCode;
  detail?: string;
}

export interface Submission {
  key: string;
  ts: string;
  declared: number;
  rows: number;
  tickets: number;
  consent: boolean | null;
  area: string;
}

export interface Participant {
  id: string;
  name: string;
  nameKey: string;
  area: string;
  tickets: number;
  rows: number;
  submissions: number;
  consent: boolean | null;
  flags: Flag[];
}

export interface SharedOperation {
  operation: string;
  participants: string[];
}

export interface RosterStats {
  rows: number;
  submissions: number;
  people: number;
  tickets: number;
  withoutConsent: number;
  flagged: number;
}

export interface Roster {
  participants: Participant[];
  stats: RosterStats;
  sharedOperations: SharedOperation[];
}
