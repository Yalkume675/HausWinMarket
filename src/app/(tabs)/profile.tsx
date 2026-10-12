
import { Image } from 'expo-image';
import * as Network from 'expo-network';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { api } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { formatPrice } from '@/lib/format';
import { syncPendingListings } from '@/lib/sync';
import { useAuth, User } from '@/store/auth';
import { selectPendingCount, useListings } from '@/store/listings';
import { ThemeMode, useTheme } from '@/theme/ThemeProvider';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const { theme, mode, setMode } = useTheme();

  const user = useAuth((s) => s.user);
  const username = user?.username;
  const setUser = useAuth((s) => s.setUser);
  const logout = useAuth((s) => s.logout);

  const listings = useListings((s) => s.items);
  const syncing = useListings((s) => s.syncing);
  const pending = useListings(selectPendingCount);

  const network = Network.useNetworkState();
  const online =
    !!network.isConnected && network.isInternetReachable !== false;

  // Refresh the profile and listings whenever this tab receives focus.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      api
        .get('/auth/me')
        .then(({ data }) => {
          if (active && data?.id) {
            setUser({
              id: data.id,
              username: data.username,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              image: data.image,
            } as User);
          }
        })
        .catch(() => {
          // Offline: keep showing the saved profile.
        });

      if (username) {
        useListings.getState().refresh(username);
      }

      return () => {
        active = false;
      };
    }, [setUser, username])
  );

  const confirmLogout = () =>
    Alert.alert(
      'Log out?',
      'Your cart will be cleared from this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );

  const card = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.l,
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: theme.spacing.m,
        gap: theme.spacing.m,
      }}
    >
      {/* Profile header */}
      <View style={[styles.card, styles.row, card]}>
        {user?.image ? (
          <Image
            source={user.image}
            style={styles.avatar}
            accessibilityLabel="Your profile photo"
          />
        ) : null}

        <View style={styles.flex}>
          <AppText variant="title">
            {user?.firstName} {user?.lastName}
          </AppText>
          <AppText muted>@{user?.username}</AppText>
          <AppText muted variant="small">
            {user?.email}
          </AppText>
        </View>
      </View>

      {/* Appearance: System, Light or Dark */}
      <View style={[styles.card, card]}>
        <AppText variant="title">Appearance</AppText>

        <View
          accessibilityRole="radiogroup"
          style={[
            styles.row,
            {
              gap: theme.spacing.s,
              backgroundColor: theme.colors.background,
              borderRadius: theme.radius.m,
              padding: theme.spacing.xs,
            },
          ]}
        >
          {MODES.map((m) => {
            const selected = mode === m.value;

            return (
              <Pressable
                key={m.value}
                onPress={() => setMode(m.value)}
                accessibilityRole="radio"
                accessibilityLabel={`${m.label} theme`}
                accessibilityState={{ selected }}
                style={[
                  styles.segment,
                  {
                    minHeight: theme.touch.min,
                    borderRadius: theme.radius.s,
                    backgroundColor: selected
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
              >
                <AppText
                  bold={selected}
                  color={
                    selected
                      ? theme.colors.onPrimary
                      : theme.colors.text
                  }
                >
                  {m.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* My listings and offline queue */}
      <View style={[styles.card, card]}>
        <View style={styles.row}>
          <AppText variant="title" style={styles.flex}>
            My listings
          </AppText>

          <AppText
            variant="small"
            color={
              online
                ? theme.colors.success
                : theme.colors.warning
            }
          >
            ● {online ? 'Online' : 'Offline'}
          </AppText>
        </View>

        {pending > 0 ? (
          <Banner
            icon="time-outline"
            tone="warning"
            message={`${pending} waiting to upload. ${
              online
                ? 'Syncing…'
                : 'They will go live when you are back online.'
            }`}
          />
        ) : null}

        {listings.length === 0 ? (
          <AppText muted>
            You have not listed anything yet.
          </AppText>
        ) : (
          listings.map((l) => (
            <View
              key={l.local_id}
              style={[
                styles.row,
                { gap: theme.spacing.m },
              ]}
            >
              {l.photo_uri ? (
                <Image
                  source={l.photo_uri}
                  style={[
                    styles.thumb,
                    { borderRadius: theme.radius.s },
                  ]}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  style={[
                    styles.thumb,
                    {
                      borderRadius: theme.radius.s,
                      backgroundColor: theme.colors.skeleton,
                    },
                  ]}
                />
              )}

              <View style={styles.flex}>
                <AppText bold numberOfLines={1}>
                  {l.title}
                </AppText>

                <AppText muted variant="small">
                  {formatPrice(l.price)}
                  {l.place_name ? ` · ${l.place_name}` : ''}
                </AppText>
              </View>

              <AppText
                variant="small"
                bold
                color={
                  l.synced
                    ? theme.colors.success
                    : theme.colors.warning
                }
              >
                {l.synced ? 'Live' : 'Pending'}
              </AppText>
            </View>
          ))
        )}

        <Button
          label="Sell an item"
          icon="pricetag-outline"
          onPress={() => router.push('/sell')}
        />

        <Button
          label="Sync now"
          variant="secondary"
          icon="sync-outline"
          busy={syncing}
          busyLabel="Syncing…"
          disabled={!online || pending === 0}
          onPress={() => syncPendingListings()}
        />
      </View>

      <Button
        label="Log out"
        variant="danger"
        icon="log-out-outline"
        onPress={confirmLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderWidth: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  thumb: {
    width: 48,
    height: 48,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
