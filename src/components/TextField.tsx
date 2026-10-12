// A labelled, controlled TextInput.
// The parent owns the state: value flows down, onChangeText flows up.
import { forwardRef } from 'react';
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  helper?: string;
};

export const TextField = forwardRef<TextInput, Props>(
  function TextField(
    { label, error, helper, style, multiline, ...inputProps },
    ref
  ) {
    const { theme } = useTheme();
    const { colors } = theme;

    return (
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="small" bold>
          {label}
        </AppText>

        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={helper}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          style={[
            styles.input,
            {
              minHeight: multiline ? 96 : theme.touch.min + 4,
              borderColor: error ? colors.danger : colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: theme.radius.m,
              paddingHorizontal: theme.spacing.m,
              paddingVertical: theme.spacing.s,
              fontSize: theme.text.body,
              fontFamily: theme.fonts.regular,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            style,
          ]}
          {...inputProps}
        />

        {error ? (
          <AppText
            variant="small"
            color={colors.danger}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : helper ? (
          <AppText variant="small" muted>
            {helper}
          </AppText>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
  },
});