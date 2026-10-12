
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Product } from '@/api/products';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/store/cart';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = { product: Product; width: number };

function ProductCardBase({ product, width }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const add = useCart((s) => s.add);

  const lowStock = product.stock > 0 && product.stock < 10;

  return (
    <Pressable
      onPress={() => router.push({ pathname: `/(tabs)/(home)/Product/[id]`, params: { id: String(product.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.price)}`}
      accessibilityHint="Opens product details"
      style={({ pressed }) => [
        styles.card,
        {
          width,
          margin: theme.spacing.s,
          borderRadius: theme.radius.m,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View>
        <Image
          source={product.thumbnail}
          contentFit="cover"
          transition={200}
          style={[
            styles.image,
            {
              borderTopLeftRadius: theme.radius.m,
              borderTopRightRadius: theme.radius.m,
            },
          ]}
          accessibilityIgnoresInvertColors
        />

        {lowStock ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.danger,
                borderRadius: theme.radius.s,
                top: theme.spacing.s,
                left: theme.spacing.s,
                paddingHorizontal: theme.spacing.s,
                paddingVertical: theme.spacing.xs / 2,
              },
            ]}
          >
            <AppText variant="caption" bold color={colors.onDanger}>
              Only {product.stock} left
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.s, gap: theme.spacing.xs }}>
        <AppText variant="small" bold numberOfLines={2}>
          {product.title}
        </AppText>

        <View style={styles.row}>
          <View style={styles.flex}>
            <AppText bold color={colors.primary}>
              {formatPrice(product.price)}
            </AppText>
            <AppText variant="caption" muted>
              ★ {product.rating.toFixed(1)}
            </AppText>
          </View>

          <IconButton
            icon="add"
            filled
            accessibilityLabel={`Add ${product.title} to cart`}
            accessibilityHint="Adds one item"
            onPress={() =>
              add({
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
              })
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1 },
  badge: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});

