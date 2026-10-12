
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Share,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import { ErrorFace, errorToFace } from '@/api/errors';
import { getProduct, Product } from '@/api/products';
import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { ErrorState } from '@/components/StateViews';
import { getCachedProduct } from '@/db/database';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/store/cart';
import { useTheme } from '@/theme/ThemeProvider';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ErrorFace }
  | { status: 'ok'; data: Product; fromCache: boolean };

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const add = useCart((s) => s.add);
  const inCart = useCart(
    (s) => s.items.find((i) => i.id === productId)?.qty ?? 0
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await getCachedProduct(productId).catch(() => null);

      if (cached && !cancelled) {
        setState({ status: 'ok', data: cached, fromCache: true });
      }

      try {
        const fresh = await getProduct(productId);

        if (!cancelled) {
          setState({ status: 'ok', data: fresh, fromCache: false });
        }
      } catch (error) {
        if (!cancelled && !cached) {
          setState({ status: 'error', error: errorToFace(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, attempt]);

  const product = state.status === 'ok' ? state.data : null;

  const share = () => {
    if (!product) return;

    const url = Linking.createURL(`/product/${product.id}`);

    Share.share({
      message: `${product.title} — ${formatPrice(product.price)} on Haus Win Market\n${url}`,
    });
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: product?.title ?? 'Loading…',
          headerRight: () =>
            product ? (
              <IconButton
                icon="share-social-outline"
                accessibilityLabel="Share this product"
                onPress={share}
              />
            ) : null,
        }}
      />

      {state.status === 'loading' ? (
        <ActivityIndicator
          style={styles.flex}
          size="large"
          accessibilityLabel="Loading product"
        />
      ) : state.status === 'error' ? (
        <ErrorState
          face={state.error}
          onRetry={() => {
            setState({ status: 'loading' });
            setAttempt((n) => n + 1);
          }}
        />
      ) : (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={{ paddingBottom: theme.spacing.l }}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {(state.data.images.length
                ? state.data.images
                : [state.data.thumbnail]
              ).map((uri, index, all) => (
                <Image
                  key={uri}
                  source={uri}
                  contentFit="contain"
                  transition={200}
                  style={{
                    width,
                    aspectRatio: 4 / 3,
                    backgroundColor: theme.colors.surface,
                  }}
                  accessibilityLabel={`Photo ${index + 1} of ${all.length} of ${state.data.title}`}
                />
              ))}
            </ScrollView>

            <View
              style={{
                padding: theme.spacing.m,
                gap: theme.spacing.s,
              }}
            >
              {state.fromCache ? (
                <Banner
                  icon="cloud-offline-outline"
                  tone="warning"
                  message="Showing saved details — price may have changed."
                />
              ) : null}

              <AppText variant="h1">{state.data.title}</AppText>

              <AppText variant="title" color={theme.colors.primary}>
                {formatPrice(state.data.price)}
              </AppText>

              <AppText muted>
                ★ {state.data.rating.toFixed(1)} · {state.data.stock} in stock
                {state.data.brand ? ` · ${state.data.brand}` : ''}
                {' · '}
                {state.data.category}
              </AppText>

              <AppText style={{ marginTop: theme.spacing.s }}>
                {state.data.description}
              </AppText>
            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              {
                padding: theme.spacing.m,
                gap: theme.spacing.m,
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.flex}>
              <AppText variant="small" muted>
                {inCart > 0
                  ? `${inCart} in your cart`
                  : 'Not in your cart yet'}
              </AppText>

              <AppText bold>{formatPrice(state.data.price)}</AppText>
            </View>

            <Button
              label="Add to cart"
              icon="cart-outline"
              fullWidth={false}
              accessibilityHint="Adds one item"
              onPress={() =>
                add({
                  id: state.data.id,
                  title: state.data.title,
                  price: state.data.price,
                  thumbnail: state.data.thumbnail,
                })
              }
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
