export interface Prize {
  id: string;
  name: string;
  winners: number;
  note?: string;
}

export type RepeatPolicy = 'never' | 'always' | 'after-all';

export type PresetId = 1 | 2 | 3;

interface Preset {
  id: PresetId;
  label: string;
  hint: string;
  prizes: Prize[];
}

function prize(id: string, name: string, note?: string): Prize {
  return { id, name, winners: 1, note };
}

const base: Prize[] = [
  prize('paneton', 'Panetón 900 g'),
  prize('roblox', 'Gift card Roblox'),
  prize('cine', 'Combo de cine'),
  prize('tripode', 'Trípode'),
  prize('parlante', 'Parlante JVC'),
  prize('smartwatch', 'Smartwatch', 'Donado'),
];

export const PRESETS: Record<PresetId, Preset> = {
  1: {
    id: 1,
    label: 'Escenario 1',
    hint: '6 premios · hasta S/ 200',
    prizes: base.map((p) => ({ ...p })),
  },
  2: {
    id: 2,
    label: 'Escenario 2',
    hint: '9 premios · hasta S/ 300',
    prizes: [
      base[0],
      base[1],
      base[2],
      base[3],
      prize('tripode-2', 'Segundo trípode'),
      prize('starbucks', 'Gift card Starbucks'),
      prize('aruma-pack', 'Pack Aruma Secret Santa'),
      base[4],
      base[5],
    ].map((p) => ({ ...p })),
  },
  3: {
    id: 3,
    label: 'Escenario 3',
    hint: '10 premios · hasta S/ 380',
    prizes: [
      base[0],
      base[1],
      base[2],
      base[3],
      prize('starbucks', 'Gift card Starbucks'),
      prize('aruma-pack', 'Pack Aruma'),
      prize('aruma-gift', 'Gift card Aruma'),
      prize('san-antonio', 'Gift card San Antonio'),
      base[4],
      base[5],
    ].map((p) => ({ ...p })),
  },
};

export function presetPrizes(id: PresetId): Prize[] {
  return PRESETS[id].prizes.map((p, index) => ({ ...p, id: `${p.id}-${index}` }));
}

export const REPEAT_POLICIES: { value: RepeatPolicy; label: string; hint: string }[] = [
  {
    value: 'never',
    label: 'Nadie gana dos veces',
    hint: 'Al ganar, la persona sale del sorteo. Recomendado con varios premios.',
  },
  {
    value: 'always',
    label: 'Puede ganar varias veces',
    hint: 'Conserva sus tickets restantes y puede volver a salir.',
  },
  {
    value: 'after-all',
    label: 'Solo si ya ganaron todos',
    hint: 'Se permite repetir únicamente cuando todos hayan ganado algo.',
  },
];
