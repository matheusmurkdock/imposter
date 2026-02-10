import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useGameStore } from '../src/store/gameStore';
import type { Player } from '../src/types/game';

export default function GameScreen() {
  const router = useRouter();
  const {
    phase,
    players,
    votes,
    eliminatedPlayerId,
    gameResult,
    currentWordPair,
    setPhase,
    castVote,
    tallyVotes,
    eliminatePlayer,
    checkWinCondition,
    handleMrWhiteGuess,
    startNewRound,
    resetGame,
  } = useGameStore();

  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [showMrWhiteGuess, setShowMrWhiteGuess] = useState(false);
  const [mrWhiteGuessText, setMrWhiteGuessText] = useState('');

  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);
  const eliminatedPlayer = players.find((p) => p.id === eliminatedPlayerId);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'civilian':
        return 'shield-account';
      case 'undercover':
        return 'eye-off';
      case 'mr_white':
        return 'ghost';
      default:
        return 'account';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'civilian':
        return COLORS.civilianGreen;
      case 'undercover':
        return COLORS.undercoverOrange;
      case 'mr_white':
        return COLORS.mrWhiteBlack;
      default:
        return COLORS.textDark;
    }
  };

  // ---- VOTING LOGIC ----
  const handleStartVoting = () => {
    setPhase('voting');
    setShowVotingModal(true);
    setCurrentVoterIndex(0);
    setSelectedTarget(null);
  };

  const handleConfirmVote = () => {
    if (!selectedTarget) return;
    const voter = alivePlayers[currentVoterIndex];
    if (!voter) return;

    castVote(voter.id, selectedTarget);

    if (currentVoterIndex >= alivePlayers.length - 1) {
      // All votes cast, tally
      setShowVotingModal(false);
      setTimeout(() => {
        const eliminatedId = tallyVotes();
        if (eliminatedId) {
          eliminatePlayer(eliminatedId);
        }
      }, 100);
    } else {
      setCurrentVoterIndex((prev) => prev + 1);
      setSelectedTarget(null);
    }
  };

  // ---- ELIMINATION PHASE ----
  const handleAfterElimination = () => {
    const result = checkWinCondition();
    if (!result) {
      startNewRound();
    }
    // If there's a result, the store sets phase to game_over
  };

  // ---- MR. WHITE GUESS ----
  const handleMrWhiteGuessSubmit = () => {
    const isCorrect = handleMrWhiteGuess(mrWhiteGuessText);
    if (!isCorrect) {
      // Mr. White failed - check if game continues or crew wins
      setShowMrWhiteGuess(false);
      setMrWhiteGuessText('');
      const result = checkWinCondition();
      if (!result) {
        startNewRound();
      }
    }
    // If correct, store sets phase to game_over automatically
    setShowMrWhiteGuess(false);
    setMrWhiteGuessText('');
  };

  const handlePlayAgain = () => {
    resetGame();
    router.replace('/');
  };

  // ---- GAME OVER ----
  if (phase === 'game_over' && gameResult) {
    const winnerIcon =
      gameResult.winner === 'crew'
        ? 'shield-check'
        : gameResult.winner === 'mr_white'
        ? 'ghost'
        : 'eye-off';
    const winnerColor =
      gameResult.winner === 'crew'
        ? COLORS.civilianGreen
        : gameResult.winner === 'mr_white'
        ? COLORS.mrWhiteBlack
        : COLORS.undercoverOrange;
    const winnerLabel =
      gameResult.winner === 'crew'
        ? 'CREW WINS'
        : gameResult.winner === 'mr_white'
        ? 'MR. WHITE WINS'
        : 'IMPOSTERS WIN';

    return (
      <View style={styles.container}>
        <View style={styles.gameOverCard}>
          <View style={[styles.gameOverBorder, { borderColor: winnerColor }]}>
            <MaterialCommunityIcons
              name={winnerIcon as any}
              size={64}
              color={winnerColor}
            />
            <Text style={[styles.gameOverTitle, { color: winnerColor }]}>
              {winnerLabel}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.gameOverReason}>{gameResult.reason}</Text>

            {currentWordPair && (
              <View style={styles.wordRevealSection}>
                <Text style={styles.wordRevealLabel}>The words were:</Text>
                <Text style={styles.wordRevealCivilian}>
                  Civilian: {currentWordPair.civilian}
                </Text>
                <Text style={styles.wordRevealUndercover}>
                  Undercover: {currentWordPair.undercover}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Player Roles Reveal */}
            <Text style={styles.revealSectionTitle}>PLAYERS</Text>
            {players.map((player) => (
              <View key={player.id} style={styles.revealPlayerRow}>
                <MaterialCommunityIcons
                  name={player.avatarIcon as any}
                  size={24}
                  color={getRoleColor(player.role)}
                />
                <Text style={styles.revealPlayerName}>{player.name}</Text>
                <Text style={[styles.revealPlayerRole, { color: getRoleColor(player.role) }]}>
                  {player.role === 'mr_white' ? 'Mr. White' : player.role === 'undercover' ? 'Undercover' : 'Civilian'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.playAgainButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePlayAgain}
        >
          <MaterialCommunityIcons
            name="restart"
            size={22}
            color={COLORS.textDark}
          />
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
      </View>
    );
  }

  // ---- MR. WHITE GUESS PHASE ----
  if (phase === 'mr_white_guess' && eliminatedPlayer) {
    return (
      <View style={styles.container}>
        <View style={styles.mrWhiteGuessCard}>
          <View style={styles.mrWhiteGuessBorder}>
            <MaterialCommunityIcons
              name="ghost"
              size={56}
              color={COLORS.mrWhiteBlack}
            />
            <Text style={styles.mrWhiteGuessTitle}>MR. WHITE'S LAST CHANCE</Text>
            <View style={styles.divider} />
            <Text style={styles.mrWhiteGuessSubtitle}>
              {eliminatedPlayer.name} was Mr. White!
            </Text>
            <Text style={styles.mrWhiteGuessHint}>
              Guess the Civilian word to steal the win:
            </Text>

            <TextInput
              style={styles.guessInput}
              value={mrWhiteGuessText}
              onChangeText={setMrWhiteGuessText}
              placeholder="Enter your guess..."
              placeholderTextColor={COLORS.disabled}
              autoFocus
              autoCapitalize="words"
            />

            <View style={styles.guessButtonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.guessSubmitButton,
                  !mrWhiteGuessText.trim() && styles.guessSubmitDisabled,
                  pressed && mrWhiteGuessText.trim() && styles.buttonPressed,
                ]}
                onPress={handleMrWhiteGuessSubmit}
                disabled={!mrWhiteGuessText.trim()}
              >
                <Text style={styles.guessSubmitText}>Submit Guess</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.skipGuessButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setShowMrWhiteGuess(false);
                  setMrWhiteGuessText('');
                  const result = checkWinCondition();
                  if (!result) {
                    startNewRound();
                  }
                }}
              >
                <Text style={styles.skipGuessText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ---- ELIMINATION REVEAL ----
  if (phase === 'elimination' && eliminatedPlayer) {
    return (
      <View style={styles.container}>
        <View style={styles.eliminationCard}>
          <View style={[styles.eliminationBorder, { borderColor: getRoleColor(eliminatedPlayer.role) }]}>
            <MaterialCommunityIcons
              name={eliminatedPlayer.avatarIcon as any}
              size={64}
              color={getRoleColor(eliminatedPlayer.role)}
            />
            <Text style={styles.eliminatedName}>{eliminatedPlayer.name}</Text>
            <Text style={styles.eliminatedVerb}>has been eliminated!</Text>
            <View style={styles.divider} />
            <MaterialCommunityIcons
              name={getRoleIcon(eliminatedPlayer.role) as any}
              size={36}
              color={getRoleColor(eliminatedPlayer.role)}
            />
            <Text style={[styles.eliminatedRole, { color: getRoleColor(eliminatedPlayer.role) }]}>
              {eliminatedPlayer.role === 'mr_white'
                ? 'Mr. White'
                : eliminatedPlayer.role === 'undercover'
                ? 'Undercover'
                : 'Civilian'}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleAfterElimination}
        >
          <Text style={styles.continueText}>Continue</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={COLORS.textDark}
          />
        </Pressable>
      </View>
    );
  }

  // ---- MAIN GAME BOARD (Discussion Phase) ----
  
  // Safety check: ensure we have players loaded
  if (!players || players.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color={COLORS.accentRed}
          />
          <Text style={styles.errorText}>No players found</Text>
          <Pressable
            style={styles.errorButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.errorButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.boardContent}>
        {/* Header */}
        <View style={styles.boardHeader}>
          <Text style={styles.boardTitle}>DISCUSSION</Text>
          <Text style={styles.roundInfo}>
            {alivePlayers.length} players remaining
          </Text>
        </View>

        {/* Alive Players */}
        <View style={styles.playersGrid}>
          {alivePlayers.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.cardInnerBorder}>
                <MaterialCommunityIcons
                  name="cards-diamond"
                  size={20}
                  color={COLORS.accentRed}
                  style={styles.cardTopDiamond}
                />
                <View style={styles.cardPatternGrid}>
                  {[...Array(6)].map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name="cards-diamond"
                      size={16}
                      color={i % 2 === 0 ? COLORS.accentRed : COLORS.accentBlue}
                      style={{ opacity: 0.7 }}
                    />
                  ))}
                </View>
                <Text style={styles.playerName}>{player.name}</Text>
                <MaterialCommunityIcons
                  name="cards-diamond"
                  size={20}
                  color={COLORS.accentBlue}
                  style={styles.cardBottomDiamond}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Dead Players */}
        {deadPlayers.length > 0 && (
          <>
            <Text style={styles.eliminatedSectionTitle}>ELIMINATED</Text>
            <View style={styles.deadPlayersRow}>
              {deadPlayers.map((player) => (
                <View key={player.id} style={styles.deadPlayerChip}>
                  <MaterialCommunityIcons
                    name={player.avatarIcon as any}
                    size={20}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.deadPlayerName}>{player.name}</Text>
                  <MaterialCommunityIcons
                    name={getRoleIcon(player.role) as any}
                    size={14}
                    color={getRoleColor(player.role)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Vote Button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.voteButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStartVoting}
        >
          <MaterialCommunityIcons
            name="vote"
            size={24}
            color={COLORS.textLight}
          />
          <Text style={styles.voteButtonText}>START VOTE</Text>
        </Pressable>
      </View>

      {/* Voting Modal */}
      <Modal
        visible={showVotingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVotingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.votingCard}>
            <Text style={styles.votingTitle}>VOTE</Text>
            <Text style={styles.voterName}>
              {alivePlayers[currentVoterIndex]?.name}'s turn to vote
            </Text>
            <Text style={styles.voterProgress}>
              Vote {currentVoterIndex + 1} of {alivePlayers.length}
            </Text>

            <ScrollView style={styles.candidateList}>
              {alivePlayers
                .filter((p) => p.id !== alivePlayers[currentVoterIndex]?.id)
                .map((candidate) => (
                  <Pressable
                    key={candidate.id}
                    style={[
                      styles.candidateRow,
                      selectedTarget === candidate.id &&
                        styles.candidateRowSelected,
                    ]}
                    onPress={() => setSelectedTarget(candidate.id)}
                  >
                    <MaterialCommunityIcons
                      name={candidate.avatarIcon as any}
                      size={28}
                      color={
                        selectedTarget === candidate.id
                          ? COLORS.accentRed
                          : COLORS.textDark
                      }
                    />
                    <Text
                      style={[
                        styles.candidateName,
                        selectedTarget === candidate.id &&
                          styles.candidateNameSelected,
                      ]}
                    >
                      {candidate.name}
                    </Text>
                    {selectedTarget === candidate.id && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={COLORS.accentRed}
                      />
                    )}
                  </Pressable>
                ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.confirmVoteButton,
                !selectedTarget && styles.confirmVoteDisabled,
                pressed && selectedTarget && styles.buttonPressed,
              ]}
              onPress={handleConfirmVote}
              disabled={!selectedTarget}
            >
              <Text style={styles.confirmVoteText}>Confirm Vote</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  boardContent: {
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 120,
  },
  boardHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  boardTitle: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textLight,
    letterSpacing: 6,
  },
  roundInfo: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    color: COLORS.textLight,
    opacity: 0.7,
    marginTop: SPACING.xs,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  playerCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.sm,
    width: 110,
    height: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ rotate: '-2deg' }],
  },
  cardInnerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  cardTopDiamond: {
    marginBottom: SPACING.xs,
  },
  cardBottomDiamond: {
    marginTop: SPACING.xs,
  },
  cardPatternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 60,
    gap: 4,
    marginVertical: SPACING.sm,
  },
  playerName: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: SPACING.xs,
  },
  eliminatedSectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    color: COLORS.textLight,
    letterSpacing: 3,
    opacity: 0.6,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  deadPlayersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  deadPlayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  deadPlayerName: {
    fontFamily: FONTS.serifRegular,
    fontSize: 12,
    color: COLORS.textLight,
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: 40,
    backgroundColor: 'rgba(178, 58, 58, 0.95)',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentRed,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voteButtonText: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: COLORS.textLight,
    letterSpacing: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },

  // Voting Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.darkOverlay,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  votingCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  votingTitle: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: 6,
  },
  voterName: {
    fontFamily: FONTS.serifRegular,
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  voterProgress: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  candidateList: {
    maxHeight: 300,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  candidateRowSelected: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  candidateName: {
    fontFamily: FONTS.serifRegular,
    fontSize: 18,
    color: COLORS.textDark,
    flex: 1,
  },
  candidateNameSelected: {
    fontFamily: FONTS.serif,
    color: COLORS.accentRed,
  },
  confirmVoteButton: {
    backgroundColor: COLORS.accentRed,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  confirmVoteDisabled: {
    opacity: 0.5,
  },
  confirmVoteText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.textLight,
    letterSpacing: 2,
  },

  // Elimination Reveal
  eliminationCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  eliminationBorder: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 3,
    padding: SPACING.xl,
    alignItems: 'center',
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  eliminatedName: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textDark,
    marginTop: SPACING.md,
    letterSpacing: 2,
  },
  eliminatedVerb: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  eliminatedRole: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    letterSpacing: 3,
    marginTop: SPACING.sm,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.disabled,
    marginVertical: SPACING.lg,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    alignSelf: 'center',
    marginBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.textDark,
    letterSpacing: 2,
  },

  // Mr. White Guess
  mrWhiteGuessCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  mrWhiteGuessBorder: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 3,
    borderColor: COLORS.mrWhiteBlack,
    padding: SPACING.xl,
    alignItems: 'center',
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  mrWhiteGuessTitle: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.mrWhiteBlack,
    letterSpacing: 3,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  mrWhiteGuessSubtitle: {
    fontFamily: FONTS.serifRegular,
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  mrWhiteGuessHint: {
    fontFamily: FONTS.serifItalic,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  guessInput: {
    fontFamily: FONTS.serifRegular,
    fontSize: 22,
    color: COLORS.textDark,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.mrWhiteBlack,
    paddingVertical: SPACING.sm,
    textAlign: 'center',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  guessButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  guessSubmitButton: {
    backgroundColor: COLORS.accentRed,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
  },
  guessSubmitDisabled: {
    opacity: 0.5,
  },
  guessSubmitText: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  skipGuessButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.disabled,
  },
  skipGuessText: {
    fontFamily: FONTS.serifRegular,
    fontSize: 16,
    color: COLORS.textMuted,
  },

  // Game Over
  gameOverCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  gameOverBorder: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 3,
    padding: SPACING.xl,
    alignItems: 'center',
    width: 300,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gameOverTitle: {
    fontFamily: FONTS.serif,
    fontSize: 26,
    letterSpacing: 4,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  gameOverReason: {
    fontFamily: FONTS.serifItalic,
    fontSize: 14,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  wordRevealSection: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  wordRevealLabel: {
    fontFamily: FONTS.serifItalic,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  wordRevealCivilian: {
    fontFamily: FONTS.serifRegular,
    fontSize: 14,
    color: COLORS.civilianGreen,
  },
  wordRevealUndercover: {
    fontFamily: FONTS.serifRegular,
    fontSize: 14,
    color: COLORS.undercoverOrange,
    marginTop: 2,
  },
  revealSectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  revealPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    width: '100%',
  },
  revealPlayerName: {
    fontFamily: FONTS.serifRegular,
    fontSize: 15,
    color: COLORS.textDark,
    flex: 1,
  },
  revealPlayerRole: {
    fontFamily: FONTS.serif,
    fontSize: 12,
    letterSpacing: 1,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    alignSelf: 'center',
    marginBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  playAgainText: {
    fontFamily: FONTS.serif,
    fontSize: 18,
    color: COLORS.textDark,
    letterSpacing: 2,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: COLORS.textLight,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: COLORS.cardSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  errorButtonText: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    color: COLORS.textDark,
    letterSpacing: 1,
  },
});
