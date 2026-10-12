// Loading, error and empty states.
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import { ErrorFace } from '@/api/errors';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.center,
        {
          padding: theme.spacing.xl,
          gap: theme.spacing.m,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={56}
        color={theme.colors.textMuted}
      />

      <AppText variant="title" style={styles.centerText}>
        {title}
      </AppText>

      <AppText muted style={styles.centerText}>
        {message}
      </AppText>

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  face,
  onRetry,
}: {
  face: ErrorFace;
  onRetry?: () => void;
}) {
  const icon: IconName =
    face.kind === 'offline'
      ? 'cloud-offline-outline'
      : face.kind === 'notFound'
        ? 'search-outline'
        : 'warning-outline';

  return (
    <EmptyState
      icon={icon}
      title={face.title}
      message={face.message}
      actionLabel={
        face.canRetry && onRetry ? 'Try again' : undefined
      }
      onAction={onRetry}
    />
  );
}

// Show placeholders while product data is loading.
export function SkeletonGrid({
  columns,
}: {
  columns: number;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const gap = theme.spacing.m;
  const cardWidth =
    (width - gap * (columns + 1)) / columns;

  return (
    <View
      accessible
      accessibilityLabel="Loading products"
      accessibilityRole="progressbar"
      style={[
        styles.grid,
        { padding: gap / 2 },
      ]}
    >
      {Array.from({ length: columns * 3 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: cardWidth,
            margin: gap / 2,
            gap: theme.spacing.s,
          }}
        >
          <View
            style={{
              aspectRatio: 1,
              borderRadius: theme.radius.m,
              backgroundColor: theme.colors.skeleton,
            }}
          />

          <View
            style={[
              styles.line,
              {
                width: '80%',
                backgroundColor: theme.colors.skeleton,
              },
            ]}
          />

          <View
            style={[
              styles.line,
              {
                width: '40%',
                backgroundColor: theme.colors.skeleton,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
});