import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { CHALLENGE_CELLS, TREASURE_CELLS, TREASURE_CARDS, DEFAULT_CHALLENGES, SNAKES_LADDERS } from "../constants";
import { generateSingleChallenge } from "../gemini";
import { getGameState } from "./core";
import { generateRandomPortals } from "./utils";

export async function startGame(roomId: string) {
  await update(ref(db, `rooms/${roomId}`), { status: "playing" });
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
  let destination = hasPortal ? currentPortals[newPosition] : newPosition;

  // Check shield: if snake, block it
  let shieldBlocked = false;
  if (hasPortal && destination < newPosition && player.hasShield) {
    shieldBlocked = true;
  }

  // Ninja Logic: 50% chance to dodge snake
  let ninjaDodged = false;
  if (hasPortal && destination < newPosition && player.role === 'ninja' && !shieldBlocked) {
    if (Math.random() < 0.5) {
      ninjaDodged = true;
    }
  }

  // Wait for dice animation
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const updates: Record<string, unknown> = {};
  let logs = [...(gameState.logs || [])];

  if (hasPortal && !shieldBlocked && !ninjaDodged) {
    // Builder Logic: +2 steps on ladder
    if (destination > newPosition && player.role === 'builder') {
      const originalDest = destination;
      destination = Math.min(100, destination + 2);
      if (destination > originalDest) {
        logs.push(`🏗️ ${player.name} (Builder) memperpanjang tangga!`);
      }
    }

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
      logs.push(`🛡️ ${player.name} memblok ular dengan Perisai!`);
    } else if (ninjaDodged) {
      logs.push(`🥷 ${player.name} (Ninja) menghindari ular dengan lincah!`);
    }
  }

  // Update logs early if modified
  if (logs.length > 50) logs.shift();
  updates[`rooms/${roomId}/logs`] = logs;

  // Check for winner
  if (newPosition === 100) {
    updates[`rooms/${roomId}/winner`] = playerId;
    updates[`rooms/${roomId}/status`] = "finished";
    updates[`rooms/${roomId}/currentChallenge`] = null;
    updates[`rooms/${roomId}/isRolling`] = false;
    updates[`rooms/${roomId}/lastRoll`] = roll;
    updates[`rooms/${roomId}/players/${playerId}/position`] = 100;
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
      logs.push(`⚡ ${player.name} menggunakan Bonus Giliran!`);
      updates[`rooms/${roomId}/logs`] = logs; // Update logs again if extra turn used
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
