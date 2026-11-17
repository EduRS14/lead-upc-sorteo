import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SetupScreen } from './screens/SetupScreen';
import { RosterScreen } from './screens/RosterScreen';
import { DrawScreen } from './screens/DrawScreen';
import { WinnersScreen } from './screens/WinnersScreen';
import { aggregate, drawableParticipants } from './lib/aggregate';
import { fetchRoster } from './lib/data';
import { createDraw, type DrawState } from './lib/draw';
import { ENV_ERROR, SHEET_TOKEN, SHEET_URL, USING_MOCK } from './lib/env';
import { sha256Hex } from './lib/hash';
import { buildMockPayload } from './lib/mock';
import { DEFAULT_SETTINGS, EMPTY_SESSION, type FrozenRoster, type Session, type Settings } from './lib/session';
import { usePersistentState } from './lib/usePersistentState';

export default function App() {
  const [settings, setSettings] = usePersistentState<Settings>('rifa.settings.v1', DEFAULT_SETTINGS);
  const [session, setSession] = usePersistentState<Session>('rifa.session.v1', EMPTY_SESSION);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [mock, setMock] = useState(USING_MOCK);
  const [starting, setStarting] = useState(false);
  const loadedOnce = useRef(false);

  const roster = useMemo(
    () => (session.payload ? aggregate(session.payload.rows) : null),
    [session.payload],
  );

  const updateSettings = (patch: Partial<Settings>) =>
    setSettings((previous) => ({ ...previous, ...patch }));

  // Limpia restos de la versión anterior (URL y token ya no se guardan).
  const cleanedLegacy = useRef(false);
  useEffect(() => {
    if (cleanedLegacy.current) return;
    cleanedLegacy.current = true;
    setSettings((previous) => {
      const legacy = previous as Settings & { apiUrl?: string; token?: string };
      if (!('apiUrl' in legacy) && !('token' in legacy)) return previous;
      const next = { ...legacy };
      delete next.apiUrl;
      delete next.token;
      return next;
    });
  }, [setSettings]);

  /** Carga la hoja configurada por entorno (o el mock en desarrollo). */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setDataReady(false);

    try {
      if (USING_MOCK) {
        setSession((previous) => ({ ...previous, payload: buildMockPayload() }));
        setMock(true);
        setDataReady(true);
        return;
      }

      if (ENV_ERROR) throw new Error(ENV_ERROR);

      const payload = await fetchRoster({ url: SHEET_URL, token: SHEET_TOKEN });
      setSession((previous) => ({ ...previous, payload }));
      setMock(false);
      setDataReady(true);
    } catch (caught) {
      setSession((previous) => ({ ...previous, payload: null }));
      setLoadError(
        caught instanceof Error ? caught.message : 'No se pudieron cargar los datos de la hoja',
      );
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    void load();
  }, [load]);

  const goToRoster = () => setSession((previous) => ({ ...previous, stage: 'roster' }));

  /** Congela la nómina y arranca el sorteo (desde premios o desde la revisión). */
  const startDraw = async () => {
    if (!roster || starting) return;
    setStarting(true);
    try {
      const participants = drawableParticipants(roster, {
        excludeWithoutConsent: settings.excludeNoConsent,
      }).sort((a, b) => a.id.localeCompare(b.id));

      const canonical = participants.map((p) => ({ id: p.id, name: p.name, tickets: p.tickets }));
      const hash = await sha256Hex(JSON.stringify(canonical));

      const frozen: FrozenRoster = {
        participants,
        hash,
        frozenAt: new Date().toISOString(),
        source: mock ? 'Datos de prueba' : (session.payload?.sheet ?? 'Hoja de cálculo'),
        stats: roster.stats,
        totalTickets: participants.reduce((sum, p) => sum + p.tickets, 0),
      };

      setSession((previous) => ({
        ...previous,
        stage: 'draw',
        frozen,
        draw: createDraw(participants),
        prizes: settings.prizes,
        policy: settings.repeatPolicy,
      }));
    } finally {
      setStarting(false);
    }
  };

  const updateDraw = (draw: DrawState) => setSession((previous) => ({ ...previous, draw }));

  const finish = () => setSession((previous) => ({ ...previous, stage: 'winners' }));

  const home = () => {
    if (
      session.draw &&
      session.draw.logs.length > 0 &&
      !window.confirm(
        '¿Salir del sorteo en curso? Se descartará el progreso de esta sesión. Exporta los ganadores antes si ya terminaste.',
      )
    ) {
      return;
    }
    setSession((previous) => ({ ...EMPTY_SESSION, payload: previous.payload }));
  };

  const reset = () => {
    if (!window.confirm('¿Empezar un sorteo nuevo? Se borrarán los ganadores de esta sesión.')) return;
    setSession((previous) => ({ ...EMPTY_SESSION, payload: previous.payload }));
  };

  if (session.stage === 'draw' && session.frozen && session.draw && session.prizes.length > 0) {
    return (
      <DrawScreen
        prizes={session.prizes}
        policy={session.policy}
        frozen={session.frozen}
        draw={session.draw}
        onChange={updateDraw}
        onFinish={finish}
        onHome={home}
      />
    );
  }

  if (session.stage === 'winners' && session.frozen && session.draw && session.prizes.length > 0) {
    return (
      <WinnersScreen
        prizes={session.prizes}
        frozen={session.frozen}
        draw={session.draw}
        onReset={reset}
        onHome={home}
      />
    );
  }

  if (session.stage === 'roster' && roster) {
    return (
      <RosterScreen
        roster={roster}
        settings={settings}
        onFreeze={startDraw}
        onBack={() => setSession((previous) => ({ ...previous, stage: 'setup' }))}
        freezing={starting}
      />
    );
  }

  return (
    <SetupScreen
      settings={settings}
      onChange={updateSettings}
      roster={roster}
      onStart={startDraw}
      onRoster={goToRoster}
      onRetry={load}
      starting={starting}
      loading={loading}
      dataReady={dataReady}
      error={loadError}
      mock={mock}
    />
  );
}
