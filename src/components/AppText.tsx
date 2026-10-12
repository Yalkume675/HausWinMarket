
import { StyleSheet, Text, TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'h1' | 'title' | 'body' | 'small' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  bold?: boolean;
  muted?: boolean;
  color?: string;
};

export function AppText({
  variant = 'body',
  bold,
  muted,
  color,
  style,
  ...rest
}: Props) {
  const { theme } = useTheme();
  const isHeading = variant === 'h1' || variant === 'title';

  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      style={[
        styles.base,
        {
          fontSize: theme.text[variant],
          lineHeight: theme.lineHeight[variant],
          fontFamily:
            bold || isHeading
              ? theme.fonts.bold
              : theme.fonts.regular,
          color:
            color ??
            (muted ? theme.colors.textMuted : theme.colors.text),
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
