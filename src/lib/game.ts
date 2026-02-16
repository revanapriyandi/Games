// ============================
// Game Logic & Firebase Operations
// ============================

import { db } from "./firebase";
import { ref, set, get, child, push, onValue, update, remove } from "firebase/database";
import type { Player, GameState, AIConfig, TreasureCard, ActiveCardEffect } from "./types";
import { AVATAR_ORDER, SNAKES_LADDERS, DEFAULT_CHALLENGES, CHALLENGE_CELLS, TREASURE_CELLS, TREASURE_CARDS, MAX_PLAYERS } from "./constants";
import { generateSingleChallenge } from "./gemini";

// Re-export for consumers that imported from game.ts
export type { Player, GameState, AIConfig, TreasureCard, ActiveCardEffect };
export { SNAKES_LADDERS };

// ---- Map Generation ----

function generateRandomPortals(): Record<number, number> {
  const portals: Record<number, number> = {};
  const occupied = new Set<number>();
  
  const isSafe = (start: number, end: number) => {
    if (occupied.has(start) || occupied.has(end)) return false;
    if (start === 1 || start === 100 || end === 1 || end === 100) return false;
    return true;
  };

  // Add 5-7 Ladders
  const numLadders = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numLadders; i++) {
    let attempts = 0;
    while(attempts < 50) {
      const start = Math.floor(Math.random() * 80) + 2; 
      const length = Math.floor(Math.random() * 30) + 10;
      const end = start + length;
      if (end < 100 && isSafe(start, end)) {
        portals[start] = end;
        occupied.add(start);
        occupied.add(end);
        break;
      }
      attempts++;
    }
  }

  // Add 5-7 Snakes
  const numSnakes = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numSnakes; i++) {
    let attempts = 0;
    while(attempts < 50) {
      const start = Math.floor(Math.random() * 90) + 10; 
      const length = Math.floor(Math.random() * 30) + 10; 
      const end = start - length;
      if (end > 1 && isSafe(start, end)) {
        portals[start] = end;
        occupied.add(start);
        occupied.add(end);
        break;
      }
      attempts++;
    }
  }
  
  return portals;
}

// ---- Room Code ----

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ---- Room Management ----

export async function createRoom(playerName: string, aiConfig?: AIConfig) {
  const roomId = generateRoomCode();
  const playerRef = push(child(ref(db), `rooms/${roomId}/players`));
  const playerId = playerRef.key!;

  const initialPlayer: Player = {
    id: playerId,
    name: playerName,
    avatar: AVATAR_ORDER[0],
    position: 0,
    isHost: true,
  };

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

export async function joinRoom(roomId: string, playerName: string) {
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
    position: 0,
    isHost: false,
  };

  await set(ref(db, `rooms/${roomId}/players/${playerId}`), newPlayer);
  return { roomId, playerId };
}

// ---- Game State Subscription ----

export function subscribeToRoom(roomId: string, callback: (data: GameState) => void) {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
}

// ---- Game Actions ----

