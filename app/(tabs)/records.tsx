import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatches } from '../../src/hooks/useMatches';
import { getChampionImageUrl } from '../../src/utils/championData';
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
  blue:       '#4a9eff',
  red:        '#ff4a4a',
  blueBg:     '#4a9eff18',
  redBg:      '#ff4a4a18',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

function kda(p: PlayerEntry): string {
  return `${p.kills}/${p.deaths}/${p.assists}`;
}

function TeamColumn({
  players,
  side,
  winner,
  onSelectPlayer,
}: {
  players: PlayerEntry[];
  side: 'blue' | 'red';
  winner: 'blue' | 'red';
  onSelectPlayer: (nickname: string) => void;
}) {
  const won = winner === side;
  const sideColor = side === 'blue' ? C.blue : C.red;

  return (
    <View style={[tc.col, side === 'red' && { alignItems: 'flex-end' }]}>
      <Text style={[tc.teamLabel, { color: won ? C.win : C.lose }]}>
        {won ? '승' : '패'}
      </Text>
      {players.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={[tc.row, side === 'red' && { flexDirection: 'row-reverse' }]}
          onPress={() => p.nickname.trim() && onSelectPlayer(p.nickname.trim())}
        >
          <Image
            source={{ uri: getChampionImageUrl(p.champion) }}
            style={tc.champImg}
          />
          <View style={[tc.info, side === 'red' && { alignItems: 'flex-end' }]}>
            <Text style={[tc.nick, { color: sideColor }]} numberOfLines={1}>
              {p.nickname || '—'}
            </Text>
            <Text style={tc.kda}>{kda(p)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tc = StyleSheet.create({
  col:      { flex: 1 },
  teamLabel:{ fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  champImg: { width: 28, height: 28, borderRadius: 6 },
  info:     { flex: 1 },
  nick:     { fontSize: 11, fontWeight: '700' },
  kda:      { fontSize: 10, color: '#5c6478' },
});

function MatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const blueKills = match.blueTeam.reduce((s, p) => s + (parseInt(p.kills) || 0), 0);
  const redKills  = match.redTeam.reduce((s, p) => s + (parseInt(p.kills) || 0), 0);
  const blueWon   = match.winner === 'blue';

  const handleSelectPlayer = (nickname: string) => {
    router.push(`/summoner/${encodeURIComponent(nickname)}`);
  };

  return (
    <View style={s.card}>
      {/* 헤더 */}
      <TouchableOpacity style={s.cardHeader} onPress={() => setExpanded(v => !v)}>
        <View style={s.headerLeft}>
          <Text style={s.dateText}>{formatDate(match.date)}</Text>
          {match.gameDurationSeconds != null && (
            <Text style={s.durationText}>{formatDuration(match.gameDurationSeconds)}</Text>
          )}
        </View>

        {/* 킬스코어 */}
        <View style={s.scoreBox}>
          <Text style={[s.scoreNum, { color: blueWon ? C.win : C.lose }]}>{blueKills}</Text>
          <Text style={s.scoreSep}>:</Text>
          <Text style={[s.scoreNum, { color: !blueWon ? C.win : C.lose }]}>{redKills}</Text>
        </View>

        <View style={s.headerRight}>
          <View style={[s.winBadge, { backgroundColor: blueWon ? C.blueBg : C.redBg }]}>
            <Text style={[s.winBadgeText, { color: blueWon ? C.blue : C.red }]}>
              {blueWon ? '블루 승' : '레드 승'}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={C.muted}
          />
        </View>
      </TouchableOpacity>

      {/* 챔피언 미리보기 (접힌 상태) */}
      {!expanded && (
        <View style={s.preview}>
          <View style={s.previewTeam}>
            {match.blueTeam.slice(0, 5).map((p, i) => (
              <Image
                key={i}
                source={{ uri: getChampionImageUrl(p.champion) }}
                style={[s.previewChamp, blueWon && s.previewWin]}
              />
            ))}
          </View>
          <View style={s.previewDivider} />
          <View style={[s.previewTeam, { justifyContent: 'flex-end' }]}>
            {match.redTeam.slice(0, 5).map((p, i) => (
              <Image
                key={i}
                source={{ uri: getChampionImageUrl(p.champion) }}
                style={[s.previewChamp, !blueWon && s.previewWin]}
              />
            ))}
          </View>
        </View>
      )}

      {/* 상세 보기 (펼친 상태) */}
      {expanded && (
        <View style={s.detail}>
          <View style={[s.teamHeader, { backgroundColor: C.blueBg }]}>
            <Text style={[s.teamHeaderText, { color: C.blue }]}>블루팀</Text>
            <Text style={[s.teamHeaderText, { color: C.blue }]}>블루팀</Text>
          </View>

          <View style={s.teams}>
            <TeamColumn
              players={match.blueTeam}
              side="blue"
              winner={match.winner}
              onSelectPlayer={handleSelectPlayer}
            />
            <View style={s.teamsDiv} />
            <TeamColumn
              players={match.redTeam}
              side="red"
              winner={match.winner}
              onSelectPlayer={handleSelectPlayer}
            />
          </View>

          {/* 밴 정보 */}
          {match.bans && (match.bans.blue.length > 0 || match.bans.red.length > 0) && (
            <View style={s.bans}>
              <Text style={s.bansLabel}>밴</Text>
              <View style={s.banRow}>
                <View style={s.banTeam}>
                  {match.bans.blue.map((champ, i) => (
                    <Image key={i} source={{ uri: getChampionImageUrl(champ) }} style={s.banImg} />
                  ))}
                </View>
                <View style={s.banTeam}>
                  {match.bans.red.map((champ, i) => (
                    <Image key={i} source={{ uri: getChampionImageUrl(champ) }} style={s.banImg} />
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function RecordsScreen() {
  const { matches, loading } = useMatches();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const key = formatDate(m.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].map(([date, items]) => ({ date, items }));
  }, [matches]);

  const dates = useMemo(() => grouped.map(g => g.date), [grouped]);

  const filteredGrouped = useMemo(() =>
    selectedDate ? grouped.filter(g => g.date === selectedDate) : grouped,
    [grouped, selectedDate],
  );

  type ListItem =
    | { type: 'header'; date: string }
    | { type: 'match'; match: Match };

  const listData = useMemo<ListItem[]>(() => {
    const result: ListItem[] = [];
    for (const { date, items } of filteredGrouped) {
      result.push({ type: 'header', date });
      for (const m of items) result.push({ type: 'match', match: m });
    }
    return result;
  }, [filteredGrouped]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={{ color: C.muted }}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matches.length === 0) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={{ color: C.muted }}>전적 데이터 없음</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === 'header' ? `h-${item.date}` : `m-${item.match.id ?? i}`
        }
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateFilter} contentContainerStyle={s.dateFilterContent}>
            <TouchableOpacity
              style={[s.dateChip, selectedDate === null && s.dateChipActive]}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={[s.dateChipText, selectedDate === null && s.dateChipTextActive]}>전체</Text>
            </TouchableOpacity>
            {dates.map(date => (
              <TouchableOpacity
                key={date}
                style={[s.dateChip, selectedDate === date && s.dateChipActive]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[s.dateChipText, selectedDate === date && s.dateChipTextActive]}>{date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={s.dateHeader}>
                <View style={s.dateHeaderLine} />
                <Text style={s.dateHeaderText}>{item.date}</Text>
                <View style={s.dateHeaderLine} />
              </View>
            );
          }
          return <MatchCard match={item.match} />;
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.background },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:            { padding: 16, paddingBottom: 40 },

  /* 날짜 필터 */
  dateFilter:          { marginBottom: 12 },
  dateFilterContent:   { gap: 8 },
  dateChip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  dateChipActive:      { backgroundColor: C.gold, borderColor: C.gold },
  dateChipText:        { fontSize: 12, color: C.muted, fontWeight: '600' },
  dateChipTextActive:  { color: '#0a0e1a' },

  /* 날짜 그룹 헤더 */
  dateHeader:      { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dateHeaderLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dateHeaderText:  { color: C.muted, fontSize: 11, letterSpacing: 2, marginHorizontal: 10 },

  /* 경기 카드 */
  card:            { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },

  /* 카드 헤더 */
  cardHeader:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  headerLeft:      { flex: 1, gap: 2 },
  dateText:        { fontSize: 12, color: C.text },
  durationText:    { fontSize: 11, color: C.muted },
  scoreBox:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreNum:        { fontSize: 20, fontWeight: '800' },
  scoreSep:        { fontSize: 14, color: C.muted, fontWeight: '300' },
  headerRight:     { flex: 1, alignItems: 'flex-end', gap: 4 },
  winBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  winBadgeText:    { fontSize: 11, fontWeight: '700' },

  /* 접힌 미리보기 */
  preview:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12, gap: 6 },
  previewTeam:     { flex: 1, flexDirection: 'row', gap: 4 },
  previewChamp:    { width: 30, height: 30, borderRadius: 6, opacity: 0.6 },
  previewWin:      { opacity: 1 },
  previewDivider:  { width: 1, height: 30, backgroundColor: C.border },

  /* 펼친 상세 */
  detail:          { borderTopWidth: 1, borderTopColor: C.border },
  teamHeader:      { display: 'none' }, // 레이아웃용 (미사용)
  teams:           { flexDirection: 'row', padding: 14, gap: 8 },
  teamsDiv:        { width: 1, backgroundColor: C.border },

  /* 밴 */
  bans:            { borderTopWidth: 1, borderTopColor: C.border, padding: 12 },
  bansLabel:       { fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  banRow:          { flexDirection: 'row', gap: 12 },
  banTeam:         { flex: 1, flexDirection: 'row', gap: 4 },
  banImg:          { width: 24, height: 24, borderRadius: 4, opacity: 0.5 },
});
