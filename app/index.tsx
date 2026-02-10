import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useGameStore } from '../src/store/gameStore';

export default function HomeScreen() {
  const router = useRouter();
  const resetGame = useGameStore((s) => s.resetGame);

  const handleNewGame = () => {
    resetGame();
    router.push('/lobby');
  };

  return (
    <View style={styles.container}>
      {/* Decorative corner diamonds */}
      <View style={styles.cornerTopLeft}>
        <MaterialCommunityIcons name="cards-diamond" size={24} color={COLORS.cardSurface} />
      </View>
      <View style={styles.cornerTopRight}>
        <MaterialCommunityIcons name="cards-diamond" size={24} color={COLORS.cardSurface} />
      </View>
      <View style={styles.cornerBottomLeft}>
        <MaterialCommunityIcons name="cards-diamond" size={24} color={COLORS.cardSurface} />
      </View>
      <View style={styles.cornerBottomRight}>
        <MaterialCommunityIcons name="cards-diamond" size={24} color={COLORS.cardSurface} />
      </View>

      {/* Title Card */}
      <View style={styles.titleCard}>
        <View style={styles.cardInnerBorder}>
          <MaterialCommunityIcons
            name="cards-diamond"
            size={32}
            color={COLORS.accentRed}
            style={styles.diamondTop}
          />
          <Text style={styles.titleLies}>LIES</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>A Game of Deception</Text>
          <MaterialCommunityIcons
            name="cards-diamond"
            size={40}
            color={COLORS.accentBlue}
            style={styles.diamondBottom}
          />
        </View>
      </View>

      {/* New Game Button */}
      <Pressable
        style={({ pressed }) => [
          styles.newGameButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleNewGame}
      >
        <MaterialCommunityIcons
          name="cards-playing-outline"
          size={28}
          color={COLORS.textDark}
          style={{ marginRight: SPACING.sm }}
        />
        <Text style={styles.buttonText}>New Game</Text>
      </Pressable>

      {/* Footer */}
      <Text style={styles.footer}>Pass & Play</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 60,
    left: 20,
    opacity: 0.4,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 60,
    right: 20,
    opacity: 0.4,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    opacity: 0.4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    opacity: 0.4,
  },
  titleCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    width: '70%',
    maxWidth: 280,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardInnerBorder: {
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    width: '100%',
  },
  diamondTop: {
    marginBottom: SPACING.sm,
  },
  titleLies: {
    fontFamily: FONTS.serif,
    fontSize: 36,
    color: COLORS.accentRed,
    letterSpacing: 8,
    lineHeight: 44,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: COLORS.accentRed,
    marginVertical: SPACING.md,
  },
  subtitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  diamondBottom: {
    marginTop: SPACING.sm,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    marginTop: SPACING.xxl,
    width: '60%',
    maxWidth: 250,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  buttonText: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    color: COLORS.textDark,
    letterSpacing: 2,
  },
  footer: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.textLight,
    opacity: 0.6,
    marginTop: SPACING.xl,
    letterSpacing: 3,
  },
});
