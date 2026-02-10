export type Role = 'civilian' | 'undercover' | 'mr_white';

export type GamePhase =
  | 'lobby'
  | 'registration'
  | 'discussion'
  | 'voting'
  | 'elimination'
  | 'mr_white_guess'
  | 'game_over';

export interface Player {
  id: string;
  name: string;
  avatarIcon: string;     // Icon name from @expo/vector-icons
  role: Role;
  word: string | null;
  isAlive: boolean;
}

export interface WordPair {
  category: string;
  civilian: string;
  undercover: string;
}

export interface GameSettings {
  playerCount: number;
  undercoverCount: number;
  mrWhiteCount: number;
  selectedCategory: string | null; // null = random
}

export type GameResult = 
  | { winner: 'crew'; reason: string }
  | { winner: 'imposters'; reason: string }
  | { winner: 'mr_white'; reason: string };
