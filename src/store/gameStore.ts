import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Player, GamePhase, GameSettings, WordPair, GameResult, Role } from '../types/game';
import wordBank from '../data/words.json';

interface GameState {
  // State
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentPlayerIndex: number;        // For registration & discussion turn order
  currentWordPair: WordPair | null;
  votes: Record<string, string>;     // voterId -> targetId
  eliminatedPlayerId: string | null;
  gameResult: GameResult | null;
  availableCategories: string[];

  // Actions
  setPhase: (phase: GamePhase) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  registerPlayer: (name: string, avatarIcon: string) => void;
  registerLastPlayerAndInitialize: (name: string, avatarIcon: string) => void; // Atomic: register last player + init roles
  initializeRoles: () => void;   // Pre-compute roles before registration reveal
  finishRegistration: () => void; // Transition to discussion after all reveals done
  nextPlayer: () => void;
  castVote: (voterId: string, targetId: string) => void;
  tallyVotes: () => string | null;
  eliminatePlayer: (playerId: string) => void;
  checkWinCondition: () => GameResult | null;
  handleMrWhiteGuess: (guess: string) => boolean;
  resetGame: () => void;
  startNewRound: () => void;
}

const getAvailableCategories = (): string[] => {
  const categories = new Set<string>();
  (wordBank as WordPair[]).forEach((wp) => categories.add(wp.category));
  return Array.from(categories);
};

