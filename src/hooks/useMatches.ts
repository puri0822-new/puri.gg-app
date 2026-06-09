import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Match } from '../types/match';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snapshot => {
      setMatches(snapshot.docs.map(d => d.data() as Match));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  return { matches, loading };
}
