import type { Player } from "../types";

export interface MovementResult {
  finalPosition: number;
  portal?: {
    from: number;
    to: number;
    type: 'snake' | 'ladder';
  };
  shieldUsed?: boolean;
  ninjaDodged?: boolean;
  builderBoost?: boolean;
  triggeredAbility?: 'ninja' | 'jester' | 'builder';
  logs: string[];
}

export function calculateMovementOutcome(
  currentPos: number,
  steps: number,
  portals: Record<number, number>,
  player: Player
): MovementResult {
  // 1. Calculate base move
  let newPosition = currentPos + steps;

  // Handle board boundaries
  if (newPosition > 100) newPosition = 100 - (newPosition - 100);
  if (newPosition < 1) newPosition = 1;

  const logs: string[] = [];

  // 2. Check Portal
  // Portals are checked at the landing position
  const hasPortal = !!portals[newPosition];
  let destination = hasPortal ? portals[newPosition] : newPosition;

  // 3. Apply defensive/role logic
  let shieldBlocked = false;
  let ninjaDodged = false;
  let builderBoost = false;
  let triggeredAbility: 'ninja' | 'jester' | 'builder' | undefined;

  if (hasPortal) {
      if (destination < newPosition) {
          // Snake (Penalty)
          if (player.hasShield) {
              shieldBlocked = true;
              logs.push(`🛡️ ${player.name} memblok ular dengan Perisai!`);
              destination = newPosition; // Stay at top
          } else if (player.role === 'ninja' && Math.random() < 0.5) {
              ninjaDodged = true;
              logs.push(`🥷 ${player.name} (Ninja) menghindari ular dengan lincah!`);
              destination = newPosition; // Stay at top
              triggeredAbility = 'ninja';
          } else if (player.role === 'jester' && Math.random() > 0.5) {
              // Jester Ability: 50% Chance to turn Snake into Trampoline!
              const dropAmount = newPosition - destination;
              const newDest = Math.min(100, newPosition + dropAmount);
              destination = newDest;
              logs.push(`🎭 ${player.name} (Jester) mengubah Ular menjadi Trampolin! Loncat ke kotak ${destination}!`);
              triggeredAbility = 'jester';
          } else {
              logs.push(`🐍 ${player.name} digigit ular! Turun ke kotak ${destination}.`);
          }
      } else if (destination > newPosition) {
          // Ladder (Bonus)
          if (player.role === 'builder') {
               // Builder adds 3 steps to the ladder climb
               const boostedDest = Math.min(100, destination + 3);
               if (boostedDest > destination) {
                   builderBoost = true;
                   destination = boostedDest;
                   logs.push(`🏗️ ${player.name} (Builder) memperpanjang tangga!`);
                   triggeredAbility = 'builder';
               } else {
                   logs.push(`🪜 ${player.name} naik tangga ke kotak ${destination}!`);
               }
          } else {
              logs.push(`🪜 ${player.name} naik tangga ke kotak ${destination}!`);
          }
      }
  }

  return {
      finalPosition: destination,
      portal: (hasPortal && !shieldBlocked && !ninjaDodged && destination !== newPosition) ? {
          from: newPosition,
          to: destination,
          type: destination > newPosition ? 'ladder' : 'snake'
      } : undefined,
      shieldUsed: shieldBlocked,
      ninjaDodged,
      builderBoost,
      triggeredAbility,
      logs
  };
}
