import { useEffect, useState } from "react";
import type { Player, ActiveCardEffect } from "../lib/types";
import { SNAKES_LADDERS } from "../lib/game";
import { CHALLENGE_CELLS, TREASURE_CELLS } from "../lib/constants";
import fantasyMap from '../assets/fantasy_map_board.png';
import { BoardCell } from "./game/BoardCell";
import { PlayerToken } from "./game/PlayerToken";
import { getCellPosition } from "./game/utils";

interface BoardProps {
    players: Player[];
    displayPositions?: Record<string, number>;
    thinkingPlayerId?: string | null;
    activePortalCell?: number | null;
    portals?: Record<number, number>;
    activeCardEffect?: ActiveCardEffect | null;
}

export function Board({ players, displayPositions, thinkingPlayerId, activePortalCell, portals, activeCardEffect }: BoardProps) {
    const cells = Array.from({ length: 100 }, (_, i) => 100 - i);
    const activePortals = portals || SNAKES_LADDERS;

    // Internal state for smooth animation
    const [animatedPositions, setAnimatedPositions] = useState<Record<string, number>>({});

    // Sync animated positions with displayPositions (or raw player positions)
    useEffect(() => {
        // We use displayPositions from parent (which likely comes from useGameRoom hook handling step-by-step)
        // BUT if displayPositions is missing, fallback to direct player.position?
        // Actually, the hook is supposed to handle the step-by-step animation.
        // If the user says "character jumps far then walks", maybe the hook is updating too fast
        // OR the initial render is showing the final position immediately.

        if (displayPositions) {
            setAnimatedPositions(displayPositions);
        } else {
             const positions: Record<string, number> = {};
             players.forEach(p => { positions[p.id] = p.position || 0; });
             setAnimatedPositions(positions);
        }
    }, [displayPositions, players]);

    // Separate portals into ladders (up) and snakes (down)
    const portalList = Object.entries(activePortals).map(([from, to]) => ({
        from: Number(from),
        to: Number(to),
        isLadder: Number(to) > Number(from),
    }));

    return (
        <div className="relative w-full max-w-[98vw] md:max-w-[85vh] lg:max-w-[90vh] aspect-square rounded-xl shadow-2xl overflow-hidden border border-[#8B4513]/50 mx-auto">
            {/* Fantasy Map Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${fantasyMap})` }}
            />

            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 z-10">
                {cells.map((cellNum) => {
                    const { rowFromTop, colIndex } = getCellPosition(cellNum);
                    
                    return (
                        <BoardCell
                            key={cellNum}
                            cellNum={cellNum}
                            rowFromTop={rowFromTop}
                            colIndex={colIndex}
                            portal={activePortals[cellNum]}
                            isChallenge={CHALLENGE_CELLS.has(cellNum)}
                            isTreasure={TREASURE_CELLS.has(cellNum)}
                            activePortalCell={activePortalCell || null}
                        />
                    );
                })}
            </div>

            {/* Portal connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[11]" viewBox="0 0 100 100" preserveAspectRatio="none">
                {portalList.map(({ from, to, isLadder }) => {
                    const fromPos = getCellPosition(from);
                    const toPos = getCellPosition(to);
                    const x1 = fromPos.colIndex * 10 + 5;
                    const y1 = fromPos.rowFromTop * 10 + 5;
                    const x2 = toPos.colIndex * 10 + 5;
                    const y2 = toPos.rowFromTop * 10 + 5;
                    
                    return (
                        <line
                            key={`${from}-${to}`}
                            x1={x1} y1={y1}
                            x2={x2} y2={y2}
                            stroke={isLadder ? "#60A5FA" : "#EF4444"}
                            strokeWidth="1.5"
                            strokeDasharray="4,2"
                            opacity={0.8}
                            vectorEffect="non-scaling-stroke"
                        />
                    );
                })}
            </svg>

            {/* Players */}
            {players.map((player, playerIndex) => (
                <PlayerToken
                    key={player.id}
                    player={player}
                    playerIndex={playerIndex}
                    displayPosition={animatedPositions[player.id] ?? player.position}
                    thinkingPlayerId={thinkingPlayerId}
                    activeCardEffect={activeCardEffect}
                />
            ))}
        </div>
    );
}
