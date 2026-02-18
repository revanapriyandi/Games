import { db } from "../firebase";
import { ref, set, get, child, push, onValue, update, remove, runTransaction } from "firebase/database";
import type { Player, GameState, AIConfig } from "../types";
import { AVATAR_ORDER, MAX_PLAYERS } from "../constants";
import { generateRoomCode, generateRandomPortals } from "./utils";

export async function getGameState(roomId: string): Promise<GameState> {
  const snapshot = await get(ref(db, `rooms/${roomId}`));
  return snapshot.val() as GameState;
}

export async function createRoom(playerName: string, customAvatarUrl?: string, aiConfig?: AIConfig) {
  const roomId = generateRoomCode();
  const playerRef = push(child(ref(db), `rooms/${roomId}/players`));
  const playerId = playerRef.key!;

  const initialPlayer: Player = {
    id: playerId,
    name: playerName,
    avatar: AVATAR_ORDER[0],
    position: 1,
    isHost: true,
    giveUpCount: 0,
  };

  if (customAvatarUrl) initialPlayer.customAvatarUrl = customAvatarUrl;

  const initialGameState: GameState = {
    status: "waiting",
    currentTurnIndex: 0,
    players: { [playerId]: initialPlayer },
    lastRoll: null,
    isRolling: false,
    currentChallenge: null,
    winner: null,
    logs: [],
    portalFrom: null,
    portalTo: null,
    portalType: null,
    portals: generateRandomPortals(),
    ...(aiConfig ? { aiConfig } : {}),
  };

  await set(ref(db, `rooms/${roomId}`), initialGameState);
  return { roomId, playerId };
}

export async function joinRoom(roomId: string, playerName: string, customAvatarUrl?: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) throw new Error("Room not found");

  const gameState = snapshot.val() as GameState;
  if (gameState.status !== "waiting") throw new Error("Game already started");

  const currentPlayerCount = Object.keys(gameState.players).length;
  if (currentPlayerCount >= MAX_PLAYERS) {
    throw new Error(`Room is full (max ${MAX_PLAYERS} players)`);
  }

  // Auto-assign next available avatar
  const usedAvatars = Object.values(gameState.players).map((p) => p.avatar);
  const avatar = AVATAR_ORDER.find((a) => !usedAvatars.includes(a)) || AVATAR_ORDER[currentPlayerCount];

  const playerRef = push(child(ref(db), `rooms/${roomId}/players`));
  const playerId = playerRef.key!;

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    avatar,
    position: 1,
    isHost: false,
    giveUpCount: 0,
  };

  if (customAvatarUrl) newPlayer.customAvatarUrl = customAvatarUrl;

  await set(ref(db, `rooms/${roomId}/players/${playerId}`), newPlayer);
  return { roomId, playerId };
}

export function subscribeToRoom(roomId: string, callback: (data: GameState) => void) {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
}

export async function leaveRoom(roomId: string, playerId: string) {
  await remove(ref(db, `rooms/${roomId}/players/${playerId}`));

  // Check if game should end (only 1 player left)
  const gameState = await getGameState(roomId);
  if (gameState.status === "playing") {
    const remainingPlayers = Object.keys(gameState.players || {});
    if (remainingPlayers.length === 1) {
      const winnerId = remainingPlayers[0];
      await update(ref(db, `rooms/${roomId}`), {
        status: "finished",
        winner: winnerId,
        currentChallenge: null
      });
    }
  }
}

export async function updateStakes(roomId: string, stakes: string) {
  const updates: Record<string, unknown> = {};
  updates[`rooms/${roomId}/stakes`] = stakes;
  updates[`rooms/${roomId}/stakesAcceptedBy`] = []; // Reset approvals on change
  await update(ref(db), updates);
}

export async function updateAIConfig(roomId: string, aiConfig: AIConfig) {
  await update(ref(db, `rooms/${roomId}/aiConfig`), aiConfig);
}

export async function acceptStakes(roomId: string, playerId: string) {
  // using runTransaction to safely update the list
  await runTransaction(ref(db, `rooms/${roomId}/stakesAcceptedBy`), (currentList: string[] | null) => {
    const list = currentList || [];
    if (!list.includes(playerId)) {
      return [...list, playerId];
    }
    return list;
  });
}

export async function kickPlayer(roomId: string, playerId: string) {
  await remove(ref(db, `rooms/${roomId}/players/${playerId}`));

  // Check if game should end
  const gameState = await getGameState(roomId);
  if (gameState.status === "playing") {
    const remainingPlayers = Object.keys(gameState.players || {});
    if (remainingPlayers.length === 1) {
      const winnerId = remainingPlayers[0];
      await update(ref(db, `rooms/${roomId}`), {
        status: "finished",
        winner: winnerId,
        currentChallenge: null
      });
    }
  }
}
