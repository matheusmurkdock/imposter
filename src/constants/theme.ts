export const COLORS = {
  // Backgrounds
  primaryBg: '#B23A3A',       // Muted Vintage Red
  cardSurface: '#FDF5E6',     // Old Lace / Cream
  darkOverlay: 'rgba(0,0,0,0.5)',

  // Text
  textDark: '#2C3E50',        // Dark Blue/Grey (on cards)
  textLight: '#FFFFFF',       // On red background
  textMuted: '#7F8C8D',       // Subtle text

  // Accents
  accentRed: '#D32F2F',       // Diamond red
  accentBlue: '#1976D2',      // Diamond blue
  accentGold: '#C9A84C',      // Gold highlights

  // Roles
  civilianGreen: '#27AE60',
  undercoverOrange: '#E67E22',
  mrWhiteBlack: '#1C1C1C',

  // UI
  danger: '#E74C3C',
  success: '#2ECC71',
  disabled: '#BDC3C7',
} as const;

export const FONTS = {
  serif: 'PlayfairDisplay_700Bold',
  serifRegular: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  serifBoldItalic: 'PlayfairDisplay_700Bold_Italic',
  system: 'System', // System font for labels
  systemBold: 'System', // System font bold weight
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  card: 12,
} as const;
