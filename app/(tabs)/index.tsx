import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRankings } from '../../src/hooks/useRankings';
import { getThresholdByElo, TIER_COLORS } from '../../src/utils/elo';
import { getChampionImageUrl } from '../../src/utils/championData';
import { getTierImage } from '../../src/utils/tierImages';

const C = {
  background: '#0a0e1a',
  gold:       '#c8aa6e',
  border:     '#1e2740',
  muted:      '#5c6478',
  card:       '#0f1320',
  text:       '#a0a8b8',
  empty:      '#3a4060',
  win:        '#5bc470',
  lose:       '#d55b5b',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { rankings, matches, loading, tierThresholds } = useRankings();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return rankings.filter(e => e.nickname.toLowerCase().includes(q)).slice(0, 8);
  }, [query, rankings]);

  const stats = useMemo(() => {
    const totalGames = matches.length;
    const nickSet = new Set<string>();
    for (const m of matches)
      for (const p of [...m.blueTeam, ...m.redTeam])
        if (p.nickname.trim()) nickSet.add(p.nickname.trim().toLowerCase());
    return { totalGames, totalPlayers: nickSet.size, lastDate: matches[0]?.date ?? '' };
  }, [matches]);

  const topPlayer = rankings[0] ?? null;

  const topChampion = useMemo(() => {
    const map = new Map<string, { count: number; wins: number }>();
    for (const m of matches) {
      for (const side of ['blueTeam', 'redTeam'] as const) {
        const won = m.winner === (side === 'blueTeam' ? 'blue' : 'red');
        for (const p of m[side]) {
          const champ = p.champion.trim();
          if (!champ) continue;
          const prev = map.get(champ) ?? { count: 0, wins: 0 };
          map.set(champ, { count: prev.count + 1, wins: prev.wins + (won ? 1 : 0) });
        }
      }
    }
    if (!map.size) return null;
    const [champion, { count, wins }] = [...map.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    return { champion, picks: count, winRate: Math.round((wins / count) * 100) };
  }, [matches]);

  const handleSelect = (nickname: string) => {
    setQuery('');
    setFocused(false);
    router.push(`/summoner/${encodeURIComponent(nickname)}`);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {/* 브랜딩 */}
      <View style={s.branding}>
        <Text style={s.logo}>puri.gg</Text>
        <Text style={s.subtitle}>League of Legends 내전 전적</Text>
      </View>

      {/* 검색창 */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color={C.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="소환사명을 입력하세요"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          returnKeyType="search"
          onSubmitEditing={() => query.trim() && handleSelect(query.trim())}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* 자동완성 */}
      {focused && suggestions.length > 0 && (
        <View style={s.dropdown}>
          {suggestions.map(item => {
            const threshold = getThresholdByElo(item.elo, tierThresholds);
            const tierColor = TIER_COLORS[threshold.image] ?? C.text;
            return (
              <TouchableOpacity key={item.nickname} style={s.dropdownItem} onPress={() => handleSelect(item.nickname)}>
                <View style={[s.tierDot, { backgroundColor: tierColor }]} />
                <Text style={s.dropdownName}>{item.nickname}</Text>
                <Text style={s.dropdownElo}>{item.elo.toLocaleString()} ELO</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 구분선 */}
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>내전 기록</Text>
        <View style={s.dividerLine} />
      </View>

      {/* 통계 카드 */}
      <View style={s.statRow}>
        {[
          { label: '총 게임',     value: `${stats.totalGames}판`,   empty: stats.totalGames === 0 },
          { label: '참여 소환사', value: `${stats.totalPlayers}명`,  empty: stats.totalPlayers === 0 },
          { label: '전적 갱신',   value: stats.lastDate ? formatDate(stats.lastDate) : '-', empty: !stats.lastDate },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={[s.statValue, { color: stat.empty ? C.empty : C.gold }]} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* 리더보드 1위 */}
      <TouchableOpacity style={s.card} onPress={() => topPlayer && handleSelect(topPlayer.nickname)}>
        <Text style={s.cardTitle}>리더보드 1위</Text>
        {topPlayer ? (() => {
          const threshold = getThresholdByElo(topPlayer.elo, tierThresholds);
          const tierColor = TIER_COLORS[threshold.image] ?? C.text;
          return (
            <View style={s.cardRow}>
              <View style={[s.tierBadge, { backgroundColor: tierColor + '33' }]}>
                {getTierImage(threshold.image)
                  ? <Image source={getTierImage(threshold.image)!} style={s.tierBadgeImg} />
                  : <Text style={{ fontSize: 22 }}>👑</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{topPlayer.nickname}</Text>
                <Text style={s.cardSub}>
                  <Text style={{ color: tierColor }}>{threshold.name}</Text>
                  {'  ·  '}
                  <Text style={{ color: C.text }}>{topPlayer.elo.toLocaleString()} ELO</Text>
                </Text>
              </View>
            </View>
          );
        })() : <Text style={{ color: C.empty }}>데이터 없음</Text>}
      </TouchableOpacity>

      {/* Most Pick */}
      <TouchableOpacity style={s.card} onPress={() => router.push('/(tabs)/stats')}>
        <Text style={s.cardTitle}>Most Pick TOP 1</Text>
        {topChampion ? (
          <View style={s.cardRow}>
            <Image source={{ uri: getChampionImageUrl(topChampion.champion) }} style={s.champImg} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardName}>{topChampion.champion}</Text>
              <Text style={s.cardSub}>{topChampion.picks}판 플레이</Text>
              <Text style={[s.cardSub, { color: topChampion.winRate >= 50 ? C.win : C.lose }]}>
                승률 {topChampion.winRate}%
              </Text>
            </View>
          </View>
        ) : <Text style={{ color: C.empty }}>데이터 없음</Text>}
      </TouchableOpacity>

    </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.background },
  content:      { padding: 20, paddingBottom: 40 },
  center:       { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  branding:     { alignItems: 'center', marginTop: 16, marginBottom: 28 },
  logo:         { fontSize: 48, fontWeight: '800', color: C.gold },
  subtitle:     { fontSize: 11, color: C.muted, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 4 },
  searchInput:  { flex: 1, color: C.gold, fontSize: 15, marginLeft: 8 },
  dropdown:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginBottom: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  tierDot:      { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  dropdownName: { flex: 1, color: C.text, fontSize: 14 },
  dropdownElo:  { color: C.gold, fontSize: 12, fontWeight: '700' },
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:  { color: C.muted, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginHorizontal: 12 },
  statRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:     { flex: 1, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12 },
  statValue:    { fontSize: 20, fontWeight: '700' },
  statLabel:    { fontSize: 11, color: C.muted, marginTop: 2 },
  card:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle:    { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tierBadge:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  tierBadgeImg: { width: 40, height: 40, resizeMode: 'contain' },
  cardName:     { fontSize: 18, fontWeight: '800', color: C.gold },
  cardSub:      { fontSize: 12, color: C.muted, marginTop: 2 },
  champImg:     { width: 48, height: 48, borderRadius: 8 },
});
