import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'gamerhub-saved-posts';

interface SavedPostsState {
  savedIds: string[];
  toggle: (postId: string) => void;
  isSaved: (postId: string) => boolean;
}

export const useSavedPostsStore = create<SavedPostsState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggle: (postId: string) => {
        const ids = get().savedIds;
        const next = ids.includes(postId)
          ? ids.filter(id => id !== postId)
          : [...ids, postId];
        set({ savedIds: next });
      },
      isSaved: (postId: string) => {
        return get().savedIds.includes(postId);
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

export function useSavedPosts() {
  const savedIds = useSavedPostsStore((state) => state.savedIds);
  const toggle = useSavedPostsStore((state) => state.toggle);
  const isSaved = useSavedPostsStore((state) => state.isSaved);

  return { savedIds, toggle, isSaved };
}
