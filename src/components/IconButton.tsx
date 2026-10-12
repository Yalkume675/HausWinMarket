// IconButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  disabled?: boolean;
  size?: number;
};

export function IconButton({
  icon,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  color,
  filled,
  disabled,
  size = 22,
}: Props) {
  const { theme } = useTheme();
  const tint = color ?? (filled ? theme.colors.onPrimary : theme.colors.primary);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          minWidth: theme.touch.min,
          minHeight: theme.touch.min,
          borderRadius: theme.radius.pill,
          backgroundColor: filled ? theme.colors.primary : 'transparent',
        },
        pressed && { opacity: 0.6 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Ionicons name={icon} size={size} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});