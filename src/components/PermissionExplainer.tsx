// Explain why a permission is needed before requesting it.
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  reason: string;
  canAskAgain: boolean;
  onAllow: () => void;
  onCancel: () => void;
};

export function PermissionExplainer({
  icon,
  title,
  reason,
  canAskAgain,
  onAllow,
  onCancel,
}: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          gap: theme.spacing.m,
          padding: theme.spacing.m,
          borderRadius: theme.radius.l,
          backgroundColor: theme.colors.surfaceRaised,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.row,
          { gap: theme.spacing.s },
        ]}
      >
        <Ionicons
          name={icon}
          size={28}
          color={theme.colors.primary}
        />

        <AppText variant="title" style={styles.flex}>
          {title}
        </AppText>
      </View>

      <AppText>{reason}</AppText>

      {canAskAgain ? (
        <Button
          label="Continue"
          onPress={onAllow}
          accessibilityHint="Shows the system permission prompt"
        />
      ) : (
        <>
          <AppText muted variant="small">
            Permission was turned off. You can enable it in
            your phone&apos;s Settings.
          </AppText>

          <Button
            label="Open Settings"
            icon="settings-outline"
            onPress={() => Linking.openSettings()}
          />
        </>
      )}

      <Button
        label="Not now"
        variant="secondary"
        onPress={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});