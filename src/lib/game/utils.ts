import type { GameState } from "../types";

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getNextTurnUpdates(roomId: string, gameState: GameState): { updates: Record<string, unknown>, logs: string[] } {
  const updates: Record<string, unknown> = {};
  const logs: string[] = [];

  const playersIds = Object.keys(gameState.players || {});
  if (playersIds.length === 0) return { updates, logs };

  const nextTurnIndex = (gameState.currentTurnIndex + 1) % playersIds.length;
  updates[`rooms/${roomId}/currentTurnIndex`] = nextTurnIndex;

  // Decrement Fog Duration (Round based)
  if (nextTurnIndex === 0 && (gameState.fogDuration || 0) > 0) {
    const newDuration = (gameState.fogDuration || 0) - 1;
    if (newDuration <= 0) {
      updates[`rooms/${roomId}/fogDuration`] = null;
      logs.push("☀️ Kabut telah hilang! Portals terlihat kembali.");
    } else {
      updates[`rooms/${roomId}/fogDuration`] = newDuration;
    }
  }

  return { updates, logs };
}

export function generateRandomPortals(): Record<number, number> {
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
    while (attempts < 50) {
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
    while (attempts < 50) {
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
