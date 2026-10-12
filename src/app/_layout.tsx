
import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { addNotificationTapListener } from '@/lib/notifications';
import { useAuth } from '@/store/auth';
import { useCartHydrated } from '@/store/cart';
import { AppThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Keep the native splash visible until fonts + session + cart are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { theme, ready: themeReady } = useTheme();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  const token = useAuth((s) => s.token);
  const authHydrated = useAuth((s) => s.hydrated);
  const cartHydrated = useCartHydrated();

  useEffect(() => {
    useAuth.getState().hydrate();
  }, []);

  useNotificationDeepLinks();

  const ready = fontsLoaded && authHydrated && cartHydrated && themeReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // Give React Navigation our theme colours too.
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontFamily: theme.fonts.bold },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="checkout"
            options={{ presentation: 'modal', title: 'Checkout' }}
          />
          <Stack.Screen
            name="address"
            options={{ presentation: 'modal', title: 'Delivery address' }}
          />
          <Stack.Screen
            name="sell"
            options={{ presentation: 'modal', title: 'Sell an item' }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!token}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

// Tapping a notification opens the URL in its payload.
function useNotificationDeepLinks() {
  useEffect(
    () => addNotificationTapListener((url) => router.push(url as never)),
    []
  );
}
