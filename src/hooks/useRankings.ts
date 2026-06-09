import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMatches } from './useMatches';
import { useSettings } from './useSettings';
import { calcEloRankings, type EloEntry } from '../utils/elo';

interface AdminAdjustment {
  playerName:   string;
  changeAmount: number;
}

export function useRankings() {
  const { matches, loading: matchesLoading } = useMatches();
  const { kFactor, bonus, tierThresholds, cpMultipliers, cpSettings, loading: settingsLoading } = useSettings();
  const [adjustments, setAdjustments]        = useState<AdminAdjustment[]>([]);
  const [adjLoading, setAdjLoading]          = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'eloHistory'),
      snapshot => {
        setAdjustments(snapshot.docs.map(d => d.data() as AdminAdjustment));
        setAdjLoading(false);
      },
      () => setAdjLoading(false),
    );
    return () => unsub();
  }, []);

  const rankings = useMemo<EloEntry[]>(() => {
    const base = calcEloRankings(matches, kFactor, bonus, cpMultipliers, cpSettings);

    // 관리자 조정 합산 (닉네임 소문자 기준)
    const deltaMap = new Map<string, number>();
    for (const r of adjustments) {
      const key = r.playerName.trim().toLowerCase();
      deltaMap.set(key, (deltaMap.get(key) ?? 0) + r.changeAmount);
    }

    return base
      .map(entry => {
        const delta = deltaMap.get(entry.nickname.trim().toLowerCase()) ?? 0;
        return delta !== 0 ? { ...entry, elo: entry.elo + delta } : entry;
      })
      .sort((a, b) => b.elo - a.elo);
  }, [matches, kFactor, bonus, cpMultipliers, cpSettings, adjustments]);

  return {
    rankings,
    matches,
    loading: matchesLoading || adjLoading || settingsLoading,
    tierThresholds,
    kFactor,
    bonus,
    cpMultipliers,
    cpSettings,
  };
}
