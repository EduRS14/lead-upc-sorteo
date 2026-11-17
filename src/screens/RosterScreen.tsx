import { useMemo, useState } from 'react';
import { Button, Card, Logo, Pill, Stat } from '../components/ui';
import { drawableParticipants } from '../lib/aggregate';
import type { Settings } from '../lib/session';
import type { Flag, Roster } from '../lib/types';

const FLAG_LABELS: Record<Flag['code'], string> = {
  'no-consent': 'Sin consentimiento',
  'missing-tickets': 'Tickets vacío',
  'suspicious-tickets': 'Tickets alto',
  'rows-mismatch': 'Filas no coinciden',
  'operation-shared': 'Operación repetida',
};

interface RosterScreenProps {
  roster: Roster;
  settings: Settings;
  onFreeze: () => void;
  onBack: () => void;
  freezing: boolean;
}

export function RosterScreen({ roster, settings, onFreeze, onBack, freezing }: RosterScreenProps) {
  const [query, setQuery] = useState('');

  const drawable = useMemo(
    () => drawableParticipants(roster, { excludeWithoutConsent: settings.excludeNoConsent }),
    [roster, settings.excludeNoConsent],
  );

  const drawTickets = useMemo(() => drawable.reduce((sum, p) => sum + p.tickets, 0), [drawable]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return roster.participants;
    return roster.participants.filter(
      (p) => p.name.toLowerCase().includes(term) || p.area.toLowerCase().includes(term),
    );
  }, [roster.participants, query]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <header className="mx-auto flex max-w-6xl items-center gap-4">
        <Logo size={48} />
        <div className="flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-lilac">
            Revisión previa
          </p>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Nómina de participantes</h1>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
      </header>

      <main className="mx-auto mt-6 max-w-6xl space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Personas" value={roster.stats.people} hint={`${roster.stats.rows} filas leídas`} />
          <Stat label="Tickets totales" value={roster.stats.tickets} hint={`${roster.stats.submissions} envíos`} />
          <Stat
            label="En el sorteo"
            value={drawable.length}
            hint={`${drawTickets} tickets con peso`}
          />
          <Stat
            label="Alertas"
            value={roster.stats.flagged}
            hint={roster.stats.withoutConsent ? `${roster.stats.withoutConsent} sin consentimiento` : 'Sin observaciones'}
          />
        </div>

        {roster.sharedOperations.length > 0 ? (
          <Card className="border-amber-400/30 bg-amber-400/[0.06]">
            <p className="text-sm font-bold text-amber-200">
              {roster.sharedOperations.length} N.° de operación repetido(s) entre personas distintas
            </p>
            <p className="mt-1 text-xs text-amber-100/80">
              No bloquea el sorteo. Puede ser legítimo si una persona pagó los tickets de varias.
              Revisar con Finanzas si hace falta.
            </p>
          </Card>
        ) : null}

        <Card className="p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.16em]">Participantes</h2>
              <p className="mt-0.5 text-xs text-lilac">
                Las filas multiplicadas no alteran el conteo: se respeta lo declarado en «Cantidad de
                Tickets».
              </p>
            </div>
            <input
              className="input max-w-xs py-2 text-sm"
              placeholder="Buscar por nombre o área…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="scroll-thin max-h-[52vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#0a1147] text-[0.65rem] uppercase tracking-[0.14em] text-lilac">
                <tr>
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Área</th>
                  <th className="px-5 py-3 text-center font-semibold">Tickets</th>
                  <th className="px-5 py-3 text-center font-semibold">Envíos</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person, index) => {
                  const excluded = settings.excludeNoConsent && person.consent === false;
                  return (
                    <tr key={person.id} className={`roster-row ${excluded ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3 text-xs text-lilac">{index + 1}</td>
                      <td className="px-5 py-3 font-semibold">{person.name}</td>
                      <td className="px-5 py-3 text-xs text-lilac">{person.area || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="pill pill-ticket">{person.tickets}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-lilac">{person.submissions}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {excluded ? <Pill tone="danger">Excluido</Pill> : null}
                          {person.flags
                            .filter((flag) => flag.code !== 'no-consent' || !excluded)
                            .map((flag) => (
                              <Pill
                                key={`${flag.code}-${flag.detail ?? ''}`}
                                tone="warn"
                              >
                                {FLAG_LABELS[flag.code]}
                              </Pill>
                            ))}
                          {!excluded && person.flags.length === 0 ? (
                            <span className="text-xs text-lilac/60">—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-lilac">Sin resultados.</p>
            ) : null}
          </div>
        </Card>

        <div className="flex flex-col items-center gap-3 pb-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-lilac">
            Al bloquear se congela la nómina y se entra directo al sorteo.
          </p>
          <Button size="lg" onClick={onFreeze} disabled={freezing || drawable.length === 0}>
            {freezing ? 'Bloqueando…' : `Bloquear nómina y sortear (${drawable.length})`}
          </Button>
        </div>
      </main>
    </div>
  );
}
