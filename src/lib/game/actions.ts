
import { db } from "../firebase";
import { ref, update, set, push, child, get } from "firebase/database";
import { CHALLENGE_CELLS, TREASURE_CELLS, ROLE_CELLS, TREASURE_CARDS, DEFAULT_CHALLENGES, SNAKES_LADDERS } from "../constants";
import { ROLES, getRole, type RoleType } from "../roles";
import { getAvatarUrl, type AvatarStyle } from "../avatar";
import { generateSingleChallenge } from "../gemini";
import { getGameState } from "./core";
import { generateRandomPortals } from "./utils";
import { calculateMovementOutcome } from "./movement";

// Helper to append logs and sync with chat
export function appendLogAndChat(
  roomId: string,
  existingLogs: string[],
  newMessages: string[],
  updates: Record<string, unknown>
): string[] {
  const finalLogs = [...existingLogs, ...newMessages];
  if (finalLogs.length > 50) finalLogs.shift(); // Keep last 50 logs

  updates[`rooms/${roomId}/logs`] = finalLogs;

  newMessages.forEach((msg) => {
    const chatRef = push(child(ref(db), `rooms/${roomId}/chat`));
    updates[`rooms/${roomId}/chat/${chatRef.key}`] = {
      senderId: "SYSTEM",
      senderName: "🎲 GAME",
      message: msg,
      timestamp: Date.now(),
    };
  });

  return finalLogs;
}

export async function startGame(roomId: string) {
  await update(ref(db, `rooms/${roomId}`), { status: "playing" });
}

export async function selectRole(roomId: string, playerId: string, roleIdFromSelection: string) {
  const gameState = await getGameState(roomId);
  const player = gameState.players[playerId];
  if (!player) return;

  const updates: Record<string, unknown> = {};
  const currentLogs = gameState.logs || [];
  const logMessages: string[] = [];

  // Determine role based on avatar if no explicit selection, otherwise use selection
  let roleId: RoleType;
  if (roleIdFromSelection) {
    roleId = roleIdFromSelection as RoleType;
  } else {
    const avatarUrl = player.customAvatarUrl || getAvatarUrl(player.avatar as AvatarStyle, player.name);
    roleId = detectRoleFromAvatar(avatarUrl);
  }

  const role = getRole(roleId);
  if (!role) return;

  updates[`rooms/${roomId}/players/${playerId}/role`] = roleId;
  updates[`rooms/${roomId}/currentRoleSelection`] = null;

  // Mage Bonus: Free 2 Cards
  if (roleId === 'mage') {
      const card1 = TREASURE_CARDS[Math.floor(Math.random() * TREASURE_CARDS.length)];
      const card2 = TREASURE_CARDS[Math.floor(Math.random() * TREASURE_CARDS.length)];
      
      const existingCards = player.cards || [];
      const updatedCards = [...existingCards, card1, card2];
      
      updates[`rooms/${roomId}/players/${playerId}/cards`] = updatedCards;
      logMessages.push(`🧙‍♂️ Bonus Mage (${player.name}): Dapat 2 kartu (${card1.name} & ${card2.name})!`);
  }

  // Warlord Bonus: Shield & Steal
  if (roleId === 'warlord') {
      const shieldCard = TREASURE_CARDS.find(c => c.effectType === 'shield')!;
      const stealCard = TREASURE_CARDS.find(c => c.effectType === 'steal_card')!;
      
      const existingCards = player.cards || [];
      const updatedCards = [...existingCards, shieldCard, stealCard];
      
      updates[`rooms/${roomId}/players/${playerId}/cards`] = updatedCards;
      logMessages.push(`⚔️ Bonus Warlord (${player.name}): Memulai dengan ${shieldCard.name} & ${stealCard.name}!`);
  }

  // Initial Log
  const roleName = getRole(roleId)?.name || "Unknown";
  logMessages.push(`🎭 ${player.name} mendapatkan Job: ${roleName}`);
  
  appendLogAndChat(roomId, currentLogs, logMessages, updates);

  // Advance Turn
  const playersIds = Object.keys(gameState.players);
  if (!player.extraTurn) {
    const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;
    updates[`rooms/${roomId}/currentTurnIndex`] = nextTurnIndex;
  } else {
    updates[`rooms/${roomId}/players/${playerId}/extraTurn`] = null;
    appendLogAndChat(roomId, currentLogs, [`⚡ ${player.name} menggunakan Bonus Giliran!`], updates);
  }

  await update(ref(db), updates);
}

