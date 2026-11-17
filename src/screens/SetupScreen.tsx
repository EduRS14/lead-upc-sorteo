import { Button, Card, Logo, Pill, SectionTitle } from '../components/ui';
import { PRESETS, presetPrizes, REPEAT_POLICIES } from '../lib/prizes';
import type { Settings } from '../lib/session';
import type { Roster } from '../lib/types';

interface SetupScreenProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  roster: Roster | null;
  onStart: () => void;
  onRoster: () => void;
  onRetry: () => void;
  starting: boolean;
  loading: boolean;
  dataReady: boolean;
  error: string | null;
  mock: boolean;
}

export function SetupScreen({
  settings,
  onChange,
  roster,
  onStart,
  onRoster,
  onRetry,
  starting,
  loading,
  dataReady,
  error,
  mock,
}: SetupScreenProps) {
  const updatePrize = (index: number, patch: Partial<{ name: string; winners: number }>) => {
    onChange({
      prizes: settings.prizes.map((prize, i) => (i === index ? { ...prize, ...patch } : prize)),
    });
  };

  const people = roster?.stats.people ?? 0;
  const tickets = roster?.stats.tickets ?? 0;
  const noResponses = roster !== null && roster.stats.rows === 0;
  const noNames = roster !== null && roster.stats.rows > 0 && roster.stats.people === 0;

  const canStart = dataReady && !loading && !error && people > 0;

  const statusTitle = loading
    ? 'Cargando participantes…'
    : error
      ? 'No se pudieron cargar los datos'
      : noResponses
        ? 'La hoja todavía no tiene respuestas'
        : noNames
          ? 'Revisa las columnas del script'
          : 'Todo listo para sortear';

  const statusHint = loading
    ? 'Leyendo la hoja configurada.'
    : error
      ? 'Revisa la configuración y vuelve a intentar.'
      : noResponses || noNames
        ? 'Corrige el origen de datos y pulsa «Actualizar».'
        : 'Al iniciar se congela la nómina y se entra directo al sorteo.';

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <header className="mx-auto flex max-w-6xl items-center gap-4">
        <Logo size={56} />
        <div className="flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-lilac">
            Familia LEAD UPC
          </p>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Rifa LEAD · Sorteador</h1>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-lilac">
            Sorteo
          </p>
          <p className="text-sm font-bold">22 · 11 · 2026</p>
        </div>
      </header>

      <main className="mx-auto mt-6 flex max-w-6xl flex-col gap-5">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-lilac">
                Resumen de la nómina
              </p>
              <div className="mt-3 flex items-end gap-6">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-lilac/80">
                    Personas
                  </p>
                  <p className="mt-1 text-3xl font-extrabold leading-none">
                    {roster ? people : '—'}
                  </p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-lilac/80">
                    Tickets totales
                  </p>
                  <p className="mt-1 text-3xl font-extrabold leading-none">
                    {roster ? tickets : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
              {loading ? (
                <Pill tone="warn">Cargando…</Pill>
              ) : mock ? (
                <Pill tone="warn">Datos de prueba</Pill>
              ) : dataReady ? (
                <Pill tone="ok">Hoja conectada</Pill>
              ) : (
                <Pill tone="danger">Sin datos</Pill>
              )}
              <Button variant="ghost" size="sm" onClick={onRetry} disabled={loading}>
                {loading ? 'Actualizando…' : 'Actualizar'}
              </Button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {noResponses ? (
            <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              La hoja está conectada, pero todavía no tiene respuestas.
            </div>
          ) : null}

          {noNames ? (
            <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Se recibieron filas, pero ninguna tiene nombre. Revisa que el script devuelva las
              columnas «nombres» y «apellidos».
            </div>
          ) : null}
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <SectionTitle hint="Elige el escenario y ajusta los premios. Se sortean de menor a mayor valor.">
              Premios
            </SectionTitle>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {(Object.keys(PRESETS) as unknown as Array<keyof typeof PRESETS>).map((key) => {
                const preset = PRESETS[key];
                const active = settings.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange({ preset: preset.id, prizes: presetPrizes(preset.id) })}
                    className={`rounded-2xl border px-2 py-3 text-left transition ${
                      active
                        ? 'border-magenta/60 bg-magenta/15'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{preset.label}</span>
                    <span className="mt-1 block text-[0.6rem] leading-tight text-lilac">
                      {preset.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="scroll-thin max-h-80 space-y-2 overflow-y-auto pr-1">
              {settings.prizes.map((prize, index) => (
                <div key={prize.id} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs font-bold text-lilac">{index + 1}</span>
                  <input
                    className="input flex-1 py-2 text-sm"
                    value={prize.name}
                    aria-label={`Nombre del premio ${index + 1}`}
                    onChange={(event) => updatePrize(index, { name: event.target.value })}
                  />
                  <input
                    className="input w-16 py-2 text-center text-sm"
                    type="number"
                    min={1}
                    max={20}
                    value={prize.winners}
                    aria-label={`Ganadores del premio ${index + 1}`}
                    onChange={(event) =>
                      updatePrize(index, { winners: Math.max(1, Number(event.target.value) || 1) })
                    }
                  />
                  <button
                    type="button"
                    className="px-1 text-lilac transition hover:text-white"
                    onClick={() =>
                      onChange({ prizes: settings.prizes.filter((_, i) => i !== index) })
                    }
                    aria-label="Quitar premio"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={() =>
                onChange({
                  prizes: [
                    ...settings.prizes,
                    { id: `custom-${Date.now()}`, name: 'Nuevo premio', winners: 1 },
                  ],
                })
              }
            >
              + Agregar premio
            </Button>
          </Card>

          <Card>
            <SectionTitle hint="Define si una misma persona puede ganar más de una vez.">
              Reglas del sorteo
            </SectionTitle>

            <div className="space-y-2">
              {REPEAT_POLICIES.map((policy) => {
                const active = settings.repeatPolicy === policy.value;
                return (
                  <button
                    key={policy.value}
                    type="button"
                    onClick={() => onChange({ repeatPolicy: policy.value })}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-magenta/60 bg-magenta/15'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="block text-sm font-bold">{policy.label}</span>
                    <span className="mt-0.5 block text-xs text-lilac">{policy.hint}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#BE2074]"
                checked={settings.excludeNoConsent}
                onChange={(event) => onChange({ excludeNoConsent: event.target.checked })}
              />
              <span className="text-sm">
                Excluir a quienes respondieron <strong>No</strong> en la autorización de datos
                <span className="mt-0.5 block text-xs text-lilac">
                  Recomendado: sin consentimiento no deberían participar.
                </span>
              </span>
            </label>
          </Card>
        </div>

        <Card className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-bold">{statusTitle}</p>
            <p className="mt-1 text-xs text-lilac">{statusHint}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={onRoster} disabled={!canStart || starting}>
              Revisar nómina
            </Button>
            <Button
              size="lg"
              className="min-w-60 text-base uppercase tracking-[0.08em]"
              onClick={onStart}
              disabled={!canStart || starting}
            >
              {starting ? 'Iniciando…' : 'Iniciar sorteo'}
            </Button>
          </div>
        </Card>
      </main>

      <footer className="mx-auto mt-8 max-w-6xl pb-6 text-center text-[0.7rem] text-lilac/60">
        LEAD UPC · Learn. Explore. Aspire. Discover.
      </footer>
    </div>
  );
}
