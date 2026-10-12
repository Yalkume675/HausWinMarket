
import { create } from 'zustand';

type CheckoutState = {
  address: string | null;
  setAddress: (address: string) => void;
  reset: () => void;
};

export const useCheckout = create<CheckoutState>()((set) => ({
  address: null,
  setAddress: (address) => set({ address }),
  reset: () => set({ address: null }),
}));
