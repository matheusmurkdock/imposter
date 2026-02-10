import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useGameStore } from '../src/store/gameStore';
import { AVATAR_ICONS } from '../src/constants/avatars';

// Phase 1: Collect names/avatars. Phase 2: Reveal roles one by one.
type ScreenPhase = 'collect' | 'reveal';

export default function RegisterScreen() {
  const router = useRouter();
  const {
    settings,
    players,
    registerPlayer,
    registerLastPlayerAndInitialize,
    finishRegistration,
  } = useGameStore();

  const [screenPhase, setScreenPhase] = useState<ScreenPhase>('collect');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Reveal phase state
  const [revealIndex, setRevealIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const flipProgress = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg`,
      },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg`,
      },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  const currentRegistrationIndex = players.length;
  const totalPlayers = settings.playerCount;
  const isLastRegistration = currentRegistrationIndex >= totalPlayers - 1;

  const usedAvatars = players.map((p) => p.avatarIcon);
  const availableAvatars = AVATAR_ICONS.filter(
    (icon) => !usedAvatars.includes(icon)
  );

  const handleConfirmPlayer = () => {
    if (!name.trim() || !selectedAvatar) return;
    
    if (isLastRegistration) {
      // Use atomic action to register last player and initialize roles in one update
      registerLastPlayerAndInitialize(name.trim(), selectedAvatar);
      setScreenPhase('reveal');
      setRevealIndex(0);
      setIsCardFlipped(false);
      flipProgress.value = 0;
    } else {
      registerPlayer(name.trim(), selectedAvatar);
      setName('');
      setSelectedAvatar(null);
    }
  };

  const handleFlipCard = () => {
    if (isCardFlipped) return;
    flipProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    });
    setIsCardFlipped(true);
  };

  const handleNextReveal = () => {
    if (revealIndex >= players.length - 1) {
      // All players have seen their cards
      finishRegistration();
      router.replace('/game');
      return;
    }

    // Reset card and move to next player
    flipProgress.value = withTiming(0, { duration: 0 });
    setIsCardFlipped(false);
    setRevealIndex((prev) => prev + 1);
  };

  // ---- REVEAL PHASE ----
  if (screenPhase === 'reveal') {
    const currentPlayer = players[revealIndex];
    if (!currentPlayer) return null;

    const isLastReveal = revealIndex >= players.length - 1;

    const getRoleInfo = () => {
      switch (currentPlayer.role) {
        case 'civilian':
          return {
            label: 'CIVILIAN',
            icon: 'shield-account' as const,
            color: COLORS.civilianGreen,
            word: currentPlayer.word || '',
          };
        case 'undercover':
          return {
            label: 'UNDERCOVER',
            icon: 'eye-off' as const,
            color: COLORS.undercoverOrange,
            word: currentPlayer.word || '',
          };
        case 'mr_white':
          return {
            label: 'MR. WHITE',
            icon: 'ghost' as const,
            color: COLORS.mrWhiteBlack,
            word: 'You have no word',
          };
      }
    };

    const roleInfo = getRoleInfo();

    return (
      <View style={styles.container}>
        <Text style={styles.passPhoneTitle}>
          Pass the phone to
        </Text>
        <Text style={styles.passPhoneName}>{currentPlayer.name}</Text>
        <Text style={styles.passPhoneSubtitle}>
          Player {revealIndex + 1} of {players.length}
        </Text>

        {/* Flip Card */}
        <Pressable onPress={handleFlipCard} style={styles.cardContainer}>
          {/* Front of card - decorative pattern */}
          <Animated.View
            style={[styles.card, styles.cardFront, frontAnimatedStyle]}
          >
            <View style={[styles.cardInnerBorder, { borderColor: COLORS.accentRed }]}>
              <MaterialCommunityIcons
                name="cards-diamond"
                size={28}
                color={COLORS.accentRed}
              />
              <View style={styles.cardPatternGrid}>
                {[...Array(9)].map((_, i) => (
                  <MaterialCommunityIcons
                    key={i}
                    name="cards-diamond"
                    size={24}
                    color={i % 2 === 0 ? COLORS.accentRed : COLORS.accentBlue}
                    style={{ opacity: 0.7 }}
                  />
                ))}
              </View>
              <Text style={styles.tapToReveal}>TAP TO REVEAL</Text>
              <MaterialCommunityIcons
                name="cards-diamond"
                size={28}
                color={COLORS.accentBlue}
              />
            </View>
          </Animated.View>

          {/* Back of card - role reveal */}
          <Animated.View
            style={[styles.card, styles.cardBack, backAnimatedStyle]}
          >
            <View style={[styles.cardInnerBorder, { borderColor: roleInfo.color }]}>
              <MaterialCommunityIcons
                name={roleInfo.icon}
                size={48}
                color={roleInfo.color}
              />
              <Text style={[styles.roleLabel, { color: roleInfo.color }]}>
                {roleInfo.label}
              </Text>
              <View style={styles.wordDivider} />
              <Text style={styles.wordLabel}>Your Word</Text>
              <Text style={[styles.wordText, currentPlayer.role === 'mr_white' && styles.wordTextMrWhite]}>
                {roleInfo.word}
              </Text>
              <View style={styles.wordDivider} />
              <Text style={styles.secretHint}>
                {currentPlayer.role === 'mr_white'
                  ? 'Blend in. If caught, guess the word to win!'
                  : 'Remember this word. Keep it secret!'}
              </Text>
            </View>
          </Animated.View>
        </Pressable>

        {/* Next Button - only visible after flip */}
        {isCardFlipped && (
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNextReveal}
          >
            <Text style={styles.nextButtonText}>
              {isLastReveal ? 'Start Game' : 'Pass to Next Player'}
            </Text>
            <MaterialCommunityIcons
              name={isLastReveal ? 'play' : 'arrow-right'}
              size={20}
              color={COLORS.textDark}
            />
          </Pressable>
        )}
      </View>
    );
  }

  // ---- COLLECTION PHASE ----
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.progressText}>
        Player {currentRegistrationIndex + 1} of {totalPlayers}
      </Text>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>YOUR NAME</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.disabled}
          maxLength={15}
          autoFocus
        />

        <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>
          CHOOSE YOUR AVATAR
        </Text>
        <View style={styles.avatarGrid}>
          {availableAvatars.map((icon) => (
            <Pressable
              key={icon}
              style={[
                styles.avatarItem,
                selectedAvatar === icon && styles.avatarItemSelected,
              ]}
              onPress={() => setSelectedAvatar(icon)}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={32}
                color={
                  selectedAvatar === icon ? COLORS.accentRed : COLORS.textDark
                }
              />
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.confirmButton,
          (!name.trim() || !selectedAvatar) && styles.confirmButtonDisabled,
          pressed && name.trim() && selectedAvatar && styles.buttonPressed,
        ]}
        onPress={handleConfirmPlayer}
        disabled={!name.trim() || !selectedAvatar}
      >
        <Text style={styles.confirmButtonText}>
          {isLastRegistration ? 'Confirm & Deal Cards' : 'Confirm'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.textLight,
    letterSpacing: 3,
    marginBottom: SPACING.xl,
    opacity: 0.8,
  },
  inputCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  inputLabel: {
    fontFamily: FONTS.system,
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nameInput: {
    fontFamily: FONTS.serifRegular,
    fontSize: 24,
    color: COLORS.textDark,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accentRed,
    paddingVertical: SPACING.sm,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  avatarItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  avatarItemSelected: {
    borderColor: COLORS.accentRed,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  confirmButton: {
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    marginTop: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: COLORS.textDark,
    letterSpacing: 2,
    textAlign: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  // Reveal phase
  passPhoneTitle: {
    fontFamily: FONTS.serifItalic,
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 80,
    opacity: 0.7,
  },
  passPhoneName: {
    fontFamily: FONTS.serif,
    fontSize: 32,
    color: COLORS.textLight,
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: SPACING.xs,
  },
  passPhoneSubtitle: {
    fontFamily: FONTS.serifRegular,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    opacity: 0.6,
  },
  cardContainer: {
    width: 260,
    height: 380,
    alignSelf: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardFront: {
    zIndex: 1,
  },
  cardBack: {
    zIndex: 0,
  },
  cardInnerBorder: {
    flex: 1,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  cardPatternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 100,
    gap: 6,
    marginVertical: SPACING.lg,
  },
  tapToReveal: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 3,
    marginTop: SPACING.md,
  },
  roleLabel: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    letterSpacing: 4,
    marginTop: SPACING.md,
  },
  wordDivider: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.disabled,
    marginVertical: SPACING.md,
  },
  wordLabel: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  wordText: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  wordTextMrWhite: {
    fontSize: 18,
    fontFamily: FONTS.serifItalic,
    color: COLORS.textMuted,
  },
  secretHint: {
    fontFamily: FONTS.serifItalic,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    alignSelf: 'center',
    marginTop: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.textDark,
    letterSpacing: 1,
  },
});
