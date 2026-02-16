import { motion } from "framer-motion";
import type { Player, ActiveCardEffect } from "../lib/types";
import { SNAKES_LADDERS } from "../lib/game";
import { CHALLENGE_CELLS, TREASURE_CELLS } from "../lib/constants";
import fantasyMap from '../assets/fantasy_map_board.png';
import portalLadderImg from '../assets/portal_ladder.png';
import portalSnakeImg from '../assets/portal_snake.png';
import { getAvatarImage } from "./KnightAvatar";

interface BoardProps {
    players: Player[];
    displayPositions?: Record<string, number>;
    thinkingPlayerId?: string | null;
    activePortalCell?: number | null;
    portals?: Record<number, number>;
    activeCardEffect?: ActiveCardEffect | null;
}

// Helper: convert cell number to grid position
function getCellPosition(cellNum: number) {
    const rowIndex = Math.floor((cellNum - 1) / 10);
    const rowFromTop = 9 - rowIndex;
    const colIndex = (rowIndex % 2 === 0)
        ? (cellNum - 1) % 10
        : 9 - ((cellNum - 1) % 10);
    return { rowFromTop, colIndex };
}

export function Board({ players, displayPositions, thinkingPlayerId, activePortalCell, portals, activeCardEffect }: BoardProps) {
    const cells = Array.from({ length: 100 }, (_, i) => 100 - i);
    const activePortals = portals || SNAKES_LADDERS;

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
                    const portal = activePortals[cellNum];
                    const isLadder = portal !== undefined && portal > cellNum;
                    const isSnake = portal !== undefined && portal < cellNum;
                    const isChallenge = CHALLENGE_CELLS.has(cellNum);
                    const isTreasure = TREASURE_CELLS.has(cellNum);
                    
                    return (
                        <div 
                            key={cellNum}
                            style={{
                                gridRow: rowFromTop + 1,
                                gridColumn: colIndex + 1
                            }}
                            className={`
                                relative flex items-center justify-center border-[0.5px] border-white/5
                                ${cellNum === 100 ? 'bg-yellow-500/40' : ''}
                                ${cellNum === 1 ? 'bg-green-500/40' : ''}
                                ${isChallenge && !isLadder && !isSnake ? 'bg-amber-500/15' : ''}
                                ${isTreasure && !isLadder && !isSnake ? 'bg-purple-500/15' : ''}
                            `}
                        >
                            <span className="absolute top-0.5 left-0.5 z-[5] text-[7px] md:text-[9px] font-bold text-white bg-black/30 backdrop-blur-[1px] px-0.5 rounded-br text-center leading-none shadow-sm min-w-[12px]">
                                {cellNum}
                            </span>

                            {/* Challenge cell indicator */}
                            {isChallenge && !isLadder && !isSnake && (
                                <span className="absolute top-0 right-0 text-[6px] md:text-[8px] leading-none select-none opacity-70">⚡</span>
                            )}

                            {/* Treasure cell indicator */}
                            {isTreasure && !isLadder && !isSnake && (
                                <motion.span 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-0 right-0 text-[6px] md:text-[8px] leading-none select-none"
                                >
                                    💎
                                </motion.span>
                            )}

                            {/* Portal indicator - ladder (up) */}
                            {isLadder && (
                                <>
                                    <motion.div
                                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-sm pointer-events-none"
                                        style={{
                                            background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0) 70%)',
                                        }}
                                    />
                                    <motion.img
                                        src={portalLadderImg}
                                        alt="Ladder"
                                        animate={activePortalCell === cellNum ? {
                                            scale: [1, 2.5, 2.2],
                                            rotate: [0, 180, 360],
                                        } : { 
                                            scale: [0.9, 1.1, 0.9],
                                            rotate: [0, 10, -10, 0],
                                        }}
                                        transition={activePortalCell === cellNum ? {
                                            duration: 0.8,
                                            ease: "easeOut",
                                        } : {
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className={`absolute w-[70%] h-[70%] object-contain pointer-events-none z-[2] ${
                                            activePortalCell === cellNum 
                                                ? 'opacity-100 drop-shadow-[0_0_20px_rgba(34,211,238,1)]' 
                                                : 'opacity-80 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]'
                                        }`}
                                    />
                                    <span className="absolute bottom-0 right-0 text-[5px] md:text-[7px] text-green-300 font-black leading-none opacity-70 drop-shadow-[0_0_3px_rgba(34,197,94,0.8)] z-[1]">
                                        ▲{portal}
                                    </span>
                                </>
                            )}
                            {/* Portal indicator - snake (down) */}
                            {isSnake && (
                                <>
                                    <motion.div
                                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        className="absolute inset-0 rounded-sm pointer-events-none"
                                        style={{
                                            background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0) 70%)',
                                        }}
                                    />
                                    <motion.img
                                        src={portalSnakeImg}
                                        alt="Snake"
                                        animate={activePortalCell === cellNum ? {
                                            scale: [1, 2.5, 2.2],
                                            rotate: [0, -180, -360],
                                        } : { 
                                            scale: [0.9, 1.1, 0.9],
                                            rotate: [0, -10, 10, 0],
                                        }}
                                        transition={activePortalCell === cellNum ? {
                                            duration: 0.8,
                                            ease: "easeOut",
                                        } : {
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 1,
                                        }}
                                        className={`absolute w-[70%] h-[70%] object-contain pointer-events-none z-[2] ${
                                            activePortalCell === cellNum 
                                                ? 'opacity-100 drop-shadow-[0_0_20px_rgba(239,68,68,1)]' 
                                                : 'opacity-80 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]'
                                        }`}
                                    />
                                    <span className="absolute bottom-0 right-0 text-[5px] md:text-[7px] text-red-300 font-black leading-none opacity-70 drop-shadow-[0_0_3px_rgba(239,68,68,0.8)] z-[1]">
                                        ▼{portal}
                                    </span>
                                </>
                            )}
                        </div>
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
            {players.map((player, playerIndex) => {
                const pos = displayPositions?.[player.id] ?? (player.position || 1); 
                const { rowFromTop, colIndex } = getCellPosition(pos);
                
                const cellSize = 10;
                const top = `${rowFromTop * cellSize + 1}%`;
                const left = `${colIndex * cellSize}%`;
                const avatarImg = getAvatarImage(player.avatar, playerIndex);

                // If displayPositions is overriding, use instant positioning (no spring)
                const isOverridden = displayPositions?.[player.id] !== undefined;

                return (
                    <motion.div
                        key={player.id}
                        animate={{ top, left }}
                        transition={isOverridden 
                            ? { duration: 0.15, ease: "easeOut" }
                            : { type: "spring", stiffness: 300, damping: 30 }
                        }
                        className="absolute flex flex-col items-center justify-center z-20 pointer-events-none"
                        style={{ 
                            zIndex: 20 + playerIndex,
                            width: `${cellSize}%`,
                            height: `${cellSize}%`,
                        }}
                    >
                        {/* Player Name */}
                        <div className="bg-black/80 text-[5px] md:text-[7px] text-white px-1 rounded font-bold whitespace-nowrap border border-white/20 leading-tight">
                            {player.name.substring(0, 4)}
                        </div>
                        {/* Thinking indicator */}
                        {thinkingPlayerId === player.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: [0, -8, 0] }}
                                transition={{ y: { duration: 0.6, repeat: Infinity }, opacity: { duration: 0.2 } }}
                                className="absolute -top-4 text-xl z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                            >
                                ❓
                            </motion.div>
                        )}
                        {/* Knight Image */}
                        <img 
                            src={avatarImg} 
                            alt={player.name}
                            className={`w-full h-[70%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                activeCardEffect?.targetId === player.id ? 'brightness-75' : ''
                            }`}
                        />
                        {/* Status badges */}
                        <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-0.5 z-30">
                            {player.hasShield && (
                                <span className="text-[8px] md:text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" title="Perisai aktif">🛡️</span>
                            )}
                            {player.doubleDice && (
                                <span className="text-[8px] md:text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" title="Dadu Ganda">🎲</span>
                            )}
                            {player.extraTurn && (
                                <span className="text-[8px] md:text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" title="Bonus Giliran">⚡</span>
                            )}
                            {(player.skippedTurns ?? 0) > 0 && (
                                <span className="text-[8px] md:text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" title="Skip giliran">⛓️</span>
                            )}
                        </div>
                        {/* Card effect animation on target */}
                        {activeCardEffect?.targetId === player.id && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: [0, 1.5, 1], y: [0, -15, -10] }}
                                transition={{ duration: 0.6 }}
                                className="absolute -top-5 text-2xl z-40 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                            >
                                {activeCardEffect.emoji}
                            </motion.div>
                        )}
                        {/* Card effect animation on self-use */}
                        {activeCardEffect?.userId === player.id && !activeCardEffect?.targetId && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: [0, 1.5, 1], y: [0, -15, -10] }}
                                transition={{ duration: 0.6 }}
                                className="absolute -top-5 text-2xl z-40 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                            >
                                {activeCardEffect.emoji}
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
