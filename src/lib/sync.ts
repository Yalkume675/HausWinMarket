
import * as Network from 'expo-network';

import { errorToFace } from '@/api/errors';
import { createProduct } from '@/api/products';
import { getPendingListings, markListingSynced } from '@/db/database';
import { useAuth } from '@/store/auth';
import { useListings } from '@/store/listings';
import { notifyListingsLive } from './notifications';

let running = false;

export async function isOnline() {
  const state = await Network.getNetworkStateAsync();

  return (
    !!state.isConnected &&
    state.isInternetReachable !== false
  );
}

export async function syncPendingListings(): Promise<{
  synced: number;
  remaining: number;
}> {
  const owner = useAuth.getState().user?.username;

  if (running || !owner) {
    return { synced: 0, remaining: 0 };
  }

  running = true;
  useListings.getState().setSyncing(true);

  let synced = 0;
  let remaining = 0;

  try {
    const pending = await getPendingListings(owner);
    remaining = pending.length;

    if (pending.length === 0 || !(await isOnline())) {
      return { synced, remaining };
    }

    for (const listing of pending) {
      try {
        const created = await createProduct({
          title: listing.title,
          price: listing.price,
          category: listing.category,
          description: listing.description,
          thumbnail: listing.photo_uri,
        });

        await markListingSynced(listing.local_id, created.id);

        synced += 1;
        remaining -= 1;
      } catch (error) {
        // If the network drops, stop and retry later.
        if (errorToFace(error).kind === 'offline') break;

        // Leave other failed listings queued and continue.
      }
    }

    if (synced > 0 && remaining === 0) {
      await notifyListingsLive(synced);
    }

    return { synced, remaining };
  } finally {
    running = false;
    useListings.getState().setSyncing(false);
    useListings.getState().markSynced();
    await useListings.getState().refresh(owner);
  }
}
