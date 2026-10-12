
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { buildTheme, Theme } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'prefs:themeMode';

export function AppThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = raw
          ? (JSON.parse(raw) as ThemeMode)
          : 'system';

        if (
          saved === 'light' ||
          saved === 'dark' ||
          saved === 'system'
        ) {
          setModeState(saved);
        }
      } catch {
        // Missing or invalid saved data: keep the default.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    ).catch(() => {});
  };

  const resolved =
    mode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  const theme = buildTheme(resolved);

  return (
    <ThemeContext.Provider
      value={{ theme, mode, setMode, ready }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error(
      'useTheme must be used inside <AppThemeProvider>'
    );
  }

  return ctx;
}
