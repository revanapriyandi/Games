import { motion } from "framer-motion";
import type { Player, ActiveCardEffect } from "../../lib/types";
import { getAvatarImage } from "../KnightAvatar";
import { getCellPosition } from "./utils";
import { getRole } from "../../lib/roles";

interface PlayerTokenProps {
    player: Player;
    playerIndex: number;
    displayPosition?: number;
    thinkingPlayerId?: string | null;
    activeCardEffect?: ActiveCardEffect | null;
}

export function PlayerToken({ player, playerIndex, displayPosition, thinkingPlayerId, activeCardEffect }: PlayerTokenProps) {
    const pos = displayPosition ?? (player.position || 1);
    const { rowFromTop, colIndex } = getCellPosition(pos);

    const cellSize = 10;
    const top = `${rowFromTop * cellSize + 1}%`;
    const left = `${colIndex * cellSize}%`;
    const avatarImg = player.customAvatarUrl || getAvatarImage(player.avatar, playerIndex);
    const role = player.role ? getRole(player.role) : null;

    const isOverridden = displayPosition !== undefined;

    return (
        <motion.div
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
            <div className="bg-black/80 text-[5px] md:text-[7px] text-white px-1 rounded font-bold whitespace-nowrap border border-white/20 leading-tight z-40 relative">
                {player.name.substring(0, 4)}
            </div>

            {/* Role Badge */}
            {role && (
                <div className="absolute -top-1 -right-1 bg-black/80 text-[8px] rounded-full w-3 h-3 flex items-center justify-center border border-white/20 z-40 shadow-sm" title={role.name}>
                    {role.emoji}
                </div>
            )}

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

            {/* Avatar Image */}
            <img
                src={avatarImg}
                alt={player.name}
                className={`w-full h-[70%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                    player.customAvatarUrl ? 'object-cover rounded-full border border-white/20 aspect-square' : 'object-contain'
                } ${
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
}
