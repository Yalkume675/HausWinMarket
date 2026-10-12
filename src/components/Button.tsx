
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
  accessibilityHint?: string;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  busy = false,
  busyLabel,
  disabled = false,
  accessibilityHint,
  fullWidth = true,
}: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const isDisabled = disabled || busy;

  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : 'transparent';

  const foreground =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'danger'
        ? colors.onDanger
        : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy }}
      android_ripple={{ color: '#ffffff33' }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor:
            variant === 'secondary' ? colors.primary : background,
          borderRadius: theme.radius.m,
          minHeight: theme.touch.min,
          paddingHorizontal: theme.spacing.m,
          paddingVertical: theme.spacing.s + 2,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={[styles.row, { gap: theme.spacing.s }]}>
        {busy ? (
          <ActivityIndicator color={foreground} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={foreground} />
        ) : null}

        <AppText bold color={foreground}>
          {busy && busyLabel ? busyLabel : label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.5 },
});
