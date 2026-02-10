import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useGameStore } from '../src/store/gameStore';

export default function LobbyScreen() {
  const router = useRouter();
  const { settings, updateSettings, setPhase } = useGameStore();

  const minPlayers = 3;
  const maxPlayers = 10;

  const maxImposters = Math.max(0, settings.playerCount - 2);

  const adjustPlayerCount = (delta: number) => {
    const newCount = Math.min(maxPlayers, Math.max(minPlayers, settings.playerCount + delta));
    const totalImposters = settings.undercoverCount + settings.mrWhiteCount;
    // Ensure we don't have more imposters than allowed
    if (totalImposters >= newCount - 1) {
      const excess = totalImposters - (newCount - 2);
      const newUc = Math.max(0, settings.undercoverCount - Math.ceil(excess / 2));
      const newMw = Math.max(0, settings.mrWhiteCount - Math.floor(excess / 2));
      updateSettings({ playerCount: newCount, undercoverCount: newUc, mrWhiteCount: newMw });
    } else {
      updateSettings({ playerCount: newCount });
    }
  };

  const adjustUndercoverCount = (delta: number) => {
    const newCount = Math.min(
      maxImposters - settings.mrWhiteCount,
      Math.max(0, settings.undercoverCount + delta)
    );
    updateSettings({ undercoverCount: newCount });
  };

  const adjustMrWhiteCount = (delta: number) => {
    const newCount = Math.min(
      maxImposters - settings.undercoverCount,
      Math.max(0, settings.mrWhiteCount + delta)
    );
    updateSettings({ mrWhiteCount: newCount });
  };

  const civilianCount =
    settings.playerCount - settings.undercoverCount - settings.mrWhiteCount;

  const canStart =
    settings.playerCount >= minPlayers &&
    civilianCount >= 2 &&
    (settings.undercoverCount > 0 || settings.mrWhiteCount > 0);

  const handleStart = () => {
    setPhase('registration');
    router.push('/register');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.textLight}
          />
        </Pressable>
        <Text style={styles.title}>GAME SETUP</Text>
      </View>

      {/* Settings Card */}
      <View style={styles.card}>
        {/* Player Count */}
        <CounterRow
          label="Players"
          value={settings.playerCount}
          onDecrement={() => adjustPlayerCount(-1)}
          onIncrement={() => adjustPlayerCount(1)}
          min={minPlayers}
          max={maxPlayers}
          icon="account-group"
        />

        <View style={styles.separator} />

        {/* Undercover Count */}
        <CounterRow
          label="Undercover"
          value={settings.undercoverCount}
          onDecrement={() => adjustUndercoverCount(-1)}
          onIncrement={() => adjustUndercoverCount(1)}
          min={0}
          max={maxImposters - settings.mrWhiteCount}
          icon="eye-off"
          accentColor={COLORS.undercoverOrange}
        />

        <View style={styles.separator} />

        {/* Mr. White Count */}
        <CounterRow
          label="Mr. White"
          value={settings.mrWhiteCount}
          onDecrement={() => adjustMrWhiteCount(-1)}
          onIncrement={() => adjustMrWhiteCount(1)}
          min={0}
          max={maxImposters - settings.undercoverCount}
          icon="ghost"
          accentColor={COLORS.mrWhiteBlack}
        />

        <View style={styles.separator} />

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.roleChip}>
            <MaterialCommunityIcons
              name="shield-account"
              size={16}
              color={COLORS.civilianGreen}
            />
            <Text style={styles.roleChipText}>{civilianCount} Crew</Text>
          </View>
          {settings.undercoverCount > 0 && (
            <View style={styles.roleChip}>
              <MaterialCommunityIcons
                name="eye-off"
                size={16}
                color={COLORS.undercoverOrange}
              />
              <Text style={styles.roleChipText}>
                {settings.undercoverCount} Undercover
              </Text>
            </View>
          )}
          {settings.mrWhiteCount > 0 && (
            <View style={styles.roleChip}>
              <MaterialCommunityIcons
                name="ghost"
                size={16}
                color={COLORS.mrWhiteBlack}
              />
              <Text style={styles.roleChipText}>
                {settings.mrWhiteCount} Mr. White
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Start Button */}
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          !canStart && styles.startButtonDisabled,
          pressed && canStart && styles.buttonPressed,
        ]}
        onPress={handleStart}
        disabled={!canStart}
      >
        <MaterialCommunityIcons
          name="cards-playing"
          size={24}
          color={canStart ? COLORS.textDark : COLORS.textMuted}
        />
        <Text
          style={[
            styles.startButtonText,
            !canStart && styles.startButtonTextDisabled,
          ]}
        >
          Deal Cards
        </Text>
      </Pressable>

      {!canStart && (
        <Text style={styles.warningText}>
          Need at least 1 imposter and 2 crew members
        </Text>
      )}
    </ScrollView>
  );
}

interface CounterRowProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
  max: number;
  icon: string;
  accentColor?: string;
}

function CounterRow({
  label,
  value,
  onDecrement,
  onIncrement,
  min,
  max,
  icon,
  accentColor,
}: CounterRowProps) {
  return (
    <View style={styles.counterRow}>
      <View style={styles.counterLabel}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={accentColor || COLORS.textDark}
        />
        <Text style={styles.counterLabelText}>{label}</Text>
      </View>
      <View style={styles.counterControls}>
        <Pressable
          onPress={onDecrement}
          style={[
            styles.counterButton,
            value <= min && styles.counterButtonDisabled,
          ]}
          disabled={value <= min}
        >
          <MaterialCommunityIcons
            name="minus"
            size={20}
            color={value <= min ? COLORS.disabled : COLORS.textDark}
          />
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable
          onPress={onIncrement}
          style={[
            styles.counterButton,
            value >= max && styles.counterButtonDisabled,
          ]}
          disabled={value >= max}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={value >= max ? COLORS.disabled : COLORS.textDark}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textLight,
    letterSpacing: 4,
  },
  card: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  counterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  counterLabelText: {
    fontFamily: FONTS.system,
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.textDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    borderColor: COLORS.disabled,
  },
  counterValue: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    color: COLORS.textDark,
    minWidth: 30,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.disabled,
    marginVertical: SPACING.sm,
    opacity: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    justifyContent: 'center',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleChipText: {
    fontFamily: FONTS.serifRegular,
    fontSize: 12,
    color: COLORS.textDark,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  startButtonText: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    color: COLORS.textDark,
    letterSpacing: 2,
  },
  startButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  warningText: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.textLight,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
