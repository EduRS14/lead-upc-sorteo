import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Logo, Stat } from '../components/ui';
import { Confetti } from '../visuals/Confetti';
import { Reel } from '../visuals/Reel';
import {
  currentPrize,
  drawNext,
  eligiblePool,
  isFinished,
  totalTickets,
  type DrawState,
} from '../lib/draw';
import type { Prize, RepeatPolicy } from '../lib/prizes';
import { secureRandomInt, shuffle } from '../lib/rng';
import type { FrozenRoster } from '../lib/session';

interface DrawScreenProps {
  prizes: Prize[];
  policy: RepeatPolicy;
  frozen: FrozenRoster;
  draw: DrawState;
  onChange: (state: DrawState) => void;
  onFinish: () => void;
  onHome: () => void;
}

const MIN_REEL_ROWS = 160;
const LEAD_MIN = 38;
const LEAD_RANGE = 9;

/**
 * La tira es el bombo literal desplegado al azar: cada ticket es una fila con
 * el nombre, y toda la tira se mezcla para que nadie quede agrupado ni tenga
 * preferencia de posición. Luego se rota para terminar en el ganador.
 */
function buildReel(
  pool: DrawState['pool'],
  winnerName: string,
  rng: typeof secureRandomInt,
): { items: string[]; winnerIndex: number } {
  const drum: string[] = [];
  for (const entry of pool) {
    const copies = Math.max(1, Math.round(entry.tickets));
    for (let i = 0; i < copies; i += 1) drum.push(entry.name);
  }

  if (drum.length === 0) return { items: [winnerName], winnerIndex: 0 };

  let rows = shuffle(drum, rng);
  while (rows.length < MIN_REEL_ROWS) rows = rows.concat(shuffle(drum, rng));

  const positions: number[] = [];
  rows.forEach((name, index) => {
    if (name === winnerName) positions.push(index);
  });

  const lead = LEAD_MIN + rng(LEAD_RANGE);
  if (positions.length === 0) {
    const items = [...rows];
    items.splice(lead, 0, winnerName);
    return { items, winnerIndex: lead };
  }

  const landing = positions[rng(positions.length)];
  const shift = (landing - lead + rows.length) % rows.length;
  const items = shift === 0 ? rows : rows.slice(shift).concat(rows.slice(0, shift));
  return { items, winnerIndex: lead };
}

export function DrawScreen({
  prizes,
  policy,
  frozen,
  draw,
  onChange,
  onFinish,
  onHome,
}: DrawScreenProps) {
  const [spinId, setSpinId] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(-1);
  const [pending, setPending] = useState<DrawState | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prize = currentPrize(draw, prizes);
  const finished = isFinished(draw, prizes);
  const pool = eligiblePool(draw, policy);
  const poolTickets = totalTickets(pool);
  const lastLog = draw.logs.length > 0 ? draw.logs[draw.logs.length - 1] : null;

  const headerPrize = revealed && lastLog ? lastLog.prizeName : prize?.name ?? 'Sorteo finalizado';
  const headerNumber = revealed && lastLog ? lastLog.prizeIndex + 1 : draw.prizeIndex + 1;

  const spin = useCallback(() => {
    if (!prize || spinning || revealed) return;
    try {
      const next = drawNext(draw, prizes, policy, secureRandomInt);
      const log = next.logs[next.logs.length - 1];
      const usable = pool.length > 0 ? pool : draw.pool;
      const strip = buildReel(usable, log.winnerName, secureRandomInt);

      setItems(strip.items);
      setTargetIndex(strip.winnerIndex);
      setSpinId((value) => value + 1);
      setPending(next);
      setSpinning(true);
      setRevealed(false);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo sortear');
    }
  }, [draw, policy, pool, prize, prizes, revealed, spinning]);

  const handleDone = () => {
    setSpinning(false);
    if (pending) onChange(pending);
    setPending(null);
    setRevealed(true);
  };

  const next = () => {
    setRevealed(false);
    if (finished) onFinish();
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (revealed) next();
        else spin();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  });

  const groupedLogs = useMemo(() => {
    const groups = new Map<number, typeof draw.logs>();
    for (const log of draw.logs) {
      const list = groups.get(log.prizeIndex);
      if (list) list.push(log);
      else groups.set(log.prizeIndex, [log]);
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [draw.logs]);

  return (
    <div className="flex min-h-screen flex-col">
      <Confetti active={revealed} />

      <header className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Logo size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-lilac">
            {finished && !revealed ? 'Sorteo finalizado' : `Premio ${Math.min(headerNumber, prizes.length)} de ${prizes.length}`}
          </p>
          <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">{headerPrize}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="quiet" size="sm" onClick={onHome}>
            Salir
          </Button>
        </div>
      </header>

      <main className="stage-grid flex-1 px-4 pb-6 sm:px-6">
        <section className="flex flex-col items-center justify-center gap-5 py-2">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <span className="pill pill-ticket text-[0.7rem]">
              {pool.length} personas · {poolTickets} tickets
            </span>
            {frozen.stats.withoutConsent > 0 ? (
              <span className="pill pill-warn text-[0.7rem]">
                {frozen.stats.withoutConsent} sin consentimiento
              </span>
            ) : null}
          </div>

          <Reel
            items={items}
            targetIndex={targetIndex}
            spinId={spinId}
            spinning={spinning}
            onDone={handleDone}
          />

          {revealed && lastLog ? (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="reel-shell rounded-[28px] border border-white/10 bg-white/[0.05] p-6 text-center ring-glow"
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lilac">
                Ganador · {lastLog.prizeName}
              </p>
              <p className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                {lastLog.winnerName}
              </p>
              <Button className="mt-4" size="lg" onClick={next}>
                {finished
                  ? 'Ver ganadores'
                  : draw.prizeIndex === lastLog.prizeIndex
                    ? 'Siguiente ganador'
                    : 'Siguiente premio'}
              </Button>
            </motion.div>
          ) : null}

          {!revealed ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                className={`min-w-56 text-lg uppercase tracking-[0.12em] ${!spinning ? 'pulse-ring' : ''}`}
                onClick={spin}
                disabled={spinning || !prize}
              >
                {spinning ? 'Sorteando…' : prize ? 'Girar' : 'Finalizado'}
              </Button>
              <p className="text-xs text-lilac/70">
                Barra espaciadora para girar · {prize?.winners ?? 0}{' '}
                {(prize?.winners ?? 0) === 1 ? 'ganador' : 'ganadores'} en este premio
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-crimson/40 bg-crimson/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="scroll-thin max-h-[70vh] space-y-3 overflow-y-auto rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Ganadores" value={draw.logs.length} />
            <Stat label="Elegibles" value={pool.length} />
          </div>

          <h2 className="pt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-lilac">
            Historial
          </h2>

          {groupedLogs.length === 0 ? (
            <p className="text-xs text-lilac/60">Todavía no hay ganadores.</p>
          ) : null}

          {groupedLogs.map(([prizeIndex, logs]) => (
            <div key={prizeIndex} className="space-y-1">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-magenta">
                {prizes[prizeIndex]?.name ?? logs[0].prizeName}
              </p>
              {logs.map((log, index) => (
                <div
                  key={`${log.winnerId}-${index}`}
                  className="rounded-xl bg-white/[0.04] px-3 py-2"
                >
                  <span className="block truncate text-sm font-semibold">{log.winnerName}</span>
                </div>
              ))}
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}
