import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gamerhub-saved-posts';

export function useSavedPosts() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSavedIds(JSON.parse(stored)); } catch { setSavedIds([]); }
    }
  }, []);

  const persist = useCallback((ids: string[]) => {
    setSavedIds(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const toggle = useCallback((postId: string) => {
    const next = savedIds.includes(postId)
      ? savedIds.filter(id => id !== postId)
      : [...savedIds, postId];
    persist(next);
  }, [savedIds, persist]);

  const isSaved = useCallback((postId: string) => savedIds.includes(postId), [savedIds]);

  return { savedIds, toggle, isSaved };
}
