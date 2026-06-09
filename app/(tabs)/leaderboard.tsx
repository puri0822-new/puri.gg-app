import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRankings } from '../../src/hooks/useRankings';
import {
  getThresholdByElo, TIER_COLORS,
  type EloEntry,
} from '../../src/utils/elo';
import { getTierImage } from '../../src/utils/tierImages';

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

const RANK_ICONS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
const PODIUM_BG: Record<number, string> = {
  1: '#c8aa6e22',
  2: '#a0a8b822',
  3: '#cd7f3222',
};
const PODIUM_BORDER: Record<number, string> = {
  1: '#c8aa6e',
  2: '#a0a8b8',
  3: '#cd7f32',
};

function winRate(entry: EloEntry) {
  return entry.games > 0 ? Math.round((entry.wins / entry.games) * 100) : 0;
}

function ChangeLabel({ value }: { value: number }) {
  if (value === 0) return <Text style={s.changeMuted}>—</Text>;
  return (
    <Text style={[s.change, { color: value > 0 ? C.win : C.lose }]}>
      {value > 0 ? '+' : ''}{value}
    </Text>
  );
}

function PodiumCard({ entry, rank, tierThresholds }: { entry: EloEntry; rank: number; tierThresholds: any[] }) {
  const router = useRouter();
  const threshold = getThresholdByElo(entry.elo, tierThresholds);
  const tierColor = TIER_COLORS[threshold.image] ?? C.text;
  const wr = winRate(entry);

  return (
    <TouchableOpacity
      style={[s.podiumCard, { backgroundColor: PODIUM_BG[rank], borderColor: PODIUM_BORDER[rank] }]}
      onPress={() => router.push(`/summoner/${encodeURIComponent(entry.nickname)}`)}
    >
      <Text style={[s.podiumRank, { color: PODIUM_BORDER[rank] }]}>{RANK_ICONS[rank]}</Text>
      <View style={[s.tierBadge, { backgroundColor: tierColor + '33' }]}>
        {getTierImage(threshold.image)
          ? <Image source={getTierImage(threshold.image)!} style={s.tierImg} />
          : <Text style={[s.tierBadgeText, { color: tierColor }]}>{threshold.name[0]}</Text>}
      </View>
      <Text style={s.podiumName} numberOfLines={1}>{entry.nickname}</Text>
      <Text style={[s.podiumElo, { color: tierColor }]}>{entry.elo.toLocaleString()}</Text>
      <Text style={s.podiumSub}>{wr}%  {entry.wins}W {entry.losses}L</Text>
      <ChangeLabel value={entry.change} />
    </TouchableOpacity>
  );
}

function RankRow({ entry, rank, tierThresholds }: { entry: EloEntry; rank: number; tierThresholds: any[] }) {
  const router = useRouter();
  const threshold = getThresholdByElo(entry.elo, tierThresholds);
  const tierColor = TIER_COLORS[threshold.image] ?? C.text;
  const wr = winRate(entry);

  return (
    <TouchableOpacity
      style={s.row}
      onPress={() => router.push(`/summoner/${encodeURIComponent(entry.nickname)}`)}
    >
      <Text style={s.rowRank}>{rank}</Text>
      <View style={[s.rowDot, { backgroundColor: tierColor }]} />
      <View style={s.rowMain}>
        <Text style={s.rowName} numberOfLines={1}>{entry.nickname}</Text>
        <Text style={s.rowTier}>{threshold.name}</Text>
      </View>
      <View style={s.rowRight}>
        <Text style={[s.rowElo, { color: tierColor }]}>{entry.elo.toLocaleString()}</Text>
        <Text style={s.rowRecord}>{wr}%  {entry.wins}W {entry.losses}L</Text>
      </View>
      <View style={s.rowChange}>
        <ChangeLabel value={entry.change} />
      </View>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen() {
  const { rankings, loading, tierThresholds } = useRankings();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rankings;
    return rankings.filter(e => e.nickname.toLowerCase().includes(q));
  }, [rankings, query]);

  const top3 = query ? [] : filtered.slice(0, 3);
  const rest = query ? filtered : filtered.slice(3);

  return (
    <SafeAreaView style={s.container}>
      {/* 검색바 */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color={C.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="소환사명 검색"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <Text style={{ color: C.muted }}>불러오는 중...</Text>
        </View>
      ) : rankings.length === 0 ? (
        <View style={s.center}>
          <Text style={{ color: C.muted }}>데이터 없음</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={item => item.nickname}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <>
              {/* 상위 3인 포디움 */}
              {top3.length > 0 && (
                <View style={s.podiumRow}>
                  {top3.map((entry, i) => (
                    <PodiumCard key={entry.nickname} entry={entry} rank={i + 1} tierThresholds={tierThresholds} />
                  ))}
                </View>
              )}

              {/* 컬럼 헤더 */}
              {rest.length > 0 && (
                <View style={s.headerRow}>
                  <Text style={[s.headerCell, { width: 36 }]}>#</Text>
                  <Text style={[s.headerCell, { flex: 1 }]}>소환사</Text>
                  <Text style={[s.headerCell, { width: 90, textAlign: 'right' }]}>ELO</Text>
                  <Text style={[s.headerCell, { width: 52, textAlign: 'right' }]}>변동</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <RankRow entry={item} rank={(query ? index : index + 3) + 1} tierThresholds={tierThresholds} />
          )}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ color: C.muted }}>검색 결과 없음</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  list:          { padding: 16, paddingBottom: 40 },

  searchBox:     { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 44 },
  searchInput:   { flex: 1, color: C.gold, fontSize: 14, marginLeft: 8 },

  /* 포디움 */
  podiumRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  podiumCard:    { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 6, gap: 4 },
  podiumRank:    { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tierBadge:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tierBadgeText: { fontSize: 14, fontWeight: '800' },
  tierImg:       { width: 32, height: 32, resizeMode: 'contain' },
  podiumName:    { fontSize: 13, fontWeight: '700', color: C.gold, textAlign: 'center' },
  podiumElo:     { fontSize: 16, fontWeight: '800' },
  podiumSub:     { fontSize: 10, color: C.muted },

  /* 변동 라벨 */
  change:        { fontSize: 12, fontWeight: '700' },
  changeMuted:   { fontSize: 12, color: C.muted },

  /* 컬럼 헤더 */
  headerRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 6, marginBottom: 2 },
  headerCell:    { fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' },

  /* 랭킹 행 */
  row:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 6, gap: 10 },
  rowRank:       { width: 24, fontSize: 12, fontWeight: '700', color: C.muted, textAlign: 'center' },
  rowDot:        { width: 8, height: 8, borderRadius: 4 },
  rowMain:       { flex: 1 },
  rowName:       { fontSize: 14, fontWeight: '700', color: C.gold },
  rowTier:       { fontSize: 11, color: C.muted, marginTop: 2 },
  rowRight:      { alignItems: 'flex-end', width: 90 },
  rowElo:        { fontSize: 14, fontWeight: '800' },
  rowRecord:     { fontSize: 10, color: C.muted, marginTop: 2 },
  rowChange:     { width: 40, alignItems: 'flex-end' },
});
