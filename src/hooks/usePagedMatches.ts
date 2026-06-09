import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, limit, startAfter,
  getDocs, type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Match } from '../types/match';

const PAGE_SIZE = 20;

export function usePagedMatches() {
  const [matches, setMatches]       = useState<Match[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [lastDoc, setLastDoc]       = useState<DocumentSnapshot | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'matches'),
      orderBy('date', 'desc'),
      limit(PAGE_SIZE),
    );
    getDocs(q)
      .then(snapshot => {
        const docs = snapshot.docs;
        setMatches(docs.map(d => d.data() as Match));
        setLastDoc(docs[docs.length - 1] ?? null);
        setHasMore(docs.length === PAGE_SIZE);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'matches'),
        orderBy('date', 'desc'),
        limit(PAGE_SIZE),
        startAfter(lastDoc),
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      setMatches(prev => [...prev, ...docs.map(d => d.data() as Match)]);
      setLastDoc(docs[docs.length - 1] ?? null);
      setHasMore(docs.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, hasMore]);

  return { matches, loading, loadingMore, hasMore, loadMore };
}
