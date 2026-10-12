
// ADDRESS PICKER — the "return trip" (Lecture 6).
// Screens never talk to each other; they meet in the store:
// setAddress(choice) then router.back(). Checkout re-renders via its selector.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCheckout } from '@/store/checkout';
import { useTheme } from '@/theme/ThemeProvider';

const PLACES = [
  'Unitech Campus, Lae, Morobe',
  'Eriku Market, Lae, Morobe',
  'Boroko, Port Moresby, NCD',
  'Gordons Market, Port Moresby, NCD',
  'Goroka Town, Eastern Highlands',
  'Mt Hagen Market, Western Highlands',
  'Madang Town, Madang',
  'Kokopo, East New Britain',
];

export default function AddressPicker() {
  const { theme } = useTheme();
  const current = useCheckout((s) => s.address);
  const setAddress = useCheckout((s) => s.setAddress);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const choose = (address: string) => {
    setAddress(address); // publish to the store…
    router.back(); // …and close. Checkout reads it from the store.
  };

  const submitCustom = () => {
    if (custom.trim().length < 5) {
      setError('Enter a fuller address, e.g. "Section 12, Lot 4, Taraka, Lae"');
      return;
    }

    choose(custom.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={PLACES}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />
        )}
        renderItem={({ item }) => {
          const selected = item === current;

          return (
            <Pressable
              onPress={() => choose(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.row,
                {
                  padding: theme.spacing.m,
                  gap: theme.spacing.m,
                  minHeight: theme.touch.min + theme.spacing.m,
                  backgroundColor: pressed
                    ? theme.colors.background
                    : theme.colors.surface,
                },
              ]}
            >
              <View style={styles.flex}>
                <AppText>{item}</AppText>
              </View>

              {selected ? (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              ) : null}
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View
            style={{
              padding: theme.spacing.m,
              gap: theme.spacing.m,
            }}
          >
            <AppText variant="title">Or enter your own address</AppText>

            <TextField
              label="Delivery address"
              value={custom}
              onChangeText={(v) => {
                setCustom(v);
                if (error) setError(null);
              }}
              placeholder="Section, lot, suburb, town"
              autoComplete="street-address"
              returnKeyType="done"
              onSubmitEditing={submitCustom}
              error={error ?? undefined}
            />

            <Button
              label="Use this address"
              onPress={submitCustom}
              icon="checkmark"
            />
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
});
