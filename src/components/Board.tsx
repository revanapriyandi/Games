import type { Player, ActiveCardEffect } from "../lib/types";
import fantasyMap from '../assets/fantasy_map_board.png';
import { PlayerToken } from "./game/PlayerToken";
import { BoardGrid } from "./game/BoardGrid";
import { motion } from "framer-motion";

interface BoardProps {
    players: Player[];
    displayPositions?: Record<string, number>;
    thinkingPlayerId?: string | null;
    activePortalCell?: number | null;
    portals?: Record<number, number>;
    activeCardEffect?: ActiveCardEffect | null;
    speakingPlayers?: Record<string, boolean>;
    fogActive?: boolean;
    worldEventType?: 'earthquake' | 'wind' | 'fog' | null;
    isNight?: boolean;
}

// Helper to get offset and scale based on index and total count in cell
function getCollisionProps(index: number, total: number) {
    if (total <= 1) return { x: 0, y: 0, scale: 1 };

    const scale = total === 2 ? 0.75 : total === 3 ? 0.65 : 0.6;
    let x = 0;
    let y = 0;
    const offset = total === 2 ? 20 : total === 3 ? 20 : 25;

    if (total === 2) {
        // Side by Side
        x = index === 0 ? -offset / 1.5 : offset / 1.5;
        y = index === 0 ? 5 : -5; // Slight vertical stagger
    } else if (total === 3) {
        // Triangle
        if (index === 0) { y = -offset; }
        else if (index === 1) { x = -offset; y = offset * 0.5; }
        else { x = offset; y = offset * 0.5; }
    } else if (total === 4) {
        // Square
        x = (index % 2 === 0) ? -offset : offset;
        y = (index < 2) ? -offset : offset;
    } else {
        // 5+ Just randomish spread
        const angle = (index / total) * Math.PI * 2;
        x = Math.cos(angle) * offset;
        y = Math.sin(angle) * offset;
    }

    return { x, y, scale };
}

export function Board({ players, displayPositions, thinkingPlayerId, activePortalCell, portals, activeCardEffect, speakingPlayers, fogActive, worldEventType, isNight }: BoardProps) {
    const currentPositions = displayPositions ||
        Object.fromEntries(players.map(p => [p.id, p.position || 1]));

    // Group players by position to handle collisions
    const playersByPosition: Record<number, string[]> = {}; // position -> [playerIds]
    const playerCollisionData: Record<string, { index: number, total: number }> = {};

    // 1. Group them
    players.forEach(p => {
        const pos = currentPositions[p.id] ?? p.position ?? 1;
        if (!playersByPosition[pos]) playersByPosition[pos] = [];
        playersByPosition[pos].push(p.id);
    });

    // 2. Assign indices
    players.forEach(p => {
        const pos = currentPositions[p.id] ?? p.position ?? 1;
        const group = playersByPosition[pos];
        const index = group.indexOf(p.id);
        playerCollisionData[p.id] = { index, total: group.length };
    });

    return (
        <motion.div
            animate={worldEventType === 'earthquake' ? { x: [-2, 2, -2, 2, 0], y: [1, -1, 0] } : {}}
            transition={{ duration: 0.2, repeat: worldEventType === 'earthquake' ? Infinity : 0 }}
            className={`relative w-full max-w-[98vw] md:max-w-[85vh] lg:max-w-[90vh] aspect-square rounded-xl shadow-2xl overflow-hidden border border-[#8B4513]/50 mx-auto select-none transition-all duration-[2000ms] ${isNight ? 'brightness-[0.6] sepia-[0.2] hue-rotate-[15deg]' : ''}`}
        >
            {/* Fantasy Map Background */}
            <img
                src={fantasyMap}
                alt="Game Board"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
                draggable={false}
            />

            {/* Grid & Portals */}
            <BoardGrid
                portals={portals}
                activePortalCell={activePortalCell || null}
                hidePortals={fogActive}
            />

            {/* Players */}
            {players.map((player, playerIndex) => {
                const collision = playerCollisionData[player.id];
                const { x, y, scale } = getCollisionProps(collision.index, collision.total);

                return (
                    <PlayerToken
                        key={player.id}
                        player={player}
                        playerIndex={playerIndex}
                        displayPosition={currentPositions[player.id] ?? player.position}
                        thinkingPlayerId={thinkingPlayerId}
                        activeCardEffect={activeCardEffect}
                        isSpeaking={speakingPlayers?.[player.id]}
                        offset={{ x, y }}
                        scale={scale}
                    />
                );
            })}
        </motion.div>
    );
}

