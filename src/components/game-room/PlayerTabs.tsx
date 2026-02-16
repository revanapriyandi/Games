import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAvatarImage } from "../KnightAvatar";
import type { Player } from "../../lib/types";

interface PlayerTabsProps {
    players: Player[];
    currentTurnIndex: number;
    heroTitles?: string[];
}

export function PlayerTabs({ players, currentTurnIndex, heroTitles }: PlayerTabsProps) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    return (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 flex gap-1">
            {players.map((player, index) => {
                const isActive = currentTurnIndex === index;
                const isSelected = selectedPlayerId === player.id;
                const heroTitle = heroTitles?.[index];

                return (
                    <div key={player.id} className="relative">
                        <motion.div
                            onClick={() => setSelectedPlayerId(isSelected ? null : player.id)}
                            animate={isActive ? { y: [0, -2, 0] } : {}}
                            transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
                            className={`cursor-pointer px-2 pt-1 pb-1.5 rounded-b-xl transition-all ${
                                isActive
                                    ? "bg-gradient-to-b from-yellow-600/80 to-yellow-900/80 border border-t-0 border-yellow-400 shadow-[0_4px_15px_rgba(234,179,8,0.4)]"
                                    : "bg-black/60 border border-t-0 border-white/10 opacity-70 hover:opacity-100"
                            }`}
                        >
                            <img src={getAvatarImage(player.avatar, index)} alt={player.name} className="w-7 h-7 object-contain drop-shadow-lg" />
                        </motion.div>

                        <AnimatePresence>
                            {isSelected && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                    className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 min-w-[120px] shadow-2xl z-50"
                                >
                                    <div className="flex flex-col items-center gap-1.5">
                                        <img
                                            src={getAvatarImage(player.avatar, index)}
                                            alt={player.name}
                                            className="w-12 h-12 object-contain"
                                        />
                                        <span className="text-xs text-white font-bold">{player.name}</span>
                                        {heroTitle && <span className="text-[9px] text-purple-300 italic">"{heroTitle}"</span>}
                                        <span className="text-[10px] text-yellow-300 font-mono bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                            Petak #{player.position || 1}
                                        </span>
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
