// ============================
// Shared Type Definitions
// ============================

/** Treasure card definition */
export interface TreasureCard {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effectType: 'curse_back' | 'skip_target' | 'double_dice' | 'teleport' | 'shield' | 'steal_card' | 'swap_position' | 'extra_turn' | 'role_ability' | 'rocket' | 'bomb' | 'magic_dice' | 'magnet' | 'skip_challenge';
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
  isBlocked?: boolean;
}

/** Player state in a game room */
export interface Player {
  id: string;
  name: string;
  avatar: string;
  position: number;
  isHost: boolean;
  role?: string; // 'ninja' | 'tank' | 'mage' | 'builder'
  customAvatarUrl?: string;
  skippedTurns?: number;
  cards?: TreasureCard[];
  hasShield?: boolean;
  doubleDice?: boolean;
  magicDice?: boolean;
  extraTurn?: boolean;
  giveUpCount?: number;
  chatMessage?: string;
  isBot?: boolean;
}

/** AI-generated game content based on user's theme */
export interface AIConfig {
  theme: string;
  challenges: string[];
  heroTitles: string[];
  flavorText: string;
}

/** Chat message definition */
export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface HouseRules {
  strictFinish: boolean; // Must land exactly on 100
  doubleSnake: boolean; // Snakes go down twice as far (visual implementation or just logic?) -> Logic: Double the distance dropped? Or standard snake just visual? Let's say "More Snakes" or just specific logic. For now: just a flag.
  noShield: boolean; // Cannot use shield cards
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
  chat?: Record<string, ChatMessage>;
  portalFrom: number | null;
  portalTo: number | null;
  portalType: "ladder" | "snake" | null;
  aiConfig?: AIConfig;
  challengeIndex?: number;
  portals?: Record<number, number>;
  currentPenalty?: { type: 'steps' | 'skip_turn', value: number };
  currentTreasure?: TreasureCard | null;
  activeCardEffect?: ActiveCardEffect | null;
  currentRoleSelection?: string[] | null;
  turnCount?: number;
  activeWorldEvent?: {
      id: string;
      name: string;
      description: string;
      type: 'earthquake' | 'wind' | 'fog';
      timestamp: number;
  } | null;
  stakes?: string | null;
  stakesAcceptedBy?: string[];
  fogDuration?: number;
  rules?: HouseRules;
}

/** Response from Gemini for lobby setup */
export interface GeneratedContent {
  challenges: string[];
  heroTitles: string[];
  flavorText: string;
}
