
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { api, configureAuth } from '@/api/client';
import { useCart } from './cart';
import { useCheckout } from './checkout';
import { useListings } from './listings';

export type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
};

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
};

function toUser(raw: any): User {
  return {
    id: Number(raw?.id ?? 0),
    username: String(raw?.username ?? ''),
    firstName: String(raw?.firstName ?? ''),
    lastName: String(raw?.lastName ?? ''),
    email: String(raw?.email ?? ''),
    image: String(raw?.image ?? ''),
  };
}

export const useAuth = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const rawUser = await SecureStore.getItemAsync(USER_KEY);
      set({ token, user: rawUser ? toUser(JSON.parse(rawUser)) : null });
    } catch {
      set({ token: null, user: null });
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (username, password) => {
    const { data } = await api.post('/auth/login', {
      username,
      password,
      expiresInMins: 60 * 24 * 7,
    });

    const token = String(data?.accessToken ?? data?.token ?? '');
    if (!token) throw new Error('No token returned');

    const user = toUser(data);

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    set({ token, user });
  },

  setUser: (user) => {
    set({ user });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(() => {});
  },

  logout: async () => {
    if (!get().token) return;

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    useCart.getState().clear();
    useCheckout.getState().reset();
    useListings.getState().reset();

    set({ token: null, user: null });
  },
}));

configureAuth({
  getToken: () => useAuth.getState().token,
  onUnauthorized: () => {
    useAuth.getState().logout();
  },
});
