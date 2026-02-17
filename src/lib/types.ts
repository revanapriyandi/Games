// ============================
// Shared Type Definitions
// ============================

/** Treasure card definition */
export interface TreasureCard {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effectType: 'curse_back' | 'skip_target' | 'double_dice' | 'teleport' | 'shield' | 'steal_card' | 'swap_position' | 'extra_turn';
  targetType: 'self' | 'other';
}

/** Active card effect being animated across all clients */
export interface ActiveCardEffect {
  cardId: string;
  emoji: string;
  effectType: TreasureCard['effectType'];
  userId: string;
  userName: string;
  targetId?: string;
  targetName?: string;
}

/** Player state in a game room */
export interface Player {
  id: string;
  name: string;
  avatar: string;
  position: number;
  isHost: boolean;
  skippedTurns?: number;
  cards?: TreasureCard[];
  hasShield?: boolean;
  doubleDice?: boolean;
  extraTurn?: boolean;
  giveUpCount?: number;
}

/** AI-generated game content based on user's theme */
export interface AIConfig {
  theme: string;
  challenges: string[];
  heroTitles: string[];
  flavorText: string;
}

/** Complete game state synced via Firebase */
export interface GameState {
  status: "waiting" | "playing" | "finished";
  currentTurnIndex: number;
  players: Record<string, Player>;
  lastRoll: number | null;
  isRolling: boolean;
  currentChallenge: string | null;
  winner: string | null;
  logs: string[];
  portalFrom: number | null;
  portalTo: number | null;
  portalType: "ladder" | "snake" | null;
  aiConfig?: AIConfig;
  challengeIndex?: number;
  portals?: Record<number, number>;
  currentPenalty?: { type: 'steps' | 'skip_turn', value: number };
  currentTreasure?: TreasureCard | null;
  activeCardEffect?: ActiveCardEffect | null;
}

/** Response from Gemini for lobby setup */
export interface GeneratedContent {
  challenges: string[];
  heroTitles: string[];
  flavorText: string;
}
