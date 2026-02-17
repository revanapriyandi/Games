import type { Player, ActiveCardEffect } from "../lib/types";
import fantasyMap from '../assets/fantasy_map_board.png';
import { PlayerToken } from "./game/PlayerToken";
import { BoardGrid } from "./game/BoardGrid";

interface BoardProps {
    players: Player[];
    displayPositions?: Record<string, number>;
    thinkingPlayerId?: string | null;
    activePortalCell?: number | null;
    portals?: Record<number, number>;
    activeCardEffect?: ActiveCardEffect | null;
    speakingPlayers?: Record<string, boolean>;
}

export function Board({ players, displayPositions, thinkingPlayerId, activePortalCell, portals, activeCardEffect, speakingPlayers }: BoardProps) {
    const currentPositions = displayPositions ||
        Object.fromEntries(players.map(p => [p.id, p.position || 1]));

    return (
        <div className="relative w-full max-w-[98vw] md:max-w-[85vh] lg:max-w-[90vh] aspect-square rounded-xl shadow-2xl overflow-hidden border border-[#8B4513]/50 mx-auto select-none">
            {/* Fantasy Map Background */}
            <img
                src={fantasyMap}
                alt="Game Board"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
                draggable={false}
            />

            {/* Grid & Portals */}
            <BoardGrid portals={portals} activePortalCell={activePortalCell || null} />

            {/* Players */}
            {players.map((player, playerIndex) => (
                <PlayerToken
                    key={player.id}
                    player={player}
                    playerIndex={playerIndex}
                    displayPosition={currentPositions[player.id] ?? player.position}
                    thinkingPlayerId={thinkingPlayerId}
                    activeCardEffect={activeCardEffect}
                    isSpeaking={speakingPlayers?.[player.id]}
                />
            ))}
        </div>
    );
}

