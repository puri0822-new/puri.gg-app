import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, ScrollView, Dimensions,
} from 'react-native';

const CARD_WIDTH = Dimensions.get('window').width - 32 - 24;
import { useRankings } from '../../src/hooks/useRankings';
import { getChampionImageUrl } from '../../src/utils/championData';
import { calcMatchCp, type CpMultipliers, type CpSettings } from '../../src/utils/cp';
import { getTierImage } from '../../src/utils/tierImages';
import { getThresholdByElo } from '../../src/utils/elo';
import type { EloEntry, TierThreshold } from '../../src/utils/elo';
import type { Match, Position } from '../../src/types/match';

const C = {
  background: '#0a0e1a',
  gold:       '#c8aa6e',
  border:     '#1e2740',
  muted:      '#5c6478',
  card:       '#0f1320',
  text:       '#a0a8b8',
  win:        '#5bc470',
  lose:       '#d55b5b',
};

type PositionFilter = '전체' | Position;

interface ChampStat {
  champion: string;
  picks: number;
  wins: number;
  totalK: number;
  totalD: number;
  totalA: number;
}


function kda(stat: ChampStat): number {
  if (stat.totalD === 0) return stat.totalK + stat.totalA;
  return (stat.totalK + stat.totalA) / stat.totalD;
}

function winRate(stat: ChampStat): number {
  return stat.picks > 0 ? Math.round((stat.wins / stat.picks) * 100) : 0;
}

function calcChampStats(matches: Match[], posFilter: PositionFilter = '전체'): ChampStat[] {
  const map = new Map<string, ChampStat>();

  for (const m of matches) {
    for (const side of ['blueTeam', 'redTeam'] as const) {
      const won = m.winner === (side === 'blueTeam' ? 'blue' : 'red');
      for (const p of m[side]) {
        const champ = p.champion.trim();
        if (!champ) continue;
        if (posFilter !== '전체' && p.position !== posFilter) continue;
        const prev = map.get(champ) ?? { champion: champ, picks: 0, wins: 0, totalK: 0, totalD: 0, totalA: 0 };
        map.set(champ, {
          ...prev,
          picks:  prev.picks + 1,
          wins:   prev.wins + (won ? 1 : 0),
          totalK: prev.totalK + (parseInt(p.kills) || 0),
          totalD: prev.totalD + (parseInt(p.deaths) || 0),
          totalA: prev.totalA + (parseInt(p.assists) || 0),
        });
      }
    }
  }

  return [...map.values()];
}


function SortTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[st.tab, active && st.tabActive]}
      onPress={onPress}
    >
      <Text style={[st.tabText, active && st.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  tab:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  tabActive:     { backgroundColor: C.gold, borderColor: C.gold },
  tabText:       { fontSize: 12, color: C.muted, fontWeight: '600' },
  tabTextActive: { color: '#0a0e1a' },
});

function TopPicksAndBans({ matches }: { matches: Match[] }) {
  const [tab, setTab] = useState<'pick' | 'ban'>('pick');

  const topPicks = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of matches)
      for (const p of [...m.blueTeam, ...m.redTeam]) {
        const c = p.champion.trim();
        if (c) map.set(c, (map.get(c) ?? 0) + 1);
      }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [matches]);

  const topBans = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of matches) {
      if (!m.bans) continue;
      for (const c of [...m.bans.blue, ...m.bans.red]) {
        const t = c.trim();
        if (t) map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [matches]);

  const list = tab === 'pick' ? topPicks : topBans;
  const RANK_COLORS = ['#c8aa6e', '#a0a8b8', '#cd7f32'];

  return (
    <View style={tb.box}>
      {/* 탭 버튼 */}
      <View style={tb.tabs}>
        <TouchableOpacity style={[tb.tab, tab === 'pick' && tb.tabActive]} onPress={() => setTab('pick')}>
          <Text style={[tb.tabText, tab === 'pick' && tb.tabTextActive]}>MOST PICK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[tb.tab, tab === 'ban' && tb.tabActive]} onPress={() => setTab('ban')}>
          <Text style={[tb.tabText, tab === 'ban' && tb.tabTextActive]}>MOST BAN</Text>
        </TouchableOpacity>
      </View>

      {/* 리스트 */}
      {list.length === 0 ? (
        <Text style={tb.empty}>데이터 없음</Text>
      ) : (
        list.map(([champ, count], i) => (
          <View key={champ} style={tb.item}>
            <Text style={[tb.rankNum, { color: RANK_COLORS[i] }]}>{i + 1}</Text>
            <Image
              source={{ uri: getChampionImageUrl(champ) }}
              style={[tb.champImg, tab === 'ban' && tb.banImg]}
            />
            <Text style={tb.champName} numberOfLines={1}>{champ}</Text>
            <Text style={tb.count}>{count}회</Text>
          </View>
        ))
      )}
    </View>
  );
}

