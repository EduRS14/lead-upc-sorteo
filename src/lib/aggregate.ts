import type { Flag, Participant, RawRow, Roster, Submission } from './types';
import { cleanName, nameKey, parseConsent, parseTickets } from './normalize';

const SUSPICIOUS_TICKETS = 50;

interface NormalizedRow {
  ts: string;
  name: string;
  key: string;
  area: string;
  declared: number | null;
  consent: boolean | null;
  operation: string;
}

interface PersonAccumulator {
  name: string;
  key: string;
  area: string;
  submissions: Submission[];
  rows: number;
  operations: string[];
}

/**
 * Cuenta los tickets de cada persona a partir de las filas del formulario.
 *
 * Regla central, inmune a la duplicación de filas:
 *   - Si la persona declaró 2 o más tickets, se respeta lo declarado.
 *   - Si declaró 1 (o dejó vacío), se cuenta el número de filas.
 *
 * Así da igual si la hoja tiene 1 fila por envío o las filas multiplicadas.
 */
export function aggregate(rows: RawRow[]): Roster {
  const normalized: NormalizedRow[] = rows
    .map((row) => ({
      ts: String(row.ts ?? '').trim(),
      name: cleanName(row.nombres, row.apellidos),
      key: nameKey(row.nombres, row.apellidos),
      area: String(row.area ?? '').trim(),
      declared: parseTickets(row.tickets),
      consent: parseConsent(row.consent),
      operation: String(row.operacion ?? '').trim(),
    }))
    .filter((row) => row.key.length > 0);

  // 1. Agrupar por envío: mismo timestamp + misma persona.
  const submissionsMap = new Map<string, NormalizedRow[]>();
  for (const row of normalized) {
    const submissionKey = `${row.ts}||${row.key}`;
    const group = submissionsMap.get(submissionKey);
    if (group) group.push(row);
    else submissionsMap.set(submissionKey, [row]);
  }

  // 2. Convertir cada envío en tickets y agrupar por persona.
  const peopleMap = new Map<string, PersonAccumulator>();
  let submissionCount = 0;

  for (const group of submissionsMap.values()) {
    if (group.length === 0) continue;
    submissionCount += 1;
    const first = group[0];

    const declared = group.reduce((max, row) => Math.max(max, row.declared ?? 0), 0);
    const rowsInSubmission = group.length;
    const tickets = declared >= 2 ? declared : Math.max(1, rowsInSubmission);

    const consent: boolean | null = group.some((row) => row.consent === false)
      ? false
      : group.every((row) => row.consent === true)
        ? true
        : null;

    const submission: Submission = {
      key: `${first.ts}||${first.key}`,
      ts: first.ts,
      declared,
      rows: rowsInSubmission,
      tickets,
      consent,
      area: first.area,
    };

    let person = peopleMap.get(first.key);
    if (!person) {
      person = {
        name: first.name,
        key: first.key,
        area: '',
        submissions: [],
        rows: 0,
        operations: [],
      };
      peopleMap.set(first.key, person);
    }

    if (!person.area) {
      const area = group.find((row) => row.area)?.area ?? '';
      if (area) person.area = area;
    }

    person.submissions.push(submission);
    person.rows += rowsInSubmission;
    for (const row of group) {
      if (row.operation) person.operations.push(row.operation);
    }
  }

  // 3. Construir participantes con sus alertas.
  const participants: Participant[] = [];
  for (const person of peopleMap.values()) {
    const flags: Flag[] = [];

    if (person.submissions.some((sub) => sub.declared === 0)) {
      flags.push({ code: 'missing-tickets' });
    }
    if (person.submissions.some((sub) => sub.declared > SUSPICIOUS_TICKETS)) {
      flags.push({ code: 'suspicious-tickets' });
    }
    if (
      person.submissions.some((sub) => sub.rows > 1 && sub.declared >= 2 && sub.rows !== sub.declared)
    ) {
      flags.push({ code: 'rows-mismatch' });
    }

    const consent: boolean | null = person.submissions.some((sub) => sub.consent === false)
      ? false
      : person.submissions.every((sub) => sub.consent === true)
        ? true
        : null;

    if (consent === false) {
      flags.push({ code: 'no-consent' });
    }

    participants.push({
      id: person.key,
      name: person.name,
      nameKey: person.key,
      area: person.area,
      tickets: person.submissions.reduce((sum, sub) => sum + sub.tickets, 0),
      rows: person.rows,
      submissions: person.submissions.length,
      consent,
      flags,
    });
  }

  // 4. N° de operación compartido entre personas distintas (informativo, no bloquea).
  const operationMap = new Map<string, Set<string>>();
  for (const person of peopleMap.values()) {
    for (const operation of person.operations) {
      const owners = operationMap.get(operation);
      if (owners) owners.add(person.key);
      else operationMap.set(operation, new Set([person.key]));
    }
  }

  const sharedOperations = [...operationMap.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([operation, owners]) => ({ operation, participants: [...owners] }));

  for (const shared of sharedOperations) {
    for (const participant of participants) {
      if (shared.participants.includes(participant.id)) {
        participant.flags.push({ code: 'operation-shared', detail: shared.operation });
      }
    }
  }

  participants.sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const tickets = participants.reduce((sum, p) => sum + p.tickets, 0);
  const withoutConsent = participants.filter((p) => p.consent === false).length;

  return {
    participants,
    stats: {
      rows: normalized.length,
      submissions: submissionCount,
      people: participants.length,
      tickets,
      withoutConsent,
      flagged: participants.filter((p) => p.flags.length > 0).length,
    },
    sharedOperations,
  };
}

/** Participantes que pueden entrar al sorteo según la configuración. */
export function drawableParticipants(
  roster: Roster,
  options: { excludeWithoutConsent: boolean },
): Participant[] {
  return roster.participants.filter((p) => {
    if (p.tickets <= 0) return false;
    if (options.excludeWithoutConsent && p.consent === false) return false;
    return true;
  });
}
