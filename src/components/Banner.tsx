// A small inline notice, e.g. "You're offline — showing saved products".
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

export function Banner({
  icon,
  message,
  tone = 'info',
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  message: string;
  tone?: 'info' | 'warning' | 'danger';
}) {
  const { theme } = useTheme();

  const color =
    tone === 'warning'
      ? theme.colors.warning
      : tone === 'danger'
        ? theme.colors.danger
        : theme.colors.primary;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.row,
        {
          gap: theme.spacing.s,
          padding: theme.spacing.s + 4,
          borderRadius: theme.radius.m,
          borderColor: color,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />

      <AppText variant="small" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
});