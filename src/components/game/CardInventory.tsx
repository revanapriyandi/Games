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
        <div className="fixed left-2 bottom-4 z-50">
            <button
                onClick={() => setShowCardInventory(!showCardInventory)}
                className="px-3 py-2 bg-purple-600/80 hover:bg-purple-500/80 text-white text-xs font-bold rounded-xl border border-purple-400/30 shadow-lg backdrop-blur-sm transition-all flex items-center gap-1 cursor-pointer"
            >
                🎴 {cardCount} Kartu
            </button>
            <AnimatePresence>
                {showCardInventory && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-12 left-0 bg-slate-900/95 border border-purple-500/30 rounded-xl p-2 shadow-2xl backdrop-blur-md min-w-[180px] max-w-[220px]"
                    >
                        <div className="text-[10px] text-purple-300 font-bold mb-1.5 px-1">KARTU KAMU:</div>
                        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                            {player.cards?.map((card, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        playCardUseSound();
                                        onPlayCard(idx, card);
                                        // If self-target, we might want to close inventory.
                                        // Let parent handle logic, but we can close inventory here if needed.
                                        if (card.targetType === 'self') {
                                            setShowCardInventory(false);
                                        } else {
                                            setShowCardInventory(false);
                                        }
                                    }}
                                    disabled={!isTurn}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                        isTurn
                                            ? 'bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/20'
                                            : 'bg-slate-800/50 opacity-50 cursor-not-allowed border border-slate-700/20'
                                    }`}
                                >
                                    <span className="text-lg">{card.emoji}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white font-bold leading-tight">{card.name}</span>
                                        <span className="text-[8px] text-gray-400 leading-tight">{card.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
