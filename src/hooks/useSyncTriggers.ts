
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncPendingListings } from '@/lib/sync';
import { useAuth } from '@/store/auth';
import { useListings } from '@/store/listings';

export function useSyncTriggers() {
  const username = useAuth((s) => s.user?.username);

  useEffect(() => {
    if (!username) return;

    useListings
      .getState()
      .refresh(username)
      .then(() => syncPendingListings());

    const networkSub = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        syncPendingListings();
      }
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        syncPendingListings();
      }
    });

    return () => {
      networkSub.remove();
      appStateSub.remove();
    };
  }, [username]);
}
