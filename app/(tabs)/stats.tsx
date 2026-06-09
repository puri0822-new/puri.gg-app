import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, ScrollView,
} from 'react-native';
import { useMatches } from '../../src/hooks/useMatches';
import { getChampionImageUrl } from '../../src/utils/championData';
import { calcMatchCp } from '../../src/utils/cp';
import type { Match, PlayerEntry, Position } from '../../src/types/match';

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

function SummaryRow({ matches }: { matches: Match[] }) {
  const stats = useMemo(() => {
    let totalKills = 0;
    let totalDuration = 0;
    let durationCount = 0;
    const nickSet = new Set<string>();
    const champSet = new Set<string>();

    for (const m of matches) {
      if (m.gameDurationSeconds) {
        totalDuration += m.gameDurationSeconds;
        durationCount++;
      }
      for (const p of [...m.blueTeam, ...m.redTeam]) {
        totalKills += parseInt(p.kills) || 0;
        if (p.nickname.trim()) nickSet.add(p.nickname.trim().toLowerCase());
        if (p.champion.trim()) champSet.add(p.champion.trim());
      }
    }

    const avgDuration = durationCount > 0
      ? Math.round(totalDuration / durationCount / 60)
      : null;

    return {
      totalGames: matches.length,
      totalKills,
      avgKillsPerGame: matches.length > 0 ? Math.round(totalKills / matches.length) : 0,
      avgDuration,
      totalPlayers: nickSet.size,
      uniqueChamps: champSet.size,
    };
  }, [matches]);

  const items = [
    { label: '총 게임',    value: `${stats.totalGames}판` },
    { label: '참여 인원',  value: `${stats.totalPlayers}명` },
    { label: '사용 챔피언', value: `${stats.uniqueChamps}종` },
    { label: '평균 킬',    value: `${stats.avgKillsPerGame}킬` },
    ...(stats.avgDuration != null
      ? [{ label: '평균 게임시간', value: `${stats.avgDuration}분` }]
      : []),
  ];

  return (
    <View style={sr.grid}>
      {items.map(item => (
        <View key={item.label} style={sr.cell}>
          <Text style={sr.value}>{item.value}</Text>
          <Text style={sr.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const sr = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  cell:  { width: '30%', flexGrow: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '800', color: C.gold },
  label: { fontSize: 10, color: C.muted, marginTop: 3 },
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

const POSITION_FILTERS: PositionFilter[] = ['전체', '탑', '정글', '미드', '원딜', '서포터'];

type SortKey = 'picks' | 'avgCp' | 'winRate' | 'kda';

export default function StatsScreen() {
  const { matches, loading } = useMatches();
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
  };

  const champStats = useMemo(() => calcChampStats(matches, posFilter), [matches, posFilter]);

  const cpByChamp = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const match of matches) {
      const cpResults = calcMatchCp(match);
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
  }, [matches, posFilter]);

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

  type ListItem =
    | { type: 'summary' }
    | { type: 'champHeader' }
    | { type: 'champ'; stat: ChampStat; rank: number };

  const listData = useMemo<ListItem[]>(() => [
    { type: 'summary' },
    { type: 'champHeader' },
    ...sorted.map((stat, i) => ({ type: 'champ' as const, stat, rank: i + 1 })),
  ], [sorted]);

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
      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === 'champ' ? `c-${item.stat.champion}` : `${item.type}-${i}`
        }
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          if (item.type === 'summary') return <SummaryRow matches={matches} />;
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
          return null;
        }}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={{ color: C.muted }}>데이터 없음</Text>
          </View>
        }
      />
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

  champList:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: 'hidden' },
});
