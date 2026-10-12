
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorToFace } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';

export default function LoginScreen() {
  const { theme } = useTheme();
  const login = useAuth((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // Validate on SUBMIT (not every keystroke): specific, polite, next to the field.
  const validate = () => {
    const next: typeof errors = {};
    if (!username.trim()) next.username = 'Enter your username, e.g. emilys';
    if (password.length < 4)
      next.password = 'Your password must be at least 4 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (busy || !validate()) return;
    setBusy(true); // disable the button: no double-submits
    setServerError(null);
    try {
      await login(username.trim(), password);
    } catch (error) {
      const face = errorToFace(error);
      setServerError(
        face.kind === 'client'
          ? 'Wrong username or password.'
          : face.message
      );
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.grow,
            {
              padding: theme.spacing.l,
              gap: theme.spacing.l,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.center,
              {
                gap: theme.spacing.s,
                marginTop: theme.spacing.xl,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={56}
              color={theme.colors.primary}
            />
            <AppText variant="h1">Haus Win Market</AppText>
            <AppText muted style={styles.textCenter}>
              Buy and sell fresh produce and goods near you.
            </AppText>
          </View>

          {serverError ? (
            <Banner
              icon="alert-circle-outline"
              tone="danger"
              message={serverError}
            />
          ) : null}

          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="emilys"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.username}
          />

          <TextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            error={errors.password}
          />

          <Button
            label="Log in"
            icon="log-in-outline"
            onPress={submit}
            busy={busy}
            busyLabel="Logging in…"
          />

          <View style={{ gap: theme.spacing.s }}>
            <AppText muted variant="small" style={styles.textCenter}>
              Demo account (from the dummyjson.com test API): emilys / emilyspass
            </AppText>
            <Button
              label="Use demo account"
              variant="secondary"
              onPress={() => {
                setUsername('emilys');
                setPassword('emilyspass');
                setErrors({});
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1, justifyContent: 'center' },
  center: { alignItems: 'center' },
  textCenter: { textAlign: 'center' },
});
