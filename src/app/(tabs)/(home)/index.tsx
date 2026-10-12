
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { ProductCard } from '@/components/ProductCard';
import {
    EmptyState,
    ErrorState,
    SkeletonGrid,
} from '@/components/StateViews';
import { useProducts } from '@/hooks/useProducts';
import { useShake } from '@/hooks/useShake';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const firstName = useAuth((s) => s.user?.firstName);

  const {
    state,
    refreshing,
    reload,
    retry,
    loadMore,
    loadingMore,
  } = useProducts();

  useShake(reload);

  // Phone: 2 columns; tablet: 3; large screen: 4.
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const gap = theme.spacing.s;
  const cardWidth = (width - gap * 2 * (columns + 1)) / columns;

  let body;

  if (state.status === 'loading') {
    body = <SkeletonGrid columns={columns} />;
  } else if (state.status === 'error') {
    body = <ErrorState face={state.error} onRetry={retry} />;
  } else {
    body = (
      <FlatList
        key={columns}
        data={state.data}
        numColumns={columns}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <ProductCard product={item} width={cardWidth} />
        )}
        contentContainerStyle={{
          padding: gap,
          paddingBottom: theme.spacing.xl * 3,
        }}
        ListHeaderComponent={
          <View style={{ padding: theme.spacing.s, gap: theme.spacing.s }}>
            <AppText variant="title">
              Hello{firstName ? `, ${firstName}` : ''} 👋
            </AppText>
            <AppText muted>
              Fresh from the market today. Shake your phone to refresh.
            </AppText>
            {state.fromCache ? (
              <Banner
                icon="cloud-offline-outline"
                tone="warning"
                message="You're offline — showing saved products."
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="basket-outline"
            title="No products yet"
            message="Be the first to sell something in your area."
            actionLabel="Sell an item"
            onAction={() => router.push('/sell')}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ margin: theme.spacing.m }} />
          ) : null
        }
        refreshing={refreshing}
        onRefresh={reload}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    );
  }

  return (
    <View style={styles.flex}>
      {body}

      <Pressable
        onPress={() => router.push('/sell')}
        accessibilityRole="button"
        accessibilityLabel="Sell an item"
        accessibilityHint="Opens the form to list something for sale"
        hitSlop={8}
        style={({ pressed }) => [
          styles.fab,
          {
            right: theme.spacing.m,
            bottom: theme.spacing.m,
            gap: theme.spacing.s,
            paddingHorizontal: theme.spacing.m,
            minHeight: theme.touch.min + theme.spacing.s,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.primary,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons
          name="pricetag-outline"
          size={20}
          color={theme.colors.onPrimary}
        />
        <AppText bold color={theme.colors.onPrimary}>
          Sell
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
