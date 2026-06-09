import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRankings } from '../../src/hooks/useRankings';
import { getTierImage } from '../../src/utils/tierImages';
import {
  getThresholdByElo, TIER_COLORS,
} from '../../src/utils/elo';
import { getChampionImageUrl } from '../../src/utils/championData';
import { calcMatchCp } from '../../src/utils/cp';
import type { Match, PlayerEntry } from '../../src/types/match';

const C = {
  background: '#0a0e1a',
  gold:       '#c8aa6e',
  border:     '#1e2740',
  muted:      '#5c6478',
  card:       '#0f1320',
  text:       '#a0a8b8',
  win:        '#5bc470',
  lose:       '#d55b5b',
  winBg:      '#5bc47018',
  loseBg:     '#d55b5b18',
};

interface PlayerMatch {
  match: Match;
  entry: PlayerEntry;
  won: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getPlayerMatches(matches: Match[], nickname: string): PlayerMatch[] {
  const key = nickname.trim().toLowerCase();
  const result: PlayerMatch[] = [];

  for (const m of matches) {
    for (const side of ['blueTeam', 'redTeam'] as const) {
      const entry = m[side].find(p => p.nickname.trim().toLowerCase() === key);
      if (entry) {
        const won = m.winner === (side === 'blueTeam' ? 'blue' : 'red');
        result.push({ match: m, entry, won });
        break;
      }
    }
  }

  return result;
}

/* ── 티어 배지 ─────────────────────────────── */
function TierBadge({ elo, tierThresholds }: { elo: number; tierThresholds: any[] }) {
  const threshold = getThresholdByElo(elo, tierThresholds);
  const color = TIER_COLORS[threshold.image] ?? C.text;
  return (
    <View style={[tb.badge, { borderColor: color + '66', backgroundColor: color + '22' }]}>
      <Text style={[tb.name, { color }]}>{threshold.name}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  name:  { fontSize: 12, fontWeight: '700' },
});

/* ── 챔피언 풀 카드 ─────────────────────────── */
interface ChampPool {
  champion: string;
  picks: number;
  wins: number;
  totalK: number;
  totalD: number;
  totalA: number;
}

function ChampPoolCard({ pool }: { pool: ChampPool }) {
  const wr = pool.picks > 0 ? Math.round((pool.wins / pool.picks) * 100) : 0;
  const avgK = (pool.totalK / pool.picks).toFixed(1);
  const avgD = (pool.totalD / pool.picks).toFixed(1);
  const avgA = (pool.totalA / pool.picks).toFixed(1);
  const kda = pool.totalD === 0
    ? (pool.totalK + pool.totalA).toFixed(2)
    : ((pool.totalK + pool.totalA) / pool.totalD).toFixed(2);

  return (
    <View style={cp.card}>
      <Image source={{ uri: getChampionImageUrl(pool.champion) }} style={cp.img} />
      <Text style={cp.name} numberOfLines={1}>{pool.champion}</Text>
      <Text style={[cp.wr, { color: wr >= 50 ? C.win : C.lose }]}>{wr}%</Text>
      <Text style={cp.kda}>{avgK}/{avgD}/{avgA}</Text>
      <Text style={cp.kdaVal}>KDA {kda}</Text>
      <Text style={cp.picks}>{pool.picks}게임</Text>
    </View>
  );
}
const cp = StyleSheet.create({
  card:   { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, alignItems: 'center', gap: 3 },
  img:    { width: 44, height: 44, borderRadius: 10, marginBottom: 4 },
  name:   { fontSize: 11, fontWeight: '700', color: C.gold, textAlign: 'center' },
  wr:     { fontSize: 16, fontWeight: '800' },
  kda:    { fontSize: 10, color: C.muted },
  kdaVal: { fontSize: 11, fontWeight: '600', color: C.text },
  picks:  { fontSize: 10, color: C.muted },
});

/* ── 최근 경기 행 ───────────────────────────── */
function MatchRow({ pm, eloDelta, cpScore, isMvp, isWorst }: {
  pm: PlayerMatch;
  eloDelta?: number;
  cpScore?: number | null;
  isMvp?: boolean;
  isWorst?: boolean;
}) {
  const { match, entry, won } = pm;
  const kda = `${entry.kills}/${entry.deaths}/${entry.assists}`;
  const kdaNum = entry.deaths === '0' || entry.deaths === ''
    ? parseInt(entry.kills || '0') + parseInt(entry.assists || '0')
    : ((parseInt(entry.kills || '0') + parseInt(entry.assists || '0')) / parseInt(entry.deaths || '1'));

  return (
    <View style={[mr.row, { backgroundColor: won ? C.winBg : C.loseBg, borderColor: won ? C.win + '40' : C.lose + '40' }]}>
      <View style={[mr.indicator, { backgroundColor: won ? C.win : C.lose }]} />

      <Image source={{ uri: getChampionImageUrl(entry.champion) }} style={mr.champImg} />

      <View style={mr.main}>
        <View style={mr.topRow}>
          <Text style={mr.champion}>{entry.champion || '—'}</Text>
          {entry.position ? <Text style={mr.position}>{entry.position}</Text> : null}
        </View>
        <Text style={[mr.kda, { color: kdaNum >= 4 ? C.win : kdaNum >= 2 ? C.text : C.lose }]}>
          {kda}
        </Text>
      </View>

      <View style={mr.right}>
        <Text style={mr.cs}>CS {entry.cs || '0'}</Text>
        {cpScore != null && <Text style={mr.cpScore}>CP {cpScore.toFixed(2)}</Text>}
        {isMvp && <Text style={mr.mvp}>MVP</Text>}
        {isWorst && <Text style={mr.worst}>WORST</Text>}
      </View>

      <View style={mr.extras}>
        {eloDelta != null && (
          <Text style={[mr.eloDelta, { color: eloDelta >= 0 ? C.win : C.lose }]}>
            {eloDelta >= 0 ? '+' : ''}{eloDelta}
          </Text>
        )}
        <Text style={[mr.result, { color: won ? C.win : C.lose }]}>{won ? '승' : '패'}</Text>
      </View>
    </View>
  );
}
const mr = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 6, overflow: 'hidden' },
  indicator:  { width: 4, alignSelf: 'stretch' },
  champImg:   { width: 44, height: 44, borderRadius: 8, margin: 10 },
  main:       { flex: 1 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  champion:   { fontSize: 13, fontWeight: '700', color: C.gold },
  position:   { fontSize: 10, color: C.muted, backgroundColor: C.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  kda:        { fontSize: 12, fontWeight: '600', marginTop: 3 },
  right:      { alignItems: 'flex-end', paddingRight: 10, gap: 2 },
  cs:         { fontSize: 10, color: C.text },
  cpScore:    { fontSize: 10, color: C.muted },
  mvp:        { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  worst:      { fontSize: 10, fontWeight: '800', color: C.lose },
  extras:     { alignItems: 'flex-end', paddingRight: 12, gap: 2, minWidth: 52 },
  eloDelta:   { fontSize: 13, fontWeight: '800' },
  result:     { fontSize: 13, fontWeight: '800' },
});

/* ── 메인 화면 ──────────────────────────────── */
export default function SummonerScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { rankings, matches, loading, tierThresholds, cpMultipliers, cpSettings } = useRankings();
  const [visibleCount, setVisibleCount] = useState(10);

  const nickname = decodeURIComponent(name ?? '');

  const rank = useMemo(
    () => rankings.findIndex(e => e.nickname.toLowerCase() === nickname.toLowerCase()) + 1,
    [rankings, nickname],
  );

  const eloEntry = useMemo(
    () => rankings.find(e => e.nickname.toLowerCase() === nickname.toLowerCase()),
    [rankings, nickname],
  );

  const playerMatches = useMemo(
    () => getPlayerMatches(matches, nickname),
    [matches, nickname],
  );

  const deltaMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of eloEntry?.history ?? []) {
      map.set(h.matchId, h.delta);
    }
    return map;
  }, [eloEntry]);

  const matchCpInfo = useMemo(() => {
    return playerMatches.map(({ match }) => {
      const results = calcMatchCp(match, cpSettings, cpMultipliers);
      const key = nickname.trim().toLowerCase();
      const myResult = results.find(r => r.nickname.trim().toLowerCase() === key);
      const sorted = [...results].sort((a, b) => b.cpScore - a.cpScore);
      const isMvp   = sorted[0]?.nickname.trim().toLowerCase() === key;
      const isWorst = sorted[sorted.length - 1]?.nickname.trim().toLowerCase() === key;
      return { cpScore: myResult?.cpScore ?? null, isMvp, isWorst };
    });
  }, [playerMatches, nickname, cpSettings, cpMultipliers]);

  const champPool = useMemo<ChampPool[]>(() => {
    const map = new Map<string, ChampPool>();
    for (const { entry, won } of playerMatches) {
      const champ = entry.champion.trim();
      if (!champ) continue;
      const prev = map.get(champ) ?? { champion: champ, picks: 0, wins: 0, totalK: 0, totalD: 0, totalA: 0 };
      map.set(champ, {
        ...prev,
        picks:  prev.picks + 1,
        wins:   prev.wins + (won ? 1 : 0),
        totalK: prev.totalK + (parseInt(entry.kills) || 0),
        totalD: prev.totalD + (parseInt(entry.deaths) || 0),
        totalA: prev.totalA + (parseInt(entry.assists) || 0),
      });
    }
    return [...map.values()].sort((a, b) => b.picks - a.picks).slice(0, 3);
  }, [playerMatches]);

  const winRate = eloEntry && eloEntry.games > 0
    ? Math.round((eloEntry.wins / eloEntry.games) * 100)
    : 0;

  const tierColor = eloEntry
    ? TIER_COLORS[getThresholdByElo(eloEntry.elo, tierThresholds).image] ?? C.text
    : C.muted;

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><Text style={{ color: C.muted }}>불러오는 중...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>

        {/* 뒤로가기 */}
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={C.gold} />
          <Text style={s.backText}>뒤로</Text>
        </TouchableOpacity>

        {/* 프로필 헤더 */}
        <View style={s.profileCard}>
          <View style={[s.avatar, { borderColor: tierColor }]}>
            {getTierImage(getThresholdByElo(eloEntry?.elo ?? 1000, tierThresholds).image)
              ? <Image source={getTierImage(getThresholdByElo(eloEntry?.elo ?? 1000, tierThresholds).image)!} style={s.avatarImg} />
              : <Text style={[s.avatarText, { color: tierColor }]}>{nickname.charAt(0).toUpperCase()}</Text>}
          </View>

          <View style={s.profileInfo}>
            <Text style={s.nickname}>{nickname}</Text>
            {eloEntry ? (
              <TierBadge elo={eloEntry.elo} tierThresholds={tierThresholds} />
            ) : null}
            {eloEntry && (
              <View style={s.profileStats}>
                <Text style={[s.profileStatVal, { color: C.win }]}>{eloEntry.wins}승</Text>
                <Text style={s.profileStatSep}> · </Text>
                <Text style={[s.profileStatVal, { color: C.lose }]}>{eloEntry.losses}패</Text>
                <Text style={s.profileStatSep}> · </Text>
                <Text style={[s.profileStatVal, { color: winRate >= 60 ? C.win : winRate <= 50 ? C.lose : C.text }]}>{winRate}%</Text>
              </View>
            )}
          </View>

          {eloEntry ? (
            <View style={s.eloBox}>
              <Text style={[s.eloValue, { color: tierColor }]}>
                {eloEntry.elo.toLocaleString()}
              </Text>
              <Text style={s.eloLabel}>ELO</Text>
              {rank > 0 && <Text style={s.rankText}>#{rank}</Text>}
            </View>
          ) : null}
        </View>


        {/* 챔피언 풀 */}
        {champPool.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>MOST 3 챔피언</Text>
            <View style={s.champRow}>
              {champPool.map(pool => (
                <ChampPoolCard key={pool.champion} pool={pool} />
              ))}
            </View>
          </View>
        )}

        {/* 최근 전적 */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>최근 전적 ({playerMatches.length}게임)</Text>
          {playerMatches.length === 0 ? (
            <Text style={{ color: C.muted }}>전적 없음</Text>
          ) : (
            <>
              {playerMatches.slice(0, visibleCount).map((pm, i) => (
                <MatchRow
                  key={pm.match.id ?? i}
                  pm={pm}
                  eloDelta={deltaMap.get(pm.match.id)}
                  cpScore={matchCpInfo[i]?.cpScore}
                  isMvp={matchCpInfo[i]?.isMvp}
                  isWorst={matchCpInfo[i]?.isWorst}
                />
              ))}
              {visibleCount < playerMatches.length && (
                <TouchableOpacity
                  style={s.loadMore}
                  onPress={() => setVisibleCount(v => v + 10)}
                >
                  <Text style={s.loadMoreText}>더보기 ({playerMatches.length - visibleCount}게임 남음)</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:     { padding: 16, paddingBottom: 40 },

  back:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText:    { color: C.gold, fontSize: 14 },

  /* 프로필 */
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, gap: 14, marginBottom: 10 },
  avatar:      { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  avatarText:  { fontSize: 24, fontWeight: '800' },
  avatarImg:   { width: 44, height: 44, resizeMode: 'contain' },
  profileInfo:     { flex: 1, gap: 6 },
  profileStats:    { flexDirection: 'row', alignItems: 'center' },
  profileStatVal:  { fontSize: 12, fontWeight: '700' },
  profileStatSep:  { fontSize: 12, color: C.muted },
  nickname:    { fontSize: 20, fontWeight: '800', color: C.gold },
  eloBox:      { alignItems: 'flex-end' },
  eloValue:    { fontSize: 22, fontWeight: '800' },
  eloLabel:    { fontSize: 10, color: C.muted },
  rankText:    { fontSize: 12, color: C.muted, marginTop: 2 },

  /* 통계 행 */
  statsRow:    { flexDirection: 'row', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  statCell:    { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: C.border },
  statValue:   { fontSize: 14, fontWeight: '800', color: C.text },
  statLabel:   { fontSize: 10, color: C.muted, marginTop: 2 },

  /* 섹션 */
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  champRow:     { flexDirection: 'row', gap: 8 },
  loadMore:     { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: C.border, borderRadius: 12, marginTop: 4 },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: C.gold },
});