const tb = StyleSheet.create({
  box:          { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 20 },
  tabs:         { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab:          { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  tabActive:    { borderColor: C.gold },
  tabText:      { fontSize: 11, fontWeight: '700', color: C.muted },
  tabTextActive:{ color: C.gold },
  item:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rankNum:      { width: 16, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  champImg:     { width: 34, height: 34, borderRadius: 6 },
  banImg:       {},
  champName:    { flex: 1, fontSize: 13, fontWeight: '700', color: C.gold },
  count:        { fontSize: 12, color: C.muted },
  empty:        { fontSize: 12, color: C.muted },
});


function ChampRow({ stat, rank, avgCp }: { stat: ChampStat; rank: number; avgCp: number }) {
  const wr = winRate(stat);
  const kdaVal = kda(stat);

  return (
    <View style={cr.row}>
      <Text style={cr.rank}>{rank}</Text>
      <Image source={{ uri: getChampionImageUrl(stat.champion) }} style={cr.img} />
      <View style={cr.main}>
        <Text style={cr.name} numberOfLines={1}>{stat.champion}</Text>
        <Text style={cr.picks}>{stat.picks}게임</Text>
      </View>
      <Text style={cr.cpVal}>{avgCp.toFixed(2)}</Text>
      <View style={cr.right}>
        <Text style={[cr.wr, { color: wr >= 50 ? C.win : C.lose }]}>{wr}%</Text>
      </View>
      <Text style={cr.kdaVal}>{kdaVal.toFixed(2)}</Text>
    </View>
  );
}

const cr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  rank:   { width: 20, fontSize: 11, color: C.muted, textAlign: 'center' },
  img:    { width: 36, height: 36, borderRadius: 8 },
  main:   { flex: 1 },
  name:   { fontSize: 13, fontWeight: '700', color: C.gold },
  picks:  { fontSize: 10, color: C.muted, marginTop: 2 },
  cpVal:  { width: 48, fontSize: 12, fontWeight: '700', color: C.text, textAlign: 'right' },
  right:  { alignItems: 'flex-end', width: 48 },
  wr:     { fontSize: 14, fontWeight: '800' },
  kdaVal: { width: 40, fontSize: 12, fontWeight: '700', color: C.text, textAlign: 'right' },
});

const POSITIONS: Position[] = ['탑', '정글', '미드', '원딜', '서포터'];
const POSITION_FILTERS: PositionFilter[] = ['전체', ...POSITIONS];

const RANK_COLORS = ['#c8aa6e', '#a0a8b8', '#cd7f32'];
const RANK_LABELS = ['1ST', '2ND', '3RD'];

const POS_COLORS: Record<Position, string> = {
  탑:     '#c8aa6e',
  정글:   '#5bc470',
  미드:   '#4a9eff',
  원딜:   '#ff6b6b',
  서포터: '#c084fc',
};

interface PlayerPosStat {
  nickname:    string;
  games:       number;
  wins:        number;
  cpScores:    number[];
  totalK:      number;
  totalD:      number;
  totalA:      number;
  champCounts: Record<string, number>;
}

function PlayerCard({ stat, rankIdx, pos, rankings, tierThresholds }: {
  stat:           PlayerPosStat;
  rankIdx:        number;
  pos:            Position;
  rankings:       EloEntry[];
  tierThresholds: TierThreshold[];
}) {
  const posColor  = POS_COLORS[pos];
  const eloEntry  = rankings.find(r => r.nickname.toLowerCase() === stat.nickname.toLowerCase());
  const threshold = getThresholdByElo(eloEntry?.elo ?? 1000, tierThresholds);
  const tierImg   = getTierImage(threshold.image);

  const wr     = Math.round((stat.wins / stat.games) * 100);
  const kdaVal = stat.totalD === 0
    ? stat.totalK + stat.totalA
    : (stat.totalK + stat.totalA) / stat.totalD;
  const avgCp  = stat.cpScores.length > 0
    ? stat.cpScores.reduce((a, b) => a + b, 0) / stat.cpScores.length
    : 0;

  const topChamps = Object.entries(stat.champCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([champ]) => champ);

  return (
    <View style={[pt.card, { borderColor: posColor + '50' }]}>
      {/* 상단: 티어·이름 / 순위 */}
      <View style={pt.cardTop}>
        <View style={pt.profileRow}>
          {tierImg
            ? <Image source={tierImg} style={pt.tierImg} />
            : <View style={[pt.tierPlaceholder, { backgroundColor: posColor + '33' }]} />}
          <Text style={pt.playerName} numberOfLines={1}>{stat.nickname}</Text>
        </View>
        <Text style={[pt.rankLabel, { color: RANK_COLORS[rankIdx] }]}>{RANK_LABELS[rankIdx]}</Text>
      </View>

      {/* 챔피언 초상화 3개 */}
      <View style={pt.champsRow}>
        {topChamps.map(champ => (
          <Image key={champ} source={{ uri: getChampionImageUrl(champ) }} style={pt.champImg} />
        ))}
      </View>

      {/* 하단 통계 */}
      <View style={pt.statsRow}>
        <View style={pt.statCell}>
          <Text style={[pt.statVal, { color: wr >= 60 ? C.win : wr <= 49 ? C.lose : C.text }]}>{wr}%</Text>
          <Text style={pt.statLabel}>{stat.games}판</Text>
        </View>
        <View style={pt.statDivider} />
        <View style={pt.statCell}>
          <Text style={pt.statVal}>{kdaVal.toFixed(2)}</Text>
          <Text style={pt.statLabel}>KDA</Text>
        </View>
        <View style={pt.statDivider} />
        <View style={pt.statCell}>
          <Text style={[pt.statVal, avgCp >= 5.5 && { color: C.gold }]}>{avgCp.toFixed(2)}</Text>
          <Text style={pt.statLabel}>CP</Text>
        </View>
      </View>
    </View>
  );
}

function PlayerTab({ matches, rankings, tierThresholds, cpMultipliers, cpSettings }: {
  matches:        Match[];
  rankings:       EloEntry[];
  tierThresholds: TierThreshold[];
  cpMultipliers:  CpMultipliers;
  cpSettings?:    CpSettings;
}) {
  const statsByPos = useMemo(() => {
    const result = new Map<Position, Map<string, PlayerPosStat>>();
    for (const pos of POSITIONS) result.set(pos, new Map());

    for (const match of matches) {
      const cpResults = calcMatchCp(match, cpSettings, cpMultipliers);
      const cpByNick  = new Map(cpResults.map(r => [r.nickname.trim().toLowerCase(), r.cpScore]));

      for (const [side, team] of [
        ['blue', match.blueTeam] as const,
        ['red',  match.redTeam]  as const,
      ]) {
        const won = match.winner === side;
        for (const p of team) {
          const pos = p.position as Position;
          if (!POSITIONS.includes(pos)) continue;
          const nick = p.nickname.trim();
          if (!nick) continue;
          const cp    = cpByNick.get(nick.toLowerCase());
          const champ = p.champion.trim();
          const map   = result.get(pos)!;
          const prev  = map.get(nick) ?? { nickname: nick, games: 0, wins: 0, cpScores: [], totalK: 0, totalD: 0, totalA: 0, champCounts: {} };
          const cpScores = cp !== undefined && cp > 0 ? [...prev.cpScores, cp] : prev.cpScores;
          const champCounts = { ...prev.champCounts, ...(champ ? { [champ]: (prev.champCounts[champ] ?? 0) + 1 } : {}) };
          map.set(nick, {
            ...prev,
            games:      prev.games + 1,
            wins:       prev.wins + (won ? 1 : 0),
            cpScores,
            totalK:     prev.totalK + (parseInt(p.kills) || 0),
            totalD:     prev.totalD + (parseInt(p.deaths) || 0),
            totalA:     prev.totalA + (parseInt(p.assists) || 0),
            champCounts,
          });
        }
      }
    }

    const top3: Record<Position, PlayerPosStat[]> = {} as any;
    for (const pos of POSITIONS) {
      top3[pos] = [...result.get(pos)!.values()]
        .filter(s => s.games >= 3)
        .sort((a, b) => {
          const aAvgCp = a.cpScores.length > 0 ? a.cpScores.reduce((x, y) => x + y, 0) / a.cpScores.length : 0;
          const bAvgCp = b.cpScores.length > 0 ? b.cpScores.reduce((x, y) => x + y, 0) / b.cpScores.length : 0;
          if (bAvgCp !== aAvgCp) return bAvgCp - aAvgCp;
          const aElo = rankings.find(r => r.nickname.toLowerCase() === a.nickname.toLowerCase())?.elo ?? 1000;
          const bElo = rankings.find(r => r.nickname.toLowerCase() === b.nickname.toLowerCase())?.elo ?? 1000;
          return bElo - aElo;
        })
        .slice(0, 3);
    }
    return top3;
  }, [matches, cpMultipliers, cpSettings]);

  return (
    <ScrollView contentContainerStyle={pt.scroll}>
      {POSITIONS.map(pos => (
        <View key={pos} style={pt.section}>
          <Text style={[pt.sectionLabel, { color: POS_COLORS[pos] }]}>{pos.toUpperCase()}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pt.cardRow}>
            {statsByPos[pos].length === 0 ? (
              <View style={[pt.emptyCard, { borderColor: POS_COLORS[pos] + '40' }]}>
                <Text style={pt.emptyText}>데이터 없음 (3판 이상 필요)</Text>
              </View>
            ) : (
              statsByPos[pos].map((s, i) => (
                <PlayerCard
                  key={s.nickname}
                  stat={s}
                  rankIdx={i}
                  pos={pos}
                  rankings={rankings}
                  tierThresholds={tierThresholds}
                />
              ))
            )}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const pt = StyleSheet.create({
  scroll:         { padding: 16, paddingBottom: 40 },
  section:        { marginBottom: 24 },
  sectionLabel:   { fontSize: 12, fontWeight: '900', letterSpacing: 3, marginBottom: 10 },
  cardRow:        { gap: 12 },

  card:           { width: CARD_WIDTH, backgroundColor: C.card, borderWidth: 1, borderRadius: 16, padding: 18 },

  /* 상단 */
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  topLeft:        { gap: 8 },
  posLabel:       { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  profileRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierImg:        { width: 36, height: 36, resizeMode: 'contain' },
  tierPlaceholder:{ width: 36, height: 36, borderRadius: 18 },
  playerName:     { fontSize: 16, fontWeight: '800', color: C.gold },
  rankLabel:      { fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  /* 챔피언 */
  champsRow:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  champImg:       { width: 48, height: 48, borderRadius: 10 },

  /* 통계 */
  statsRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.background, borderRadius: 10, paddingVertical: 12 },
  statCell:       { flex: 1, alignItems: 'center' },
  statVal:        { fontSize: 16, fontWeight: '800', color: C.text },
  statLabel:      { fontSize: 10, color: C.muted, marginTop: 3 },
  statDivider:    { width: 1, height: 28, backgroundColor: C.border },

  emptyCard:      { width: CARD_WIDTH, backgroundColor: C.card, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center', height: 160 },
  emptyText:      { fontSize: 11, color: C.muted },
});

type SortKey = 'picks' | 'avgCp' | 'winRate' | 'kda';

export default function StatsScreen() {
  const { matches, rankings, loading, tierThresholds, cpMultipliers, cpSettings } = useRankings();
  const [mainTab, setMainTab] = useState<'champion' | 'player'>('champion');
  const [posFilter, setPosFilter] = useState<PositionFilter>('전체');
  const [sortKey, setSortKey] = useState<SortKey>('picks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setVisibleCount(10);
  };

  const champStats = useMemo(() => calcChampStats(matches, posFilter), [matches, posFilter]);

  const cpByChamp = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const match of matches) {
      const cpResults = calcMatchCp(match, cpSettings, cpMultipliers);
      const allPlayers = [...match.blueTeam, ...match.redTeam];
      allPlayers.forEach((p, i) => {
        const champ = p.champion.trim();
        if (!champ) return;
        if (posFilter !== '전체' && p.position !== posFilter) return;
        const cp = cpResults[i]?.cpScore ?? 0;
        const prev = map.get(champ) ?? { total: 0, count: 0 };
        map.set(champ, { total: prev.total + cp, count: prev.count + 1 });
      });
    }
    return map;
  }, [matches, posFilter, cpMultipliers, cpSettings]);

  const getAvgCp = (champion: string) => {
    const entry = cpByChamp.get(champion);
    return entry && entry.count > 0 ? entry.total / entry.count : 0;
  };

  const sorted = useMemo(() => {
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...champStats].sort((a, b) => {
      if (sortKey === 'avgCp')   return dir * (getAvgCp(a.champion) - getAvgCp(b.champion));
      if (sortKey === 'winRate') return dir * (winRate(a) - winRate(b));
      if (sortKey === 'kda')     return dir * (kda(a) - kda(b));
      return dir * (a.picks - b.picks);
    });
  }, [champStats, sortKey, sortDir, cpByChamp]);

  const [visibleCount, setVisibleCount] = useState(10);

  type ListItem =
    | { type: 'summary' }
    | { type: 'champHeader' }
    | { type: 'champ'; stat: ChampStat; rank: number }
    | { type: 'loadMore' };

  const listData = useMemo<ListItem[]>(() => {
    const champItems = sorted
      .slice(0, visibleCount)
      .map((stat, i) => ({ type: 'champ' as const, stat, rank: i + 1 }));
    const hasMore = visibleCount < sorted.length;
    return [
      { type: 'summary' },
      { type: 'champHeader' },
      ...champItems,
      ...(hasMore ? [{ type: 'loadMore' as const }] : []),
    ];
  }, [sorted, visibleCount]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={{ color: C.muted }}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* 상단 탭 */}
      <View style={s.mainTabs}>
        <TouchableOpacity
          style={[s.mainTab, mainTab === 'champion' && s.mainTabActive]}
          onPress={() => setMainTab('champion')}
        >
          <Text style={[s.mainTabText, mainTab === 'champion' && s.mainTabTextActive]}>챔피언</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mainTab, mainTab === 'player' && s.mainTabActive]}
          onPress={() => setMainTab('player')}
        >
          <Text style={[s.mainTabText, mainTab === 'player' && s.mainTabTextActive]}>플레이어</Text>
        </TouchableOpacity>
      </View>

      {/* 플레이어 탭 */}
      {mainTab === 'player' && <PlayerTab matches={matches} rankings={rankings} tierThresholds={tierThresholds} cpMultipliers={cpMultipliers} cpSettings={cpSettings} />}

      {/* 챔피언 탭 */}
      {mainTab === 'champion' && <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === 'champ' ? `c-${item.stat.champion}` : `${item.type}-${i}`
        }
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          if (item.type === 'summary') return <TopPicksAndBans matches={matches} />;
          if (item.type === 'champHeader') {
            return (
              <View style={s.champHeader}>
                <Text style={s.champHeaderTitle}>챔피언 통계</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sortTabs} contentContainerStyle={{ gap: 8 }}>
                  {POSITION_FILTERS.map(pos => (
                    <SortTab key={pos} label={pos} active={posFilter === pos} onPress={() => setPosFilter(pos)} />
                  ))}
                </ScrollView>
                {/* 컬럼 레이블 */}
                <View style={s.colLabels}>
                  <View style={{ width: 20 + 36 + 10 + 10 }} />
                  <Text style={[s.colLabel, { flex: 1 }]}>챔피언</Text>
                  <TouchableOpacity style={s.colSortBtn} onPress={() => handleSort('avgCp')}>
                    <Text style={[s.colLabel, sortKey === 'avgCp' && s.colLabelActive]}>평균CP</Text>
                    <Text style={[s.colSortIcon, sortKey === 'avgCp' && s.colLabelActive]}>
                      {sortKey === 'avgCp' ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ' ▼'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.colSortBtn} onPress={() => handleSort('winRate')}>
                    <Text style={[s.colLabel, sortKey === 'winRate' && s.colLabelActive]}>승률</Text>
                    <Text style={[s.colSortIcon, sortKey === 'winRate' && s.colLabelActive]}>
                      {sortKey === 'winRate' ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ' ▼'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.colSortBtn} onPress={() => handleSort('kda')}>
                    <Text style={[s.colLabel, sortKey === 'kda' && s.colLabelActive]}>KDA</Text>
                    <Text style={[s.colSortIcon, sortKey === 'kda' && s.colLabelActive]}>
                      {sortKey === 'kda' ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ' ▼'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          if (item.type === 'champ') return <ChampRow stat={item.stat} rank={item.rank} avgCp={getAvgCp(item.stat.champion)} />;
          if (item.type === 'loadMore') {
            return (
              <TouchableOpacity style={s.loadMore} onPress={() => setVisibleCount(v => v + 10)}>
                <Text style={s.loadMoreText}>더보기 ({sorted.length - visibleCount}개 남음)</Text>
              </TouchableOpacity>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={{ color: C.muted }}>데이터 없음</Text>
          </View>
        }
      />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.background },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  list:            { padding: 16, paddingBottom: 40 },

  champHeader:     { marginBottom: 0 },
  champHeaderTitle:{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  sortTabs:        { flexDirection: 'row', gap: 8, marginBottom: 12 },

  colLabels:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 10 },
  colLabel:        { fontSize: 10, color: C.muted, letterSpacing: 1 },
  colLabelActive:  { color: C.gold },
  colSortBtn:      { flexDirection: 'row', alignItems: 'center', width: 48, justifyContent: 'flex-end' },
  colSortIcon:     { fontSize: 8, color: C.muted },

  champList:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden' },
  loadMore:         { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginTop: 4 },
  loadMoreText:     { fontSize: 13, fontWeight: '700', color: C.gold },

  /* 상단 메인 탭 */
  mainTabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  mainTab:          { flex: 1, alignItems: 'center', paddingVertical: 12 },
  mainTabActive:    { borderBottomWidth: 2, borderBottomColor: C.gold },
  mainTabText:      { fontSize: 14, fontWeight: '600', color: C.muted },
  mainTabTextActive:{ color: C.gold },
});
