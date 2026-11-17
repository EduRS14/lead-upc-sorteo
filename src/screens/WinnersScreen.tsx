import { Button, Card, Logo, Pill } from '../components/ui';
import { downloadFile, toCsv } from '../lib/download';
import type { DrawState } from '../lib/draw';
import type { Prize } from '../lib/prizes';
import type { FrozenRoster } from '../lib/session';

interface WinnersScreenProps {
  prizes: Prize[];
  frozen: FrozenRoster;
  draw: DrawState;
  onReset: () => void;
  onHome: () => void;
}

export function WinnersScreen({ prizes, frozen, draw, onReset, onHome }: WinnersScreenProps) {
  const groups = prizes
    .map((prize, index) => ({
      prize,
      winners: draw.logs.filter((log) => log.prizeIndex === index),
    }))
    .filter((group) => group.winners.length > 0);

  const exportCsv = () => {
    const rows: string[][] = [['Premio', 'Ganador', 'Tickets al ganar', 'Tickets en juego', 'Fecha']];
    for (const group of groups) {
      for (const log of group.winners) {
        rows.push([
          group.prize.name,
          log.winnerName,
          String(log.ticketsAtWin),
          String(log.poolTotal),
          new Date(log.at).toLocaleString('es-PE'),
        ]);
      }
    }
    downloadFile('ganadores-rifa-lead.csv', toCsv(rows), 'text/csv');
  };

  const exportAudit = () => {
    const audit = {
      rifa: 'Rifa LEAD UPC 2026',
      hash: frozen.hash,
      frozenAt: frozen.frozenAt,
      source: frozen.source,
      participantsInDraw: frozen.participants.length,
      totalTickets: frozen.totalTickets,
      prizes,
      draws: draw.logs,
    };
    downloadFile('auditoria-rifa-lead.json', JSON.stringify(audit, null, 2), 'application/json');
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <header className="mx-auto flex max-w-4xl items-center gap-4">
        <Logo size={48} />
        <div className="flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-lilac">
            Rifa LEAD UPC
          </p>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Ganadores</h1>
        </div>
        <Button variant="ghost" onClick={onHome}>
          Inicio
        </Button>
      </header>

      <main className="mx-auto mt-6 max-w-4xl space-y-4 pb-10">
        <Card className="text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lilac">
            Sorteo finalizado
          </p>
          <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {draw.logs.length} {draw.logs.length === 1 ? 'ganador' : 'ganadores'}
          </p>
          <p className="mt-2 text-xs text-lilac">
            Nómina de {frozen.participants.length} personas · {frozen.totalTickets} tickets
          </p>
        </Card>

        {groups.map((group) => (
          <Card key={group.prize.id} className="fade-up">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold">{group.prize.name}</h2>
              <Pill tone="ticket">
                {group.winners.length} {group.winners.length === 1 ? 'ganador' : 'ganadores'}
              </Pill>
            </div>
            <div className="mt-3 space-y-2">
              {group.winners.map((log, index) => (
                <div
                  key={`${log.winnerId}-${index}`}
                  className="rounded-2xl bg-white/[0.04] px-4 py-3"
                >
                  <span className="block font-bold">{log.winnerName}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button onClick={exportCsv}>Exportar ganadores (CSV)</Button>
          <Button variant="ghost" onClick={exportAudit}>
            Descargar auditoría (JSON)
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Nuevo sorteo
          </Button>
        </div>

        <p className="text-center text-[0.7rem] text-lilac/60">
          «A Student Chapter @UPC» · Learn. Explore. Aspire. Discover.
        </p>
      </main>
    </div>
  );
}
