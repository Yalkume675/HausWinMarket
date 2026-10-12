
import { create } from 'zustand';

import { getListings, Listing } from '@/db/database';

type ListingsState = {
  items: Listing[];
  syncing: boolean;
  lastSyncAt: number | null;
  refresh: (owner: string) => Promise<void>;
  setSyncing: (syncing: boolean) => void;
  markSynced: () => void;
  reset: () => void;
};

export const useListings = create<ListingsState>()((set) => ({
  items: [],
  syncing: false,
  lastSyncAt: null,

  refresh: async (owner) => {
    const items = await getListings(owner);
    set({ items });
  },

  setSyncing: (syncing) => set({ syncing }),

  markSynced: () => set({ lastSyncAt: Date.now() }),

  reset: () => set({ items: [], syncing: false, lastSyncAt: null }),
}));

export const selectPendingCount = (s: ListingsState) =>
  s.items.filter((l) => l.synced === 0).length;
