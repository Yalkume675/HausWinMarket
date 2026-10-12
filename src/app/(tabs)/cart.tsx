
 // CART TAB: a dumb renderer of selected store state (Lecture 6).
// List rows use the LIST ROW layout: row + alignItems center + flex:1 text.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { EmptyState } from '@/components/StateViews';
import { formatPrice, pluralise } from '@/lib/format';
import { CartItem, selectCount, selectTotal, useCart } from '@/store/cart';
import { useTheme } from '@/theme/ThemeProvider';

export default function CartScreen() {
  const { theme } = useTheme();
  const items = useCart((s) => s.items);
  const count = useCart(selectCount);
  const total = useCart(selectTotal);

  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.flex}
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => <CartRow item={item} />}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            message="Add something from the market and it will appear here."
            actionLabel="Browse products"
            onAction={() => router.navigate('/')}
          />
        }
        contentContainerStyle={
          items.length === 0 ? styles.flexGrow : undefined
        }
      />

      {items.length > 0 ? (
        <View
          style={[
            styles.summary,
            {
              padding: theme.spacing.m,
              gap: theme.spacing.m,
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.flex}>
            <AppText muted variant="small">
              {pluralise(count, 'item')}
            </AppText>
            <AppText variant="title">{formatPrice(total)}</AppText>
          </View>
          <Button
            label="Checkout"
            icon="arrow-forward"
            fullWidth={false}
            onPress={() => router.push('/checkout')}
          />
        </View>
      ) : null}
    </View>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const { theme } = useTheme();
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  return (
    <View
      style={[
        styles.row,
        {
          padding: theme.spacing.m,
          gap: theme.spacing.m,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Image
        source={item.thumbnail}
        contentFit="cover"
        style={{
          width: 64,
          aspectRatio: 1,
          borderRadius: theme.radius.s,
        }}
        accessibilityIgnoresInvertColors
      />

      <View style={[styles.flex, { gap: theme.spacing.xs }]}>
        <AppText bold numberOfLines={2}>
          {item.title}
        </AppText>
        <AppText muted variant="small">
          {formatPrice(item.price)} each
        </AppText>

        <View style={[styles.row, { gap: theme.spacing.xs }]}>
          <IconButton
            icon="remove-circle-outline"
            accessibilityLabel={`Decrease quantity of ${item.title}`}
            onPress={() => setQty(item.id, item.qty - 1)}
          />
          <AppText bold accessibilityLabel={`Quantity ${item.qty}`}>
            {item.qty}
          </AppText>
          <IconButton
            icon="add-circle-outline"
            accessibilityLabel={`Increase quantity of ${item.title}`}
            onPress={() => setQty(item.id, item.qty + 1)}
          />
        </View>
      </View>

      <IconButton
        icon="trash-outline"
        color={theme.colors.danger}
        accessibilityLabel={`Remove ${item.title} from cart`}
        onPress={() => remove(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
