import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeStackLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: theme.fonts.bold },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Haus Win Market' }} />
      <Stack.Screen name="Product/[id]" options={{ title: 'Loading…' }} />
    </Stack>
  );
}
