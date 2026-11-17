import { motion } from 'framer-motion';

interface ReelProps {
  items: string[];
  targetIndex: number;
  spinId: number;
  spinning: boolean;
  onDone: () => void;
}

const ITEM_HEIGHT = 76;
const VISIBLE = 5;

export function Reel({ items, targetIndex, spinId, spinning, onDone }: ReelProps) {
  const center = Math.floor(VISIBLE / 2);
  const idle = items.length === 0;
  const list: string[] = idle ? Array.from({ length: VISIBLE }, () => '') : items;
  const offset = !idle && targetIndex >= 0 ? -(targetIndex - center) * ITEM_HEIGHT : 0;

  return (
    <div
      className="reel-shell relative select-none overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] ring-glow"
      style={{ height: ITEM_HEIGHT * VISIBLE }}
    >
      <div className="reel-mask h-full overflow-hidden">
        <motion.div
          key={spinId}
          initial={{ y: 0 }}
          animate={{ y: offset }}
          transition={{
            duration: spinning ? 5.2 : 0,
            ease: [0.12, 0.72, 0.05, 1],
          }}
          onAnimationComplete={() => {
            if (spinning) onDone();
          }}
        >
          {list.map((name, index) => (
            <div
              key={`${index}-${name}`}
              className="relative flex items-center justify-center px-6"
              style={{ height: ITEM_HEIGHT }}
            >
              {name ? (
                <span className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                  {name}
                </span>
              ) : null}
            </div>
          ))}
        </motion.div>
      </div>

      {idle ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-lilac">
            Esperando sorteo
          </p>
          <p className="text-xs text-lilac/60">Presiona «Girar» para empezar</p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-3 top-1/2 h-[76px] -translate-y-1/2 rounded-2xl border-y border-magenta/50 bg-magenta/[0.07]" />
      <div className="pointer-events-none absolute inset-y-6 left-0 w-[2px] rounded-full bg-gradient-to-b from-transparent via-magenta/60 to-transparent" />
      <div className="pointer-events-none absolute inset-y-6 right-0 w-[2px] rounded-full bg-gradient-to-b from-transparent via-magenta/60 to-transparent" />
    </div>
  );
}
