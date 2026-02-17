import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { getGameState } from "./core";
import type { ActiveCardEffect } from "../types";

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
      if (target.role === 'tank') {
        newLogs.push(`🛡️ ${target.name} (Tank) menangkis Kutukan!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
      } else {
        const newPos = Math.max(1, (target.position || 1) - 3);
        updates[`rooms/${roomId}/players/${targetId}/position`] = newPos;
        effect.targetId = targetId;
        effect.targetName = target.name;
        newLogs.push(`💀 ${player.name} mengutuk ${target.name} mundur 3 langkah!`);
      }
      break;
    }
    case 'skip_target': {
      if (!targetId || !gameState.players[targetId]) return;
      const target = gameState.players[targetId];
      if (target.role === 'tank') {
        newLogs.push(`🛡️ ${target.name} (Tank) menangkis Skip Giliran!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
      } else {
        updates[`rooms/${roomId}/players/${targetId}/skippedTurns`] = 1;
        effect.targetId = targetId;
        effect.targetName = target.name;
        newLogs.push(`⏭️ ${player.name} membuat ${target.name} skip 1 giliran!`);
      }
      break;
    }
    case 'double_dice': {
      updates[`rooms/${roomId}/players/${playerId}/doubleDice`] = true;
      newLogs.push(`🎲 ${player.name} mengaktifkan Dadu Ganda!`);
      break;
    }
    case 'teleport': {
      const currentPos = player.position || 1;
      const newPos = Math.min(99, currentPos + 5);
      updates[`rooms/${roomId}/players/${playerId}/position`] = newPos;
      newLogs.push(`🌀 ${player.name} teleportasi maju 5 langkah! (${currentPos} → ${newPos})`);
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

      if (target.role === 'tank') {
        newLogs.push(`🛡️ ${target.name} (Tank) menangkis pencurian kartu!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
      } else {
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

          await update(ref(db), {
            ...updates,
            [`rooms/${roomId}/activeCardEffect`]: effect,
            [`rooms/${roomId}/logs`]: newLogs.slice(-50),
          });
          return;
        }
        effect.targetId = targetId;
        effect.targetName = target.name;
      }
      break;
    }
    case 'swap_position': {
      if (!targetId || !gameState.players[targetId]) return;
      const target = gameState.players[targetId];
      if (target.role === 'tank') {
        newLogs.push(`🛡️ ${target.name} (Tank) menangkis Tukar Posisi!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
      } else {
        const myPos = player.position || 1;
        const theirPos = target.position || 1;
        updates[`rooms/${roomId}/players/${playerId}/position`] = theirPos;
        updates[`rooms/${roomId}/players/${targetId}/position`] = myPos;
        effect.targetId = targetId;
        effect.targetName = target.name;
        newLogs.push(`🔄 ${player.name} bertukar posisi dengan ${target.name}! (${myPos} ↔ ${theirPos})`);
      }
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
