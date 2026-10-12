
import { isRunningInExpoGo } from 'expo';
import { Alert, Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

export const notificationsSupported = !(
  isRunningInExpoGo() && Platform.OS === 'android'
);

const CHANNEL_ID = 'listings';
let loaded: Promise<NotificationsModule> | null = null;

// Load the module once, on first use, and configure it.
function loadNotifications(): Promise<NotificationsModule> | null {
  if (!notificationsSupported) return null;

  if (!loaded) {
    loaded = import('expo-notifications').then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      return Notifications;
    });
  }

  return loaded;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();

  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Listing updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted;
}

export async function notifyListingsLive(count: number) {
  const title = 'Your listing is live 🎉';

  const body =
    count === 1
      ? 'Buyers can now see your item.'
      : `${count} items are now visible to buyers.`;

  const Notifications = await loadNotifications();

  if (!Notifications) {
    Alert.alert(title, body);
    return;
  }

  const { granted } = await Notifications.getPermissionsAsync();

  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { url: '/profile' },
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: CHANNEL_ID }
        : null,
  });
}

// Tapping a notification opens the URL in its payload.
export function addNotificationTapListener(
  onUrl: (url: string) => void
): () => void {
  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  loadNotifications()?.then((Notifications) => {
    if (cancelled) return;

    subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url;

        if (typeof url === 'string') onUrl(url);
      });
  });

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