export async function rollDice(roomId: string, playerId: string) {
  const gameState = await getGameState(roomId);

  const playersIds = Object.keys(gameState.players);
  const activePlayerId = playersIds[gameState.currentTurnIndex];
  if (activePlayerId !== playerId) return;

  // Check for skipped turns
  const player = gameState.players[playerId];
  if (player.skippedTurns && player.skippedTurns > 0) {
    const updates: Record<string, unknown> = {
      [`rooms/${roomId}/players/${playerId}/skippedTurns`]: player.skippedTurns - 1,
      [`rooms/${roomId}/currentTurnIndex`]: (gameState.currentTurnIndex + 1) % playersIds.length,
    };
    appendLogAndChat(roomId, gameState.logs || [], [`${player.name} melewatkan giliran ini karena sanksi!`], updates);
    await update(ref(db), updates);
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
  const currentPortals = gameState.portals || SNAKES_LADDERS;

  const moveResult = calculateMovementOutcome(currentPos, roll, currentPortals, player);
  const landingSpot = moveResult.portal ? moveResult.portal.from : moveResult.finalPosition;

  // Check cell types at destination (landing spot)
  const isChallenge = CHALLENGE_CELLS.has(landingSpot);
  const isTreasure = TREASURE_CELLS.has(landingSpot);
  const isRole = ROLE_CELLS.has(landingSpot);

  let challengePromise: Promise<{ text: string, penalty: { type: 'steps' | 'skip_turn', value: number } }> | null = null;

  if (isChallenge) {
      const futureState = {
          ...gameState,
          players: {
              ...gameState.players,
              [playerId]: { ...gameState.players[playerId], position: landingSpot }
          }
      };
      const theme = gameState.aiConfig?.theme || "";
      challengePromise = generateSingleChallenge(futureState, playerId, theme);
  }

  // Wait for dice animation
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const updates: Record<string, unknown> = {};

  // Use helper to add logs and chat messages
  const currentLogs = gameState.logs || [];
  appendLogAndChat(roomId, currentLogs, moveResult.logs, updates);

  // Always set portal data
  if (moveResult.portal) {
    updates[`rooms/${roomId}/portalFrom`] = moveResult.portal.from;
    updates[`rooms/${roomId}/portalTo`] = moveResult.portal.to;
    updates[`rooms/${roomId}/portalType`] = moveResult.portal.type;
  } else {
    updates[`rooms/${roomId}/portalFrom`] = null;
    updates[`rooms/${roomId}/portalTo`] = null;
    updates[`rooms/${roomId}/portalType`] = null;
    if (moveResult.shieldUsed) {
      updates[`rooms/${roomId}/players/${playerId}/hasShield`] = null;
    }
  }

  // Trigger Role Ability Animation
  if (moveResult.triggeredAbility) {
    const roleEmojiMap: Record<string, string> = {
        ninja: '🥷',
        jester: '🎭',
        builder: '🏗️'
    };
    const emoji = roleEmojiMap[moveResult.triggeredAbility] || '✨';
    
    updates[`rooms/${roomId}/activeCardEffect`] = {
        cardId: 'ability-' + Date.now(),
        emoji: emoji,
        effectType: 'role_ability',
        userId: playerId,
        userName: player.name
    };

    // Clear effect after animation (e.g., 2 seconds)
    setTimeout(() => {
        update(ref(db), { [`rooms/${roomId}/activeCardEffect`]: null });
    }, 2000);
  }

  // Player always moves to final position (after portal if any)
  updates[`rooms/${roomId}/players/${playerId}/position`] = moveResult.finalPosition;
  updates[`rooms/${roomId}/lastRoll`] = roll;
  updates[`rooms/${roomId}/isRolling`] = false;

  // Check for winner
  if (moveResult.finalPosition === 100) {
    updates[`rooms/${roomId}/winner`] = playerId;
    updates[`rooms/${roomId}/status`] = "finished";
    updates[`rooms/${roomId}/currentChallenge`] = null;
    await update(ref(db), updates);
  } else if (isChallenge) {
    // Challenge cell — works even if portal also exists on this cell
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
      console.error("Game Loop Error:", e);
      const fallback = DEFAULT_CHALLENGES[Math.floor(Math.random() * DEFAULT_CHALLENGES.length)];
      await update(ref(db), {
        [`rooms/${roomId}/currentChallenge`]: fallback,
        [`rooms/${roomId}/currentPenalty`]: { type: 'steps', value: 3 }
      });
    }
  } else if (isTreasure) {
    // Treasure cell — give a random card! Works even if portal also exists.
    const randomCard = TREASURE_CARDS[Math.floor(Math.random() * TREASURE_CARDS.length)];

    // Add card to player's inventory
    const existingCards = player.cards || [];
    const updatedCards = [...existingCards, randomCard];

    updates[`rooms/${roomId}/players/${playerId}/cards`] = updatedCards;
    updates[`rooms/${roomId}/currentTreasure`] = randomCard;
    // Don't advance turn yet — wait for player to dismiss treasure modal
    await update(ref(db), updates);
  } else if (isRole) {
      // Role Cell - Offer selection. Works even if portal also exists.
      const shuffledRoles = [...ROLES].sort(() => 0.5 - Math.random());
      const selectedRoleIds = shuffledRoles.slice(0, 3).map(r => r.id);

      updates[`rooms/${roomId}/currentRoleSelection`] = selectedRoleIds;
      // Don't advance turn yet - wait for player to select role
      await update(ref(db), updates);

  } else {
    // Normal move (no card effect)
    // Check extra turn
    if (!player.extraTurn) {
      const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;
      updates[`rooms/${roomId}/currentTurnIndex`] = nextTurnIndex;
    } else {
      updates[`rooms/${roomId}/players/${playerId}/extraTurn`] = null;
      appendLogAndChat(roomId, currentLogs, [`⚡ ${player.name} menggunakan Bonus Giliran!`], updates);
    }

    await update(ref(db), updates);
  }
}

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
  updates[`rooms/${roomId}/currentRoleSelection`] = null;
  updates[`rooms/${roomId}/logs`] = [];

  if (gameState.players) {
    Object.keys(gameState.players).forEach(pid => {
      updates[`rooms/${roomId}/players/${pid}/position`] = 1;
      updates[`rooms/${roomId}/players/${pid}/cards`] = null;
      updates[`rooms/${roomId}/players/${pid}/hasShield`] = null;
      updates[`rooms/${roomId}/players/${pid}/doubleDice`] = null;
      updates[`rooms/${roomId}/players/${pid}/extraTurn`] = null;
      updates[`rooms/${roomId}/players/${pid}/skippedTurns`] = null;
      updates[`rooms/${roomId}/players/${pid}/role`] = null; // Reset role
    });
  }

  const playerCount = Object.keys(gameState.players || {}).length;
  updates[`rooms/${roomId}/currentTurnIndex`] = Math.floor(Math.random() * playerCount);
  updates[`rooms/${roomId}/portals`] = generateRandomPortals();

  await update(ref(db), updates);
}

