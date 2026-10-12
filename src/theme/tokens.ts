
// Design tokens (Lecture 5): one file defines the design language.
const lightColors = {
  primary: '#0B7A94',
  onPrimary: '#FFFFFF',
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#556275',
  border: '#DDE3EC',
  danger: '#B4443C',
  onDanger: '#FFFFFF',
  success: '#2E7D4F',
  warning: '#8A5A00',
  skeleton: '#E3E8EF',
};

const darkColors: typeof lightColors = {
  primary: '#4CC3E0',
  onPrimary: '#0B1220',
  background: '#0E1424',
  surface: '#141B2E',
  surfaceRaised: '#1C2540',
  text: '#E6ECF5',
  textMuted: '#9AA8BF',
  border: '#2A3550',
  danger: '#F08A80',
  onDanger: '#0B1220',
  success: '#6FCF97',
  warning: '#E3B341',
  skeleton: '#1F2944',
};

// Consistent spacing and rounded corners.
const spacing = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
const radius = { s: 6, m: 12, l: 20, pill: 999 } as const;

// Typography scale.
const text = { caption: 12, small: 14, body: 16, title: 22, h1: 28 } as const;
const lineHeight = { caption: 16, small: 20, body: 22, title: 28, h1: 34 } as const;

// Inter font family.
const fonts = {
  regular: 'Inter_400Regular',
  bold: 'Inter_700Bold',
} as const;

// Minimum touch target.
const touch = { min: 44 } as const;

export type ColorTokens = typeof lightColors;
export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  text: typeof text;
  lineHeight: typeof lineHeight;
  fonts: typeof fonts;
  touch: typeof touch;
};

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    text,
    lineHeight,
    fonts,
    touch,
  };
}
