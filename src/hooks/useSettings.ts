import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_TIER_THRESHOLDS, DEFAULT_BONUS, type TierThreshold, type BonusSettings } from '../utils/elo';
import { DEFAULT_CP_MULTIPLIERS, type CpMultipliers } from '../utils/cp';

interface AppSettings {
  kFactor:        number;
  winBonus:       number;
  aceBonus:       number;
  aceMinCp:       number;
  tierThresholds: TierThreshold[];
  cpMultipliers:  CpMultipliers;
}

export function useSettings() {
  const [kFactor, setKFactor]               = useState(32);
  const [bonus, setBonus]                   = useState<BonusSettings>(DEFAULT_BONUS);
  const [tierThresholds, setTierThresholds] = useState<TierThreshold[]>(DEFAULT_TIER_THRESHOLDS);
  const [cpMultipliers, setCpMultipliers]   = useState<CpMultipliers>(DEFAULT_CP_MULTIPLIERS);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'global_config'),
      snap => {
        if (snap.exists()) {
          const data = snap.data() as Partial<AppSettings>;
          if (data.kFactor)                setKFactor(data.kFactor);
          if (data.tierThresholds?.length) setTierThresholds(data.tierThresholds);
          if (data.cpMultipliers)          setCpMultipliers(data.cpMultipliers);
          setBonus({
            winBonus: data.winBonus ?? DEFAULT_BONUS.winBonus,
            aceBonus: data.aceBonus ?? DEFAULT_BONUS.aceBonus,
            aceMinCp: data.aceMinCp ?? DEFAULT_BONUS.aceMinCp,
          });
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  return { kFactor, bonus, tierThresholds, cpMultipliers, loading };
}