export async function sendChatMessage(roomId: string, playerId: string, message: string) {
  const dbRef = ref(db);

  // 1. Set ephemeral message (for bubbles)
  await set(child(dbRef, `rooms/${roomId}/players/${playerId}/chatMessage`), message);

  // 2. Add to chat history
  // Fetch player name first
  const snapshot = await get(child(dbRef, `rooms/${roomId}/players/${playerId}/name`));
  const senderName = snapshot.exists() ? snapshot.val() : "Unknown";

  const chatRef = child(dbRef, `rooms/${roomId}/chat`);
  const newMessageRef = push(chatRef);
  await set(newMessageRef, {
    senderId: playerId,
    senderName,
    message,
    timestamp: Date.now()
  });

  // Clear bubble after 5 seconds
  setTimeout(async () => {
    await set(child(dbRef, `rooms/${roomId}/players/${playerId}/chatMessage`), null);
  }, 5000);
}

/**
 * Helper to detect role based on Avatar URL style
 */
function detectRoleFromAvatar(url: string): RoleType {
    if (url.includes('/fun-emoji/')) return 'jester'; // Hidden Role
    if (url.includes('/adventurer-neutral/')) return 'warlord'; // Powerful Role
    if (url.includes('/bottts/')) return 'builder';
    if (url.includes('/avataaars/')) return 'mage';
    if (url.includes('/adventurer/')) return 'ninja';
    
    // Default fallback
    return 'tank'; 
}
