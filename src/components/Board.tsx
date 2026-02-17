import type { Player, ActiveCardEffect } from "../lib/types";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
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
    // Use displayPositions directly if provided, otherwise fallback to player.position
    // This avoids unnecessary state synchronization and re-renders
    const currentPositions = displayPositions ||
        Object.fromEntries(players.map(p => [p.id, p.position || 1]));

    return (
        <div className="relative w-full max-w-[98vw] md:max-w-[85vh] lg:max-w-[90vh] aspect-square rounded-xl shadow-2xl overflow-hidden border border-[#8B4513]/50 mx-auto select-none bg-black">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
                limitToBounds={true}
                wheel={{ step: 0.1 }}
                pinch={{ step: 5 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute bottom-4 right-4 z-[40] flex flex-col gap-1.5 p-1 bg-black/60 rounded-lg backdrop-blur-sm border border-white/10 shadow-xl">
                            <button
                                onClick={() => zoomIn()}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn size={16} />
                            </button>
                            <button
                                onClick={() => zoomOut()}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={() => resetTransform()}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                                title="Reset View"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>

                        <TransformComponent
                            wrapperClass="w-full h-full cursor-grab active:cursor-grabbing"
                            contentClass="w-full h-full relative"
                            wrapperStyle={{ width: '100%', height: '100%' }}
                        >
                            {/* Fantasy Map Background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-80"
                                style={{ backgroundImage: `url(${fantasyMap})` }}
                            />

                            {/* Render memoized grid and lines */}
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
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
