
import { useCallback, useEffect, useRef, useState } from 'react';

import { ErrorFace, errorToFace } from '@/api/errors';
import { getProducts, Product } from '@/api/products';
import { cacheProducts, getCachedProducts } from '@/db/database';

const PAGE_SIZE = 20;

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ErrorFace }
  | { status: 'ok'; data: Product[]; fromCache: boolean };

export function useProducts() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const total = useRef(Infinity);

  const loadFirstPage = useCallback(async () => {
    try {
      const { products, total: t } = await getProducts(0, PAGE_SIZE);
      total.current = t;
      setState({ status: 'ok', data: products, fromCache: false });
      cacheProducts(products, 0).catch(() => {});
    } catch (error) {
      const cached = await getCachedProducts().catch(() => []);

      if (cached.length > 0) {
        setState({ status: 'ok', data: cached, fromCache: true });
      } else {
        setState({ status: 'error', error: errorToFace(error) });
      }
    }
  }, []);

  // On mount: read the cache first, then fetch from the network.
  useEffect(() => {
    (async () => {
      const cached = await getCachedProducts().catch(() => []);

      if (cached.length > 0) {
        setState({ status: 'ok', data: cached, fromCache: true });
      }

      await loadFirstPage();
    })();
  }, [loadFirstPage]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    loadFirstPage();
  }, [loadFirstPage]);

  // Infinite scroll: FlatList's onEndReached calls this.
  const loadMore = useCallback(async () => {
    if (state.status !== 'ok' || state.fromCache || loadingMore) return;

    const skip = state.data.length;

    if (skip >= total.current) return;

    setLoadingMore(true);

    try {
      const { products } = await getProducts(skip, PAGE_SIZE);

      setState((s) => {
        if (s.status !== 'ok') return s;

        const known = new Set(s.data.map((p) => p.id));

        return {
          ...s,
          data: [...s.data, ...products.filter((p) => !known.has(p.id))],
        };
      });

      cacheProducts(products, skip).catch(() => {});
    } catch {
      // The user can scroll again to retry.
    } finally {
      setLoadingMore(false);
    }
  }, [state, loadingMore]);

  return { state, refreshing, reload, retry, loadMore, loadingMore };
}