export async function startGame(roomId: string) {
  await update(ref(db, `rooms/${roomId}`), { status: "playing" });
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

async function getGameState(roomId: string): Promise<GameState> {
  const snapshot = await get(ref(db, `rooms/${roomId}`));
  return snapshot.val() as GameState;
}



export async function rollDice(roomId: string, playerId: string) {
  const gameState = await getGameState(roomId);

  const playersIds = Object.keys(gameState.players);
  const activePlayerId = playersIds[gameState.currentTurnIndex];
  if (activePlayerId !== playerId) return;

  // Check for skipped turns
  const player = gameState.players[playerId];
  if (player.skippedTurns && player.skippedTurns > 0) {
    await update(ref(db), {
      [`rooms/${roomId}/players/${playerId}/skippedTurns`]: player.skippedTurns - 1,
      [`rooms/${roomId}/currentTurnIndex`]: (gameState.currentTurnIndex + 1) % playersIds.length,
      [`rooms/${roomId}/logs`]: [...(gameState.logs || []), `${player.name} melewatkan giliran ini karena sanksi!`]
    });
    return;
  }

  // Signal rolling to all players
  await update(ref(db), {
    [`rooms/${roomId}/isRolling`]: true,
    [`rooms/${roomId}/lastRoll`]: null,
  });

  // --- Calculate outcome ---
  let roll = Math.floor(Math.random() * 6) + 1;
  
  // Apply Double Dice effect
  if (player.doubleDice) {
    roll = Math.min(roll * 2, 12);
    await update(ref(db), {
      [`rooms/${roomId}/players/${playerId}/doubleDice`]: null,
    });
  }

  const currentPos = gameState.players[playerId].position || 1;
  let newPosition = currentPos + roll;
  if (newPosition > 100) newPosition = 100 - (newPosition - 100);

  // Check cell types at destination
  const isChallenge = CHALLENGE_CELLS.has(newPosition);
  const isTreasure = TREASURE_CELLS.has(newPosition);
  let challengePromise: Promise<{ text: string, penalty: { type: 'steps' | 'skip_turn', value: number } }> | null = null;
  
  if (isChallenge) {
      const futureState = {
          ...gameState,
          players: {
              ...gameState.players,
              [playerId]: { ...gameState.players[playerId], position: newPosition }
          }
      };
      const theme = gameState.aiConfig?.theme || "";
      challengePromise = generateSingleChallenge(futureState, playerId, theme);
  }

  // Determine portal effects
  const currentPortals = gameState.portals || SNAKES_LADDERS;
  const hasPortal = !!currentPortals[newPosition];
  
  // Check shield: if snake, block it
  let shieldBlocked = false;
  if (hasPortal && currentPortals[newPosition] < newPosition && player.hasShield) {
    shieldBlocked = true;
  }
  
  // Wait for dice animation
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const updates: Record<string, unknown> = {};

  if (hasPortal && !shieldBlocked) {
    const destination = currentPortals[newPosition];
    updates[`rooms/${roomId}/portalFrom`] = newPosition;
    updates[`rooms/${roomId}/portalTo`] = destination;
    updates[`rooms/${roomId}/portalType`] = destination > newPosition ? "ladder" : "snake";
    newPosition = destination;
  } else {
    updates[`rooms/${roomId}/portalFrom`] = null;
    updates[`rooms/${roomId}/portalTo`] = null;
    updates[`rooms/${roomId}/portalType`] = null;
    if (shieldBlocked) {
      updates[`rooms/${roomId}/players/${playerId}/hasShield`] = null;
      const newLogs = [...(gameState.logs || []), `🛡️ ${player.name} memblok ular dengan Perisai!`];
      if (newLogs.length > 50) newLogs.shift();
      updates[`rooms/${roomId}/logs`] = newLogs;
    }
  }

  // Check for winner
  if (newPosition === 100) {
    updates[`rooms/${roomId}/winner`] = playerId;
    updates[`rooms/${roomId}/status`] = "finished";
    updates[`rooms/${roomId}/currentChallenge`] = null;
    await update(ref(db), updates);
  } else if (isChallenge && !hasPortal) {
    // Challenge cell
    updates[`rooms/${roomId}/players/${playerId}/position`] = newPosition;
    updates[`rooms/${roomId}/lastRoll`] = roll;
    updates[`rooms/${roomId}/isRolling`] = false;
    updates[`rooms/${roomId}/currentChallenge`] = "...GENERATING...";
    await update(ref(db), updates);

    try {
      let result;
      if (challengePromise) {
          result = await challengePromise;
      } else {
          const freshState = await getGameState(roomId);
          const theme = freshState.aiConfig?.theme || "";
          result = await generateSingleChallenge(freshState, playerId, theme);
      }
      await update(ref(db), {
        [`rooms/${roomId}/currentChallenge`]: result.text,
        [`rooms/${roomId}/currentPenalty`]: result.penalty
      });
    } catch (e) {
      console.error("Challenge gen failed", e);
      const fallback = DEFAULT_CHALLENGES[Math.floor(Math.random() * DEFAULT_CHALLENGES.length)];
      await update(ref(db), {
        [`rooms/${roomId}/currentChallenge`]: fallback,
        [`rooms/${roomId}/currentPenalty`]: { type: 'steps', value: 3 }
      });
    }
  } else if (isTreasure && !hasPortal) {
    // Treasure cell — give a random card!
    const randomCard = TREASURE_CARDS[Math.floor(Math.random() * TREASURE_CARDS.length)];
    
    // Add card to player's inventory
    const existingCards = player.cards || [];
    const updatedCards = [...existingCards, randomCard];
    
    updates[`rooms/${roomId}/players/${playerId}/position`] = newPosition;
    updates[`rooms/${roomId}/lastRoll`] = roll;
    updates[`rooms/${roomId}/isRolling`] = false;
    updates[`rooms/${roomId}/players/${playerId}/cards`] = updatedCards;
    updates[`rooms/${roomId}/currentTreasure`] = randomCard;
    // Don't advance turn yet — wait for player to dismiss treasure modal
    await update(ref(db), updates);
  } else {
    // Normal move
    updates[`rooms/${roomId}/players/${playerId}/position`] = newPosition;
    updates[`rooms/${roomId}/lastRoll`] = roll;
    updates[`rooms/${roomId}/isRolling`] = false;
    
    // Check extra turn
    if (!player.extraTurn) {
      const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;
      updates[`rooms/${roomId}/currentTurnIndex`] = nextTurnIndex;
    } else {
      updates[`rooms/${roomId}/players/${playerId}/extraTurn`] = null;
      const newLogs = [...(gameState.logs || []), `⚡ ${player.name} menggunakan Bonus Giliran!`];
      if (newLogs.length > 50) newLogs.shift();
      updates[`rooms/${roomId}/logs`] = newLogs;
    }
    
    await update(ref(db), updates);
  }
}

export async function markChallengeComplete(roomId: string) {
  const gameState = await getGameState(roomId);

  const playersIds = Object.keys(gameState.players);
  const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;

  await update(ref(db), {
    [`rooms/${roomId}/currentChallenge`]: null,
    [`rooms/${roomId}/currentTurnIndex`]: nextTurnIndex,
    [`rooms/${roomId}/lastRoll`]: null,
    [`rooms/${roomId}/portalFrom`]: null,
    [`rooms/${roomId}/portalType`]: null,
  });
}

export async function failChallenge(roomId: string, playerName: string, playerId: string) {
  const gameState = await getGameState(roomId);
  const playersIds = Object.keys(gameState.players);
  const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;

  const penalty = gameState.currentPenalty || { type: 'steps', value: 3 };
  const updates: Record<string, unknown> = {};
  let logMessage = "";

  console.log("FAILING CHALLENGE:", { penalty, playerId, currentPos: gameState.players[playerId].position });

  if (penalty.type === 'steps') {
    // Penalty: Move back X steps
    const currentPos = gameState.players[playerId].position || 0;
    // Force value to be a number just in case
    const steps = typeof penalty.value === 'string' ? parseInt(penalty.value) : penalty.value;
    const newPos = Math.max(1, currentPos - steps);
    
    updates[`rooms/${roomId}/players/${playerId}/position`] = newPos;
    logMessage = `${playerName} menyerah & mundur ${steps} langkah! (Pos: ${currentPos} -> ${newPos})`;
  } else {
    // Penalty: Skip Turn
    const turns = typeof penalty.value === 'string' ? parseInt(penalty.value) : penalty.value;
    updates[`rooms/${roomId}/players/${playerId}/skippedTurns`] = turns;
    logMessage = `${playerName} menyerah & harus LEWATI ${turns} giliran!`;
  }

  // Add log entry
  const newLogs = [...(gameState.logs || []), logMessage];
  if (newLogs.length > 50) newLogs.shift();

  Object.assign(updates, {
    [`rooms/${roomId}/currentChallenge`]: null,
    [`rooms/${roomId}/currentPenalty`]: null, 
    [`rooms/${roomId}/currentTurnIndex`]: nextTurnIndex,
    [`rooms/${roomId}/lastRoll`]: null,
    [`rooms/${roomId}/portalFrom`]: null,
    [`rooms/${roomId}/portalType`]: null,
    [`rooms/${roomId}/logs`]: newLogs,
  });

  await update(ref(db), updates);
}

// ---- Treasure Functions ----

export async function dismissTreasure(roomId: string) {
  const gameState = await getGameState(roomId);
  const playersIds = Object.keys(gameState.players);
  const activePlayerId = playersIds[gameState.currentTurnIndex];
  const player = gameState.players[activePlayerId];
  
  const updates: Record<string, unknown> = {
    [`rooms/${roomId}/currentTreasure`]: null,
  };

  // Check extra turn
  if (!player?.extraTurn) {
    const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;
    updates[`rooms/${roomId}/currentTurnIndex`] = nextTurnIndex;
  } else {
    updates[`rooms/${roomId}/players/${activePlayerId}/extraTurn`] = null;
  }

  await update(ref(db), updates);
}

export async function playCard(roomId: string, playerId: string, cardIndex: number, targetId?: string) {
  const gameState = await getGameState(roomId);
  const player = gameState.players[playerId];
  if (!player) return;

  const cards = player.cards || [];
  if (cardIndex < 0 || cardIndex >= cards.length) return;

  const card = cards[cardIndex];
  const updatedCards = cards.filter((_, i) => i !== cardIndex);
  
  const updates: Record<string, unknown> = {};
  const newLogs = [...(gameState.logs || [])];
  
  // Set active card effect for animation
  const effect: ActiveCardEffect = {
    cardId: card.id,
    emoji: card.emoji,
    effectType: card.effectType,
    userId: playerId,
    userName: player.name,
  };

  switch (card.effectType) {
    case 'curse_back': {
      if (!targetId || !gameState.players[targetId]) return;
      const target = gameState.players[targetId];
      const newPos = Math.max(1, (target.position || 1) - 5);
      updates[`rooms/${roomId}/players/${targetId}/position`] = newPos;
      effect.targetId = targetId;
      effect.targetName = target.name;
      newLogs.push(`💀 ${player.name} mengutuk ${target.name} mundur 5 langkah!`);
      break;
    }
    case 'skip_target': {
      if (!targetId || !gameState.players[targetId]) return;
      const target = gameState.players[targetId];
      updates[`rooms/${roomId}/players/${targetId}/skippedTurns`] = 1;
      effect.targetId = targetId;
      effect.targetName = target.name;
      newLogs.push(`⏭️ ${player.name} membuat ${target.name} skip 1 giliran!`);
      break;
    }
    case 'double_dice': {
      updates[`rooms/${roomId}/players/${playerId}/doubleDice`] = true;
      newLogs.push(`🎲 ${player.name} mengaktifkan Dadu Ganda!`);
      break;
    }
    case 'teleport': {
      const currentPos = player.position || 1;
      const newPos = Math.min(99, currentPos + 10);
      updates[`rooms/${roomId}/players/${playerId}/position`] = newPos;
      newLogs.push(`🌀 ${player.name} teleportasi maju 10 langkah! (${currentPos} → ${newPos})`);
      break;
    }
    case 'shield': {
      updates[`rooms/${roomId}/players/${playerId}/hasShield`] = true;
      newLogs.push(`🛡️ ${player.name} mengaktifkan Perisai!`);
      break;
    }
    case 'steal_card': {
      if (!targetId || !gameState.players[targetId]) return;
      const target = gameState.players[targetId];
      const targetCards = target.cards || [];
      if (targetCards.length === 0) {
        newLogs.push(`🦊 ${player.name} mencoba mencuri kartu ${target.name}, tapi dia tidak punya kartu!`);
      } else {
        const stolenIndex = Math.floor(Math.random() * targetCards.length);
        const stolenCard = targetCards[stolenIndex];
        const newTargetCards = targetCards.filter((_, i) => i !== stolenIndex);
        const newPlayerCards = [...updatedCards, stolenCard];
        updates[`rooms/${roomId}/players/${targetId}/cards`] = newTargetCards.length > 0 ? newTargetCards : null;
        // Override updatedCards with the new set including stolen card
        updates[`rooms/${roomId}/players/${playerId}/cards`] = newPlayerCards;
        effect.targetId = targetId;
        effect.targetName = target.name;
        newLogs.push(`🦊 ${player.name} mencuri kartu ${stolenCard.emoji} ${stolenCard.name} dari ${target.name}!`);
        // Early set cards since we handle it specially
        await update(ref(db), {
          ...updates,
          [`rooms/${roomId}/activeCardEffect`]: effect,
          [`rooms/${roomId}/logs`]: newLogs.slice(-50),
        });
        return; // Skip the default card update below
      }
      effect.targetId = targetId;
      effect.targetName = target.name;
      break;
    }
    case 'swap_position': {
      if (!targetId || !gameState.players[targetId]) return;
      const target = gameState.players[targetId];
      const myPos = player.position || 1;
      const theirPos = target.position || 1;
      updates[`rooms/${roomId}/players/${playerId}/position`] = theirPos;
      updates[`rooms/${roomId}/players/${targetId}/position`] = myPos;
      effect.targetId = targetId;
      effect.targetName = target.name;
      newLogs.push(`🔄 ${player.name} bertukar posisi dengan ${target.name}! (${myPos} ↔ ${theirPos})`);
      break;
    }
    case 'extra_turn': {
      updates[`rooms/${roomId}/players/${playerId}/extraTurn`] = true;
      newLogs.push(`⚡ ${player.name} akan mendapat giliran ekstra!`);
      break;
    }
  }

  // Update player's cards (remove used card)
  updates[`rooms/${roomId}/players/${playerId}/cards`] = updatedCards.length > 0 ? updatedCards : null;
  updates[`rooms/${roomId}/activeCardEffect`] = effect;
  if (newLogs.length > 50) newLogs.shift();
  updates[`rooms/${roomId}/logs`] = newLogs;

  await update(ref(db), updates);
}

export async function clearCardEffect(roomId: string) {
  await update(ref(db), {
    [`rooms/${roomId}/activeCardEffect`]: null,
  });
}

// ---- Game Reset ----

export async function resetGame(roomId: string) {
  const gameState = await getGameState(roomId);
  const updates: Record<string, unknown> = {};

  updates[`rooms/${roomId}/status`] = "playing";
  updates[`rooms/${roomId}/winner`] = null;
  updates[`rooms/${roomId}/currentChallenge`] = null;
  updates[`rooms/${roomId}/currentTreasure`] = null;
  updates[`rooms/${roomId}/activeCardEffect`] = null;
  updates[`rooms/${roomId}/lastRoll`] = null;
  updates[`rooms/${roomId}/portalFrom`] = null;
  updates[`rooms/${roomId}/portalTo`] = null;
  updates[`rooms/${roomId}/portalType`] = null;
  updates[`rooms/${roomId}/logs`] = [];

  if (gameState.players) {
    Object.keys(gameState.players).forEach(pid => {
      updates[`rooms/${roomId}/players/${pid}/position`] = 0;
      updates[`rooms/${roomId}/players/${pid}/cards`] = null;
      updates[`rooms/${roomId}/players/${pid}/hasShield`] = null;
      updates[`rooms/${roomId}/players/${pid}/doubleDice`] = null;
      updates[`rooms/${roomId}/players/${pid}/extraTurn`] = null;
      updates[`rooms/${roomId}/players/${pid}/skippedTurns`] = null;
    });
  }

  const playerCount = Object.keys(gameState.players || {}).length;
  updates[`rooms/${roomId}/currentTurnIndex`] = Math.floor(Math.random() * playerCount);
  updates[`rooms/${roomId}/portals`] = generateRandomPortals();

  await update(ref(db), updates);
}
