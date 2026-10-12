
// CHECKOUT — a MODAL (a task with its own start and finish).
// The delivery address arrives from the picker through the checkout store.
// The order is a POST with the bearer token; the SERVER computes the total.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { errorToFace } from '@/api/errors';
import { placeOrder } from '@/api/products';
import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { formatPrice, pluralise } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { selectCount, selectTotal, useCart } from '@/store/cart';
import { useCheckout } from '@/store/checkout';
import { useTheme } from '@/theme/ThemeProvider';

export default function CheckoutScreen() {
  const { theme } = useTheme();
  const items = useCart((s) => s.items);
  const count = useCart(selectCount);
  const total = useCart(selectTotal);
  const clearCart = useCart((s) => s.clear);
  const address = useCheckout((s) => s.address);
  const resetCheckout = useCheckout((s) => s.reset);
  const userId = useAuth((s) => s.user?.id ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy || !address || items.length === 0) return;

    setBusy(true);
    setError(null);

    try {
      const order = await placeOrder(
        userId,
        items.map((i) => ({ id: i.id, quantity: i.qty }))
      );

      clearCart();
      resetCheckout();
      router.back(); // close the modal

      Alert.alert(
        'Order placed 🎉',
        `Order #${order.id} · ${formatPrice(order.total)}\nDelivering to ${address}.`
      );
    } catch (e) {
      setError(errorToFace(e).message);
      setBusy(false);
    }
  };

  const card = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.l,
    padding: theme.spacing.m,
    gap: theme.spacing.s + theme.spacing.xs,
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.m,
          gap: theme.spacing.m,
        }}
      >
        <View style={[styles.card, card]}>
          <AppText variant="title">Order summary</AppText>

          {items.map((i) => (
            <View key={i.id} style={[styles.row, { gap: theme.spacing.s }]}>
              <AppText style={styles.flex} numberOfLines={1}>
                {i.qty} × {i.title}
              </AppText>
              <AppText>{formatPrice(i.price * i.qty)}</AppText>
            </View>
          ))}

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          <View style={[styles.row, { gap: theme.spacing.s }]}>
            <AppText bold style={styles.flex}>
              Total ({pluralise(count, 'item')})
            </AppText>
            <AppText bold>{formatPrice(total)}</AppText>
          </View>

          <AppText variant="caption" muted>
            Final price is confirmed by the server when you place the order.
          </AppText>
        </View>

        <Pressable
          onPress={() => router.push('/address')}
          accessibilityRole="button"
          accessibilityLabel={
            address
              ? `Delivery address: ${address}. Change`
              : 'Choose a delivery address'
          }
          style={({ pressed }) => [
            styles.card,
            styles.row,
            card,
            { minHeight: theme.touch.min },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name="location-outline"
            size={24}
            color={theme.colors.primary}
          />

          <View style={styles.flex}>
            <AppText variant="small" muted>
              Deliver to
            </AppText>
            <AppText bold>
              {address ?? 'Choose a delivery address'}
            </AppText>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>

        <View style={[styles.card, styles.row, card]}>
          <Ionicons
            name="cash-outline"
            size={24}
            color={theme.colors.primary}
          />
          <AppText style={styles.flex}>Cash on delivery</AppText>
        </View>

        {error ? (
          <Banner icon="alert-circle-outline" tone="danger" message={error} />
        ) : null}
      </ScrollView>

      <View
        style={{
          padding: theme.spacing.m,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Button
          label={
            address ? `Place order · ${formatPrice(total)}` : 'Choose an address first'
          }
          onPress={submit}
          busy={busy}
          busyLabel="Placing order…"
          disabled={!address || items.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
});
