
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (product: Omit<CartItem, 'qty'>) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === product.id);

          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === product.id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }

          return { items: [...s.items, { ...product, qty: 1 }] };
        }),

      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      remove: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);

// Derived values (selectors)
export const selectCount = (s: CartState) =>
  s.items.reduce((n, i) => n + i.qty, 0);

export const selectTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.qty, 0);

// Wait until the saved cart has finished loading.
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated()
  );
}
