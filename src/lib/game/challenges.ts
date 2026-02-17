import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { getGameState } from "./core";
import { SNAKES_LADDERS, MAX_GIVE_UP } from "../constants";
import { calculateMovementOutcome } from "./movement";
import { appendLogAndChat } from "./actions";

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
  
  // Check Max Give Up
  const player = gameState.players[playerId];
  const currentGiveUpCount = player.giveUpCount || 0;
  
  if (currentGiveUpCount >= MAX_GIVE_UP) {
      // Should not happen if UI is disabled, but safety check
      return; 
  }

  const updates: Record<string, unknown> = {
    [`rooms/${roomId}/currentChallenge`]: null,
    [`rooms/${roomId}/currentPenalty`]: null,
    [`rooms/${roomId}/currentTurnIndex`]: nextTurnIndex,
    [`rooms/${roomId}/lastRoll`]: null,
    [`rooms/${roomId}/portalFrom`]: null,
    [`rooms/${roomId}/portalType`]: null,
  };
  let logMessage = "";
  let extraLogs: string[] = [];

  // Increment giveUpCount
  updates[`rooms/${roomId}/players/${playerId}/giveUpCount`] = currentGiveUpCount + 1;

  if (penalty.type === 'steps') {
    // Penalty: Move back X steps
    const currentPos = gameState.players[playerId].position || 0;
    // Force value to be a number just in case
    const steps = typeof penalty.value === 'string' ? parseInt(penalty.value) : penalty.value;

    const portals = gameState.portals || SNAKES_LADDERS;
    const player = gameState.players[playerId];
    const moveResult = calculateMovementOutcome(currentPos, -steps, portals, player);

    const newPos = moveResult.finalPosition;
    updates[`rooms/${roomId}/players/${playerId}/position`] = newPos;

    if (moveResult.portal) {
       updates[`rooms/${roomId}/portalFrom`] = moveResult.portal.from;
       updates[`rooms/${roomId}/portalTo`] = moveResult.portal.to;
       updates[`rooms/${roomId}/portalType`] = moveResult.portal.type;
    }

    if (moveResult.shieldUsed) {
       updates[`rooms/${roomId}/players/${playerId}/hasShield`] = null;
    }

    extraLogs = moveResult.logs;

    logMessage = `${playerName} menyerah & mundur ${steps} langkah! (Pos: ${currentPos} -> ${newPos})`;
  } else {
    // Penalty: Skip Turn
    const turns = typeof penalty.value === 'string' ? parseInt(penalty.value) : penalty.value;
    updates[`rooms/${roomId}/players/${playerId}/skippedTurns`] = turns;
    logMessage = `${playerName} menyerah & harus LEWATI ${turns} giliran!`;
  }

  // Add log entry
  appendLogAndChat(roomId, gameState.logs || [], [logMessage, ...extraLogs], updates);

  await update(ref(db), updates);
}
