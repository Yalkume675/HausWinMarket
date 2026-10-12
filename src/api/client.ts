
 // ONE axios client, configured once (Lecture 7).
 // - baseURL from an EXPO_PUBLIC_ environment variable (see .env)
 // - a timeout so a dead network fails fast
 // - interceptors: attach the token to every request; handle 401 in ONE place

import axios from 'axios';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://dummyjson.com';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// The auth store registers these at startup.
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function configureAuth(handlers: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  getToken = handlers.getToken;
  onUnauthorized = handlers.onUnauthorized;
}

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    if (__DEV__) {
      console.log(
        `[api] ${error?.config?.method?.toUpperCase()} ${url} -> ${
          status ?? 'NETWORK'
        }`
      );
    }

    // A 401 means the token may be missing or expired.
    // Do not log out for the login request itself.
    if (status === 401 && !url.includes('/auth/login')) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);
