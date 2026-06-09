import type { Match } from '../types/match';
import { calcMatchCp, DEFAULT_CP_MULTIPLIERS, type CpMultipliers, type CpSettings } from './cp';

export const INITIAL_ELO = 1000;
export const K_FACTOR = 32;

export interface TierThreshold {
  name:  string;
  image: string;
  min:   number;
}

export const DEFAULT_TIER_THRESHOLDS: TierThreshold[] = [
  { name: '아이언',       image: 'iron',        min: 0    },
  { name: '브론즈',       image: 'bronze',      min: 950  },
  { name: '실버',         image: 'silver',      min: 980  },
  { name: '골드',         image: 'gold',        min: 1051 },
  { name: '플래티넘',     image: 'platinum',    min: 1101 },
  { name: '다이아',       image: 'diamond',     min: 1151 },
  { name: '마스터',       image: 'master',      min: 1200 },
  { name: '그랜드마스터', image: 'grandmaster', min: 1251 },
  { name: '챌린저',       image: 'challenger',  min: 1301 },
];

export const TIER_COLORS: Record<string, string> = {
  iron:        '#8a8a8a',
  bronze:      '#cd7f32',
  silver:      '#a0a8b8',
  gold:        '#fbbf24',
  platinum:    '#6ee7b7',
  diamond:     '#7dd3fc',
  master:      '#c084fc',
  grandmaster: '#f87171',
  challenger:  '#e8d5a3',
};

export interface BonusSettings {
  winBonus: number;
  aceBonus: number;
  aceMinCp: number;
}

export const DEFAULT_BONUS: BonusSettings = {
  winBonus: 5,
  aceBonus: 3,
  aceMinCp: 5.0,
};

export interface EloHistoryEntry {
  matchId:    string;
  date:       string;
  won:        boolean;
  delta:      number;
  bonus:      number;
  isAce:      boolean;
  eloBefore:  number;
  eloAfter:   number;
}

export interface EloEntry {
  nickname: string;
  elo:      number;
  change:   number;
  games:    number;
  wins:     number;
  losses:   number;
  history:  EloHistoryEntry[];
}

export function getThresholdByElo(elo: number, thresholds = DEFAULT_TIER_THRESHOLDS): TierThreshold {
  const sorted = [...thresholds].sort((a, b) => b.min - a.min);
  return sorted.find(t => elo >= t.min) ?? sorted[sorted.length - 1];
}

export function expectedWinRate(myAvg: number, oppAvg: number): number {
  return 1 / (1 + Math.pow(10, (oppAvg - myAvg) / 400));
}

export function calcDelta(playerElo: number, oppAvgElo: number, won: boolean, k = K_FACTOR): number {
  const E = expectedWinRate(playerElo, oppAvgElo);
  return Math.round(k * ((won ? 1 : 0) - E));
}

export function calcEloRankings(
  matches: Match[],
  kFactor = K_FACTOR,
  bonus: BonusSettings = DEFAULT_BONUS,
  cpMultipliers: CpMultipliers = DEFAULT_CP_MULTIPLIERS,
  cpSettings?: CpSettings,
): EloEntry[] {
  const sorted = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const eloMap     = new Map<string, number>();
  const changeMap  = new Map<string, number>();
  const statsMap   = new Map<string, { wins: number; losses: number }>();
  const historyMap = new Map<string, EloHistoryEntry[]>();

  const getElo = (name: string) => eloMap.get(name) ?? INITIAL_ELO;

  const applyTeam = (names: string[], oppAvgElo: number, won: boolean, match: Match) => {
    for (const name of names) {
      const before = getElo(name);
      const delta  = calcDelta(before, oppAvgElo, won, kFactor);
      const after  = before + delta;

      eloMap.set(name, after);
      changeMap.set(name, delta);

      const s = statsMap.get(name) ?? { wins: 0, losses: 0 };
      statsMap.set(name, {
        wins:   s.wins   + (won ? 1 : 0),
        losses: s.losses + (won ? 0 : 1),
      });

      const h = historyMap.get(name) ?? [];
      h.push({ matchId: match.id, date: match.date, won, delta, bonus: 0, isAce: false, eloBefore: before, eloAfter: after });
      historyMap.set(name, h);
    }
  };

  const applyBonus = (name: string, bonusPt: number, isAce = false) => {
    const cur = eloMap.get(name);
    if (cur === undefined) return;
    eloMap.set(name, cur + bonusPt);
    changeMap.set(name, (changeMap.get(name) ?? 0) + bonusPt);
    const hist = historyMap.get(name);
    if (hist && hist.length > 0) {
      const last    = hist[hist.length - 1];
      last.delta   += bonusPt;
      last.bonus   += bonusPt;
      last.eloAfter = cur + bonusPt;
      if (isAce) last.isAce = true;
    }
  };

  for (const match of sorted) {
    const blueNames = match.blueTeam.map(p => p.nickname.trim()).filter(Boolean);
    const redNames  = match.redTeam.map(p => p.nickname.trim()).filter(Boolean);
    if (!blueNames.length || !redNames.length) continue;

    const blueAvg = blueNames.reduce((s, n) => s + getElo(n), 0) / blueNames.length;
    const redAvg  = redNames.reduce((s, n) => s + getElo(n), 0) / redNames.length;
    const blueWon = match.winner === 'blue';

    applyTeam(blueNames, redAvg,  blueWon,  match);
    applyTeam(redNames,  blueAvg, !blueWon, match);

    // CP 기반 보너스 (웹 버전 동일)
    const cpResults = calcMatchCp(match, cpSettings, cpMultipliers);
    const cpByNick  = new Map(
      cpResults.map(r => [r.nickname.trim().toLowerCase(), r.cpScore]),
    );

    const gamesOf = (name: string) => {
      const s = statsMap.get(name);
      return s ? s.wins + s.losses : 0;
    };

    const byCpThenGames = (
      a: { name: string; cp: number },
      b: { name: string; cp: number },
    ) => b.cp - a.cp || gamesOf(b.name) - gamesOf(a.name);

    const winnerNames = blueWon ? blueNames : redNames;
    const loserNames  = blueWon ? redNames  : blueNames;

    // 승리팀 CP 상위 3명 → winBonus
    const winnersByCp = winnerNames
      .map(n => ({ name: n, cp: cpByNick.get(n.toLowerCase()) ?? 0 }))
      .sort(byCpThenGames);

    for (const { name } of winnersByCp.slice(0, 3)) {
      applyBonus(name, bonus.winBonus);
    }

    // 패배팀 CP 1위(ACE) → aceBonus (CP ≥ aceMinCp 조건)
    const losersByCp = loserNames
      .map(n => ({ name: n, cp: cpByNick.get(n.toLowerCase()) ?? 0 }))
      .sort(byCpThenGames);

    if (losersByCp.length > 0 && losersByCp[0].cp >= bonus.aceMinCp) {
      applyBonus(losersByCp[0].name, bonus.aceBonus, true);
    }
  }

  return [...eloMap.entries()]
    .map(([nickname, elo]) => {
      const s = statsMap.get(nickname) ?? { wins: 0, losses: 0 };
      return {
        nickname,
        elo,
        change:  changeMap.get(nickname) ?? 0,
        games:   s.wins + s.losses,
        wins:    s.wins,
        losses:  s.losses,
        history: (historyMap.get(nickname) ?? []).slice().reverse(),
      };
    })
    .sort((a, b) => b.elo - a.elo);
}
