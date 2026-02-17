import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Player, TreasureCard } from "../../lib/types";
import { playCardUseSound } from "../../lib/sounds";

interface CardInventoryProps {
    player: Player;
    isTurn: boolean;
    onPlayCard: (cardIndex: number, card: TreasureCard) => void;
}

export function CardInventory({ player, isTurn, onPlayCard }: CardInventoryProps) {
    const [showCardInventory, setShowCardInventory] = useState(false);
    const cardCount = player.cards?.length ?? 0;

    if (cardCount === 0) return null;

    return (
        <div className="fixed left-3 bottom-14 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setShowCardInventory(!showCardInventory)}
                className="px-4 py-2.5 bg-purple-600/80 hover:bg-purple-500/80 text-white text-sm font-bold rounded-xl border border-purple-400/30 shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
            >
                🎴 <span>{cardCount} Kartu</span>
            </button>

            {/* Card List Panel */}
            <AnimatePresence>
                {showCardInventory && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-14 left-0 bg-slate-900/95 border border-purple-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-md w-[280px] md:w-[320px]"
                    >
                        <div className="text-xs text-purple-300 font-bold mb-2 px-1 uppercase tracking-wider">
                            🎴 Kartu Kamu
                        </div>
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                            {player.cards?.map((card, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={isTurn ? { scale: 1.02 } : {}}
                                    whileTap={isTurn ? { scale: 0.98 } : {}}
                                    onClick={() => {
                                        if (!isTurn) return;
                                        playCardUseSound();
                                        onPlayCard(idx, card);
                                        setShowCardInventory(false);
                                    }}
                                    disabled={!isTurn}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all cursor-pointer ${
                                        isTurn
                                            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/35 hover:to-indigo-500/35 border border-purple-500/25 hover:border-purple-400/50 shadow-md hover:shadow-purple-500/20'
                                            : 'bg-slate-800/50 opacity-50 cursor-not-allowed border border-slate-700/20'
                                    }`}
                                >
                                    <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-black/30 rounded-lg text-2xl">
                                        {card.emoji}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm text-white font-bold leading-tight truncate">
                                            {card.name}
                                        </span>
                                        <span className="text-xs text-gray-400 leading-snug mt-0.5">
                                            {card.description}
                                        </span>
                                    </div>
                                    {isTurn && (
                                        <div className="ml-auto shrink-0 text-[10px] text-purple-300 font-bold uppercase bg-purple-500/20 px-2 py-1 rounded-md">
                                            Pakai
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
