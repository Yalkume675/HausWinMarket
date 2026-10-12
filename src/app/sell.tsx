// SELL AN ITEM (Lab 7)
// Controlled inputs + validation
// Camera/gallery photo (compressed)
// One-shot GPS (Balanced accuracy)
// Permission explanation with a "no" path
// SQLite-first offline queue
// Sync when online + local notification

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { PermissionExplainer } from '@/components/PermissionExplainer';
import { TextField } from '@/components/TextField';
import { addListing } from '@/db/database';
import { compressAndSavePhoto } from '@/lib/images';
import { ensureNotificationPermission } from '@/lib/notifications';
import { isOnline, syncPendingListings } from '@/lib/sync';
import { useAuth } from '@/store/auth';
import { useListings } from '@/store/listings';
import { useTheme } from '@/theme/ThemeProvider';

const CATEGORIES = [
  'groceries',
  'home-decoration',
  'furniture',
  'mens-shirts',
  'womens-bags',
  'smartphones',
];

type Place = {
  latitude: number;
  longitude: number;
  name: string | null;
};

type Errors = {
  title?: string;
  price?: string;
  photo?: string;
};

export default function SellScreen() {
  const { theme } = useTheme();
  const owner = useAuth((s) => s.user?.username ?? '');

  // Form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  // Device permissions and status
  const [cameraPerm, requestCameraPerm] =
    ImagePicker.useCameraPermissions();

  const [locationPerm, requestLocationPerm] =
    Location.useForegroundPermissions();

  const [explain, setExplain] =
    useState<'camera' | 'location' | null>(null);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] =
    useState<string | null>(null);

  // ---------- PHOTO ----------

  const handleResult = async (
    result: ImagePicker.ImagePickerResult
  ) => {
    if (result.canceled) return;

    const asset = result.assets[0];
    setPhotoBusy(true);

    try {
      const saved = await compressAndSavePhoto(
        asset.uri,
        asset.width
      );

      setPhotoUri(saved);
      setErrors((e) => ({ ...e, photo: undefined }));
    } catch {
      Alert.alert(
        'Could not use that photo',
        'Please try another one.'
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const takePhoto = async () => {
    // Explain why camera permission is needed first.
    if (!cameraPerm?.granted) {
      setExplain('camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    await handleResult(result);
  };

  const pickFromGallery = async () => {
    // The system photo picker does not require broad gallery access.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    await handleResult(result);
  };

  // ---------- LOCATION ----------

  const locate = async () => {
    if (!locationPerm?.granted) {
      setExplain('location');
      return;
    }

    setLocating(true);
    setLocationError(null);

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;
      let name: string | null = null;

      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        name =
          [addr?.city ?? addr?.district, addr?.region]
            .filter(Boolean)
            .join(', ') || null;
      } catch {
        // Coordinates can still be used without a place name.
      }

      setPlace({ latitude, longitude, name });
    } catch {
      setLocationError(
        'Could not get your location. Move outside or try again — or skip it.'
      );
    } finally {
      setLocating(false);
    }
  };

  const allowPermission = async () => {
    const which = explain;
    setExplain(null);

    if (which === 'camera') {
      const res = await requestCameraPerm();

      if (res.granted) {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        });

        await handleResult(result);
      }
    } else if (which === 'location') {
      const res = await requestLocationPerm();

      if (res.granted) {
        await locate();
      }
    }
  };

  // ---------- VALIDATION ----------

  const validate = () => {
    const next: Errors = {};

    if (title.trim().length < 3) {
      next.title =
        'Give your item a name of at least 3 letters';
    }

    const n = Number(price.replace(',', '.'));

    if (!price.trim() || !Number.isFinite(n) || n <= 0) {
      next.price = 'Enter a price in Kina, e.g. 12.50';
    }

    if (!photoUri) {
      next.photo = 'Add a photo so buyers can see your item';
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // ---------- SUBMIT ----------

  const submit = async () => {
    if (busy || !validate()) return;

    setBusy(true);

    try {
      // 1. Save locally first. This works without an internet connection.
      await addListing({
        owner,
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price.replace(',', '.')),
        photo_uri: photoUri,
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
        place_name: place?.name ?? null,
      });

      await useListings.getState().refresh(owner);

      // 2. Ask for notification permission in context.
      await ensureNotificationPermission();

      // 3. Attempt to sync. Offline listings remain queued.
      const online = await isOnline();

      syncPendingListings();

      router.back();

      Alert.alert(
        online ? 'Listing saved' : 'Saved offline',
        online
          ? 'Uploading now. We will notify you when it is live.'
          : 'No signal right now. It will upload automatically when you are back online.'
      );
    } catch {
      Alert.alert(
        'Could not save',
        'Please try again.'
      );

      setBusy(false);
    }
  };

  // ---------- PERMISSION EXPLANATION ----------

  if (explain) {
    const isCamera = explain === 'camera';
    const perm = isCamera ? cameraPerm : locationPerm;

    return (
      <View
        style={[
          styles.flex,
          {
            padding: theme.spacing.m,
            justifyContent: 'center',
          },
        ]}
      >
        <PermissionExplainer
          icon={
            isCamera
              ? 'camera-outline'
              : 'location-outline'
          }
          title={
            isCamera
              ? 'Use your camera?'
              : 'Use your location?'
          }
          reason={
            isCamera
              ? 'To photograph your product we need camera access. Photos are only used for your listing.'
              : 'We use your approximate location once, so buyers can see which town your item is in. We do not track you.'
          }
          canAskAgain={perm?.canAskAgain ?? true}
          onAllow={allowPermission}
          onCancel={() => setExplain(null)}
        />
      </View>
    );
  }

  // ---------- CATEGORY CHIP STYLE ----------

  const chip = (selected: boolean) => [
    styles.chip,
    {
      minHeight: theme.touch.min - theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.radius.pill,
      borderColor: selected
        ? theme.colors.primary
        : theme.colors.border,
      backgroundColor: selected
        ? theme.colors.primary
        : theme.colors.surface,
    },
  ];

  // ---------- FORM UI ----------

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.m,
          gap: theme.spacing.m,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}

        <View style={{ gap: theme.spacing.s }}>
          <AppText variant="small" bold>
            Photo
          </AppText>

          {photoUri ? (
            <Image
              source={photoUri}
              contentFit="cover"
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: theme.radius.m,
              }}
              accessibilityLabel="Photo of your item"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  aspectRatio: 16 / 9,
                  borderRadius: theme.radius.m,
                  borderColor: errors.photo
                    ? theme.colors.danger
                    : theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={40}
                color={theme.colors.textMuted}
              />

              <AppText muted>
                {photoBusy
                  ? 'Preparing photo…'
                  : 'No photo yet'}
              </AppText>
            </View>
          )}

          {errors.photo ? (
            <AppText
              variant="small"
              color={theme.colors.danger}
            >
              {errors.photo}
            </AppText>
          ) : null}

          <View
            style={[
              styles.row,
              { gap: theme.spacing.s },
            ]}
          >
            <View style={styles.flex}>
              <Button
                label="Take photo"
                icon="camera-outline"
                variant="secondary"
                onPress={takePhoto}
                busy={photoBusy}
              />
            </View>

            <View style={styles.flex}>
              <Button
                label="Gallery"
                icon="images-outline"
                variant="secondary"
                onPress={pickFromGallery}
                disabled={photoBusy}
              />
            </View>
          </View>
        </View>

        {/* Item name */}

        <TextField
          label="Item name"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Fresh kaukau (10 kg bag)"
          returnKeyType="next"
          error={errors.title}
        />

        {/* Price */}

        <TextField
          label="Price (K)"
          value={price}
          onChangeText={setPrice}
          placeholder="12.00"
          keyboardType="decimal-pad"
          error={errors.price}
        />

        {/* Category */}

        <View style={{ gap: theme.spacing.s }}>
          <AppText variant="small" bold>
            Category
          </AppText>

          <View
            style={[
              styles.wrap,
              { gap: theme.spacing.s },
            ]}
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: category === c,
                }}
                hitSlop={4}
                style={chip(category === c)}
              >
                <AppText
                  variant="small"
                  color={
                    category === c
                      ? theme.colors.onPrimary
                      : theme.colors.text
                  }
                >
                  {c.replace('-', ' ')}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}

        <TextField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Condition, size, where to collect…"
          multiline
        />

        {/* Optional location */}

        <View style={{ gap: theme.spacing.s }}>
          <AppText variant="small" bold>
            Location (optional)
          </AppText>

          {place ? (
            <Banner
              icon="location-outline"
              message={
                place.name ??
                `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
              }
            />
          ) : null}

          {locationError ? (
            <Banner
              icon="warning-outline"
              tone="warning"
              message={locationError}
            />
          ) : null}

          <Button
            label={
              place
                ? 'Update my location'
                : 'Add my location'
            }
            icon="navigate-outline"
            variant="secondary"
            onPress={locate}
            busy={locating}
            busyLabel="Finding you…"
          />
        </View>

        {/* Submit */}

        <Button
          label="List item"
          icon="checkmark"
          onPress={submit}
          busy={busy}
          busyLabel="Saving…"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  placeholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
