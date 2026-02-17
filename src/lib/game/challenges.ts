import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { getGameState } from "./core";

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

  // Increment giveUpCount
  const currentGiveUpCount = gameState.players[playerId].giveUpCount || 0;
  updates[`rooms/${roomId}/players/${playerId}/giveUpCount`] = currentGiveUpCount + 1;

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
