import type { Match, PlayerEntry, Position } from '../types/match';

const DEFAULT_DURATION_SECONDS = 1800;

export interface PositionFormula {
  vspmRef: number;
  dpmRef:  number;
  dtpmRef: number;
  ccpmRef: number;
  kpW:     number;
  dpgRef:  number;
  piwaRef: number;
}

export const POSITION_FORMULAS: Record<Position, PositionFormula> = {
  탑:     { vspmRef: 1.190, dpmRef: 580.000, dtpmRef:  850.000, ccpmRef: 2.800, kpW: 2.00,       dpgRef: 11.340, piwaRef: 2.000 },
  정글:   { vspmRef: 1.181, dpmRef: 653.333, dtpmRef: 1173.333, ccpmRef: 4.800, kpW: 2.00,       dpgRef: 10.500, piwaRef: 4.000 },
  미드:   { vspmRef: 1.050, dpmRef: 576.000, dtpmRef:  733.333, ccpmRef: 4.800, kpW: 4.00,       dpgRef: 13.860, piwaRef: 3.000 },
  원딜:   { vspmRef: 1.108, dpmRef: 648.000, dtpmRef:  900.000, ccpmRef: 2.400, kpW: 1.33333333, dpgRef: 15.540, piwaRef: 1.000 },
  서포터: { vspmRef: 1.820, dpmRef: 700.000, dtpmRef:  800.000, ccpmRef: 6.667, kpW: 2.00,       dpgRef:  8.820, piwaRef: 7.000 },
};

export type MetricKey = 'vspm' | 'dpm' | 'dtpm' | 'ccpm' | 'kp' | 'dpg' | 'piwa';
export type CpMultiplierMap = Record<MetricKey, number>;
export type CpMultipliers   = Record<Position, CpMultiplierMap>;
export type WeightMap       = Record<MetricKey, number>;
export type CpSettings      = Record<Position, WeightMap>;

const _one = (): CpMultiplierMap =>
  ({ dpm: 1, vspm: 1, ccpm: 1, dtpm: 1, kp: 1, piwa: 1, dpg: 1 });

export const DEFAULT_CP_MULTIPLIERS: CpMultipliers = {
  탑:     _one(),
  정글:   _one(),
  미드:   _one(),
  원딜:   _one(),
  서포터: _one(),
};

export interface PlayerCpResult {
  nickname: string;
  position: Position | '';
  cpScore:  number;
}

function calcRawMetrics(p: PlayerEntry, minutes: number, teamKills: number) {
  const k  = Number(p.kills)          || 0;
  const a  = Number(p.assists)        || 0;
  const vs = Number(p.visionScore)    || 0;
  const dd = Number(p.damageDealt)    || 0;
  const rd = Number(p.receivedDamage) || 0;
  const g  = Number(p.gold)           || 0;
  const cc = Number(p.cc)             || 0;
  const pw = Number(p.pinkWardCount)  || 0;

  return {
    vspm: vs / minutes,
    dpm:  dd / minutes,
    dtpm: rd / minutes,
    ccpm: cc / minutes,
    kp:   (k + a) / Math.max(teamKills, 1),
    dpg:  dd / Math.max(g, 1),
    piwa: (pw / minutes) * 10,
  };
}

function applyFormula(
  raw: ReturnType<typeof calcRawMetrics>,
  formula: PositionFormula,
  mult: CpMultiplierMap,
): number {
  return (
    (raw.vspm / formula.vspmRef) * mult.vspm +
    (raw.dpm  / formula.dpmRef)  * mult.dpm  +
    (raw.dtpm / formula.dtpmRef) * mult.dtpm +
    (raw.ccpm / formula.ccpmRef) * mult.ccpm +
    (raw.kp   * formula.kpW)     * mult.kp   +
    (raw.dpg  / formula.dpgRef)  * mult.dpg  +
    (raw.piwa / formula.piwaRef) * mult.piwa
  );
}

const FALLBACK_POS: Position[] = ['탑', '정글', '미드', '원딜', '서포터'];

function settingsToFormula(w: WeightMap): PositionFormula {
  return {
    vspmRef: w.vspm,
    dpmRef:  w.dpm,
    dtpmRef: w.dtpm,
    ccpmRef: w.ccpm,
    kpW:     w.kp,
    dpgRef:  w.dpg,
    piwaRef: w.piwa,
  };
}

export function calcPlayerCpForPosition(
  p: PlayerEntry,
  pos: Position,
  minutes: number,
  teamKills: number,
  multipliers: CpMultipliers = DEFAULT_CP_MULTIPLIERS,
): number {
  const formula = POSITION_FORMULAS[pos];
  const raw     = calcRawMetrics(p, minutes, teamKills);
  return Math.round(applyFormula(raw, formula, multipliers[pos]) * 100) / 100;
}

export function calcMatchCp(
  match: Match,
  settings?: CpSettings,
  multipliers: CpMultipliers = DEFAULT_CP_MULTIPLIERS,
): PlayerCpResult[] {
  const minutes    = (match.gameDurationSeconds ?? DEFAULT_DURATION_SECONDS) / 60;
  const allPlayers = [...match.blueTeam, ...match.redTeam];
  const blueKills  = match.blueTeam.reduce((s, p) => s + (Number(p.kills) || 0), 0);
  const redKills   = match.redTeam.reduce((s, p) => s + (Number(p.kills) || 0), 0);

  return allPlayers.map((p, i) => {
    const pos: Position = (p.position as Position) || FALLBACK_POS[i % 5];
    const formula = settings ? settingsToFormula(settings[pos]) : POSITION_FORMULAS[pos];
    const teamKills = i < 5 ? blueKills : redKills;
    const raw = calcRawMetrics(p, minutes, teamKills);
    const total = applyFormula(raw, formula, multipliers[pos]);
    return {
      nickname: p.nickname,
      position: p.position,
      cpScore:  Math.round(total * 100) / 100,
    };
  });
}
