import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState, Player } from "../../lib/types";
import { getAvatarImage } from "../KnightAvatar";
import { getRole } from "../../lib/roles";

interface PlayerTabsProps {
    players: Player[];
    currentTurnIndex: number;
    aiConfig?: GameState["aiConfig"];
}

export function PlayerTabs({ players, currentTurnIndex, aiConfig }: PlayerTabsProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

    return (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 flex gap-1">
            {players.map((p, index) => {
                const isActive = currentTurnIndex === index;
                const isSelected = selectedPlayer === p.id;
                const avatarImg = p.customAvatarUrl || getAvatarImage(p.avatar, index);
                const role = p.role ? getRole(p.role) : null;

                return (
                    <div key={p.id} className="relative">
                        <motion.div
                            onClick={() => setSelectedPlayer(isSelected ? null : p.id)}
                            animate={isActive ? { y: [0, -2, 0] } : {}}
                            transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
                            className={`cursor-pointer px-2 pt-1 pb-1.5 rounded-b-xl transition-all flex flex-col items-center ${
                                isActive
                                    ? 'bg-gradient-to-b from-yellow-600/80 to-yellow-900/80 border border-t-0 border-yellow-400 shadow-[0_4px_15px_rgba(234,179,8,0.4)]'
                                    : 'bg-black/60 border border-t-0 border-white/10 opacity-70 hover:opacity-100'
                            }`}
                        >
                            <img
                                src={avatarImg}
                                alt={p.name}
                                className={`w-7 h-7 drop-shadow-lg ${p.customAvatarUrl ? 'rounded-full object-cover border border-white/20' : 'object-contain'}`}
                            />
                            {role && <span className="text-[8px] -mt-1">{role.emoji}</span>}
                        </motion.div>

                        {/* Detail popup */}
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                    className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 min-w-[140px] shadow-2xl z-50 pointer-events-none"
                                >
                                    <div className="flex flex-col items-center gap-1.5">
                                        <img
                                            src={avatarImg}
                                            alt={p.name}
                                            className={`w-12 h-12 ${p.customAvatarUrl ? 'rounded-full object-cover border border-white/20' : 'object-contain'}`}
                                        />
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-white font-bold whitespace-nowrap">{p.name}</span>
                                            {role && (
                                                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                                                    {role.emoji} {role.name}
                                                </span>
                                            )}
                                        </div>
                                        {aiConfig?.heroTitles?.[index] && (
                                            <span className="text-[9px] text-purple-300 italic text-center leading-tight">"{aiConfig.heroTitles[index]}"</span>
                                        )}
                                        <span className="text-[10px] text-yellow-300 font-mono bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                            Petak #{p.position || 1}
                                        </span>
                                        {p.giveUpCount && p.giveUpCount > 0 ? (
                                            <span className="text-[10px] text-red-300 font-mono bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                                🏳️ x {p.giveUpCount}
                                            </span>
                                        ) : null}
                                        {isActive && (
                                            <span className="text-[9px] text-green-400 font-bold animate-pulse">🎯 GILIRAN</span>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