const getRandomWordPair = (category: string | null): WordPair => {
  const pairs = category
    ? (wordBank as WordPair[]).filter((wp) => wp.category === category)
    : (wordBank as WordPair[]);
  return pairs[Math.floor(Math.random() * pairs.length)];
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const assignRoles = (
  playerCount: number,
  undercoverCount: number,
  mrWhiteCount: number
): Role[] => {
  const roles: Role[] = [];

  for (let i = 0; i < mrWhiteCount; i++) roles.push('mr_white');
  for (let i = 0; i < undercoverCount; i++) roles.push('undercover');
  for (let i = 0; i < playerCount - undercoverCount - mrWhiteCount; i++) {
    roles.push('civilian');
  }

  return shuffleArray(roles);
};

const defaultSettings: GameSettings = {
  playerCount: 4,
  undercoverCount: 1,
  mrWhiteCount: 0,
  selectedCategory: null,
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'lobby',
  players: [],
  settings: { ...defaultSettings },
  currentPlayerIndex: 0,
  currentWordPair: null,
  votes: {},
  eliminatedPlayerId: null,
  gameResult: null,
  availableCategories: getAvailableCategories(),

  setPhase: (phase) => set({ phase }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  registerPlayer: (name, avatarIcon) =>
    set((state) => {
      const newPlayer: Player = {
        id: uuidv4(),
        name,
        avatarIcon,
        role: 'civilian', // Placeholder, will be assigned by initializeRoles
        word: null,
        isAlive: true,
      };
      return { players: [...state.players, newPlayer] };
    }),

  registerLastPlayerAndInitialize: (name: string, avatarIcon: string) =>
    set((state) => {
      // Register the last player
      const newPlayer: Player = {
        id: uuidv4(),
        name,
        avatarIcon,
        role: 'civilian',
        word: null,
        isAlive: true,
      };
      const allPlayers = [...state.players, newPlayer];
      
      // Immediately initialize roles for all players
      const wordPair = getRandomWordPair(state.settings.selectedCategory);
      const roles = assignRoles(
        allPlayers.length,
        state.settings.undercoverCount,
        state.settings.mrWhiteCount
      );

      const updatedPlayers = allPlayers.map((player, index) => ({
        ...player,
        role: roles[index],
        word:
          roles[index] === 'civilian'
            ? wordPair.civilian
            : roles[index] === 'undercover'
            ? wordPair.undercover
            : null,
      }));

      return {
        players: updatedPlayers,
        currentWordPair: wordPair,
        currentPlayerIndex: 0,
      };
    }),

  initializeRoles: () => {
    const { settings, players } = get();
    const wordPair = getRandomWordPair(settings.selectedCategory);
    const roles = assignRoles(
      players.length,
      settings.undercoverCount,
      settings.mrWhiteCount
    );

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      role: roles[index],
      word:
        roles[index] === 'civilian'
          ? wordPair.civilian
          : roles[index] === 'undercover'
          ? wordPair.undercover
          : null, // Mr. White gets no word
    }));

    set({
      players: updatedPlayers,
      currentWordPair: wordPair,
      currentPlayerIndex: 0,
    });
  },

  finishRegistration: () => {
    set({
      phase: 'discussion',
      currentPlayerIndex: 0,
    });
  },

  nextPlayer: () =>
    set((state) => ({
      currentPlayerIndex: state.currentPlayerIndex + 1,
    })),

  castVote: (voterId, targetId) =>
    set((state) => ({
      votes: { ...state.votes, [voterId]: targetId },
    })),

  tallyVotes: () => {
    const { votes, players } = get();
    const alivePlayers = players.filter((p) => p.isAlive);
    const aliveVoters = alivePlayers.filter((p) => votes[p.id]);

    // Only tally if all alive players have voted
    if (aliveVoters.length < alivePlayers.length) return null;

    // Count votes
    const voteCounts: Record<string, number> = {};
    Object.values(votes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedId: string | null = null;
    let isTie = false;

    Object.entries(voteCounts).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = playerId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    // In case of tie, pick randomly among tied players
    if (isTie) {
      const tiedPlayers = Object.entries(voteCounts)
        .filter(([, count]) => count === maxVotes)
        .map(([id]) => id);
      eliminatedId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    }

    set({ eliminatedPlayerId: eliminatedId });
    return eliminatedId;
  },

  eliminatePlayer: (playerId) =>
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      const updatedPlayers = state.players.map((p) =>
        p.id === playerId ? { ...p, isAlive: false } : p
      );

      const nextPhase: GamePhase =
        player.role === 'mr_white' ? 'mr_white_guess' : 'elimination';

      return {
        players: updatedPlayers,
        phase: nextPhase,
        eliminatedPlayerId: playerId,
      };
    }),

  checkWinCondition: () => {
    const { players } = get();
    const alivePlayers = players.filter((p) => p.isAlive);
    const aliveCivilians = alivePlayers.filter((p) => p.role === 'civilian');
    const aliveImposters = alivePlayers.filter(
      (p) => p.role === 'undercover' || p.role === 'mr_white'
    );

    // All imposters eliminated
    if (aliveImposters.length === 0) {
      const result: GameResult = {
        winner: 'crew',
        reason: 'All imposters have been eliminated!',
      };
      set({ gameResult: result, phase: 'game_over' });
      return result;
    }

    // Imposters >= civilians
    if (aliveImposters.length >= aliveCivilians.length) {
      const result: GameResult = {
        winner: 'imposters',
        reason: 'Imposters have taken over!',
      };
      set({ gameResult: result, phase: 'game_over' });
      return result;
    }

    return null;
  },

  handleMrWhiteGuess: (guess) => {
    const { currentWordPair } = get();
    if (!currentWordPair) return false;

    const isCorrect =
      guess.trim().toLowerCase() === currentWordPair.civilian.toLowerCase();

    if (isCorrect) {
      const result: GameResult = {
        winner: 'mr_white',
        reason: 'Mr. White correctly guessed the word!',
      };
      set({ gameResult: result, phase: 'game_over' });
    }

    return isCorrect;
  },

  startNewRound: () =>
    set((state) => ({
      phase: 'discussion',
      votes: {},
      eliminatedPlayerId: null,
      currentPlayerIndex: 0,
    })),

  resetGame: () =>
    set({
      phase: 'lobby',
      players: [],
      settings: { ...defaultSettings },
      currentPlayerIndex: 0,
      currentWordPair: null,
      votes: {},
      eliminatedPlayerId: null,
      gameResult: null,
    }),
}));
