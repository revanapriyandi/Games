import { db } from "../firebase";
import { ref, update } from "firebase/database";
import { getGameState } from "./core";
import { SNAKES_LADDERS } from "../constants";
import { calculateMovementOutcome } from "./movement";
import { appendLogAndChat } from "./actions";
import { getNextTurnUpdates } from "./utils";
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
    const result = getNextTurnUpdates(roomId, gameState);
    Object.assign(updates, result.updates);
    if (result.logs.length > 0) {
      appendLogAndChat(roomId, gameState.logs || [], result.logs, updates);
    }
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
  const logMessages: string[] = [];

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
      if (!targetId || !gameState.players[targetId] || targetId === playerId) return;
      const target = gameState.players[targetId];

      if (target.hasShield) {
        updates[`rooms/${roomId}/players/${targetId}/hasShield`] = null;
        logMessages.push(`🛡️ ${target.name} memblok Kutukan dengan Perisai!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
        break;
      }

      if (target.role === 'tank') {
        logMessages.push(`🛡️ ${target.name} (Tank) menangkis Kutukan!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
      } else {
        const currentPos = target.position || 1;
        const portals = gameState.portals || SNAKES_LADDERS;
        const moveResult = calculateMovementOutcome(currentPos, -3, portals, target);

        updates[`rooms/${roomId}/players/${targetId}/position`] = moveResult.finalPosition;

        // Handle portal logs and updates
        if (moveResult.portal) {
          updates[`rooms/${roomId}/portalFrom`] = moveResult.portal.from;
          updates[`rooms/${roomId}/portalTo`] = moveResult.portal.to;
          updates[`rooms/${roomId}/portalType`] = moveResult.portal.type;
        }

        // Append move logs (e.g. Ninja dodge, Builder)
        logMessages.push(`💀 ${player.name} mengutuk ${target.name} mundur 3 langkah!`);
        logMessages.push(...moveResult.logs);

        effect.targetId = targetId;
        effect.targetName = target.name;
      }
      break;
    }
    case 'skip_target': {
      if (!targetId || !gameState.players[targetId] || targetId === playerId) return;
      const target = gameState.players[targetId];

      if (target.hasShield) {
        updates[`rooms/${roomId}/players/${targetId}/hasShield`] = null;
        logMessages.push(`🛡️ ${target.name} memblok Skip Giliran dengan Perisai!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
        break;
      }

      if (target.role === 'tank') {
        logMessages.push(`🛡️ ${target.name} (Tank) menangkis Skip Giliran!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
      } else {
        updates[`rooms/${roomId}/players/${targetId}/skippedTurns`] = 1;
        effect.targetId = targetId;
        effect.targetName = target.name;
        logMessages.push(`⏭️ ${player.name} membuat ${target.name} skip 1 giliran!`);
      }
      break;
    }
    case 'double_dice': {
      updates[`rooms/${roomId}/players/${playerId}/doubleDice`] = true;
      logMessages.push(`🎲 ${player.name} mengaktifkan Dadu Ganda!`);
      break;
    }
    case 'teleport': {
      const currentPos = player.position || 1;
      const portals = gameState.portals || SNAKES_LADDERS;
      const moveResult = calculateMovementOutcome(currentPos, 5, portals, player);

      updates[`rooms/${roomId}/players/${playerId}/position`] = moveResult.finalPosition;

      if (moveResult.portal) {
        updates[`rooms/${roomId}/portalFrom`] = moveResult.portal.from;
        updates[`rooms/${roomId}/portalTo`] = moveResult.portal.to;
        updates[`rooms/${roomId}/portalType`] = moveResult.portal.type;
      }

      if (moveResult.shieldUsed) {
        updates[`rooms/${roomId}/players/${playerId}/hasShield`] = null;
      }

      logMessages.push(`🌀 ${player.name} teleportasi maju 5 langkah!`);
      logMessages.push(...moveResult.logs);
      break;
    }
    case 'shield': {
      updates[`rooms/${roomId}/players/${playerId}/hasShield`] = true;
      logMessages.push(`🛡️ ${player.name} mengaktifkan Perisai!`);
      break;
    }
    case 'steal_card': {
      if (!targetId || !gameState.players[targetId] || targetId === playerId) return;
      const target = gameState.players[targetId];

      if (target.hasShield) {
        updates[`rooms/${roomId}/players/${targetId}/hasShield`] = null;
        logMessages.push(`🛡️ ${target.name} memblok pencurian kartu dengan Perisai!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
        break;
      }

      if (target.role === 'tank') {
        logMessages.push(`🛡️ ${target.name} (Tank) menangkis pencurian kartu!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
      } else {
        const targetCards = target.cards || [];
        if (targetCards.length === 0) {
          logMessages.push(`🦊 ${player.name} mencoba mencuri kartu ${target.name}, tapi dia tidak punya kartu!`);
        } else {
          const stolenIndex = Math.floor(Math.random() * targetCards.length);
          const stolenCard = targetCards[stolenIndex];
          const newTargetCards = targetCards.filter((_, i) => i !== stolenIndex);
          const newPlayerCards = [...updatedCards, stolenCard];

          updates[`rooms/${roomId}/players/${targetId}/cards`] = newTargetCards.length > 0 ? newTargetCards : null;
          // Override updatedCards with the new set including stolen card
          updates[`rooms/${roomId}/players/${playerId}/cards`] = newPlayerCards;

          logMessages.push(`🦊 ${player.name} mencuri kartu ${stolenCard.emoji} ${stolenCard.name} dari ${target.name}!`);
        }
        effect.targetId = targetId;
        effect.targetName = target.name;
      }
      break;
    }
    case 'swap_position': {
      if (!targetId || !gameState.players[targetId] || targetId === playerId) return;
      const target = gameState.players[targetId];

      if (target.hasShield) {
        updates[`rooms/${roomId}/players/${targetId}/hasShield`] = null;
        logMessages.push(`🛡️ ${target.name} memblok Tukar Posisi dengan Perisai!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
        break;
      }

      if (target.role === 'tank') {
        logMessages.push(`🛡️ ${target.name} (Tank) menangkis Tukar Posisi!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
      } else {
        const myPos = player.position || 1;
        const theirPos = target.position || 1;
        updates[`rooms/${roomId}/players/${playerId}/position`] = theirPos;
        updates[`rooms/${roomId}/players/${targetId}/position`] = myPos;
        effect.targetId = targetId;
        effect.targetName = target.name;
        logMessages.push(`🔄 ${player.name} bertukar posisi dengan ${target.name}! (${myPos} ↔ ${theirPos})`);
      }
      break;
    }
    case 'extra_turn': {
      updates[`rooms/${roomId}/players/${playerId}/extraTurn`] = true;
      logMessages.push(`⚡ ${player.name} akan mendapat giliran ekstra!`);
      break;
    }
    case 'rocket': {
      const currentPos = player.position || 1;
      const portals = gameState.portals || SNAKES_LADDERS;
      const moveResult = calculateMovementOutcome(currentPos, 7, portals, player); // 7 steps

      updates[`rooms/${roomId}/players/${playerId}/position`] = moveResult.finalPosition;

      if (moveResult.portal) {
        updates[`rooms/${roomId}/portalFrom`] = moveResult.portal.from;
        updates[`rooms/${roomId}/portalTo`] = moveResult.portal.to;
        updates[`rooms/${roomId}/portalType`] = moveResult.portal.type;
      }

      logMessages.push(`🚀 ${player.name} meluncur 7 langkah dengan Roket!`);
      logMessages.push(...moveResult.logs);
      break;
    }
    case 'bomb': {
      if (!targetId || !gameState.players[targetId] || targetId === playerId) return;
      const target = gameState.players[targetId];

      if (target.hasShield) {
        updates[`rooms/${roomId}/players/${targetId}/hasShield`] = null;
        logMessages.push(`🛡️ ${target.name} memblok Bom dengan Perisai!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
        break;
      }

      if (target.role === 'tank') {
        logMessages.push(`🛡️ ${target.name} (Tank) menahan ledakan Bom!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
      } else {
        const currentPos = target.position || 1;
        const portals = gameState.portals || SNAKES_LADDERS;
        const moveResult = calculateMovementOutcome(currentPos, -5, portals, target); // Back 5

        updates[`rooms/${roomId}/players/${targetId}/position`] = moveResult.finalPosition;

        if (moveResult.portal) {
          updates[`rooms/${roomId}/portalFrom`] = moveResult.portal.from;
          updates[`rooms/${roomId}/portalTo`] = moveResult.portal.to;
          updates[`rooms/${roomId}/portalType`] = moveResult.portal.type;
        }

        logMessages.push(`💣 ${player.name} meledakkan ${target.name} mundur 5 langkah!`);
        logMessages.push(...moveResult.logs);

        effect.targetId = targetId;
        effect.targetName = target.name;
      }
      break;
    }
    case 'magic_dice': {
      updates[`rooms/${roomId}/players/${playerId}/magicDice`] = true;
      logMessages.push(`🎱 ${player.name} menggunakan Dadu Ajaib (Pasti 6)!`);
      break;
    }
    case 'magnet': {
      if (!targetId || !gameState.players[targetId] || targetId === playerId) return;
      const target = gameState.players[targetId];

      if (target.hasShield) {
        updates[`rooms/${roomId}/players/${targetId}/hasShield`] = null;
        logMessages.push(`🛡️ ${target.name} memblok Magnet dengan Perisai!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
        break;
      }

      if (target.role === 'tank') {
        logMessages.push(`🛡️ ${target.name} (Tank) terlalu berat untuk ditarik Magnet!`);
        effect.targetId = targetId;
        effect.targetName = target.name;
        effect.emoji = '🛡️';
        effect.isBlocked = true;
      } else {
        const myPos = player.position || 1;
        const targetDestination = Math.max(1, myPos - 1); // Behind player

        const portals = gameState.portals || SNAKES_LADDERS;
        // We move them directly, but check for portals at destination? 
        // Usually magnets/swaps ignore movement rules, but landing on a snake?
        // Let's use calculateMovementOutcome with 0 roll from destination to check portals.

        // Actually, let's just place them. If we want them to trigger portals, we check landing spot.
        // Re-using calculateMovement logic is tricky for direct placement.
        // Let's simplified version:
        let finalPos = targetDestination;
        let portalLog = "";

        if (portals[finalPos]) {
          const dest = portals[finalPos];
          const type = dest > finalPos ? "Tangga" : "Ular";
          portalLog = `(Kena ${type}!)`;
          updates[`rooms/${roomId}/portalFrom`] = finalPos;
          updates[`rooms/${roomId}/portalTo`] = dest;
          updates[`rooms/${roomId}/portalType`] = dest > finalPos ? "ladder" : "snake";
          finalPos = dest;
        }

        updates[`rooms/${roomId}/players/${targetId}/position`] = finalPos;

        logMessages.push(`🧲 ${player.name} menarik ${target.name} ke posisi ${finalPos}! ${portalLog}`);
        effect.targetId = targetId;
        effect.targetName = target.name;
      }
      break;
    }
  }

  // Update player's cards (remove used card) if not already updated by effect (e.g. steal_card)
  if (!updates[`rooms/${roomId}/players/${playerId}/cards`]) {
    updates[`rooms/${roomId}/players/${playerId}/cards`] = updatedCards.length > 0 ? updatedCards : null;
  }

  updates[`rooms/${roomId}/activeCardEffect`] = effect;

  // Use helper to update logs and chat
  appendLogAndChat(roomId, gameState.logs || [], logMessages, updates);

  await update(ref(db), updates);
}

export async function clearCardEffect(roomId: string) {
  await update(ref(db), {
    [`rooms/${roomId}/activeCardEffect`]: null,
  });
}
