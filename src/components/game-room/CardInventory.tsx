import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playCard, clearCardEffect } from "../../lib/game";
import { playCardUseSound } from "../../lib/sounds";
import { getAvatarImage } from "../KnightAvatar";
import type { Player } from "../../lib/types";

interface CardInventoryProps {
    player?: Player;
    players: Player[];
    playerId: string;
    roomId: string;
    isTurn: boolean;
}

export function CardInventory({ player, players, playerId, roomId, isTurn }: CardInventoryProps) {
    const [showCardInventory, setShowCardInventory] = useState(false);
    const [usingCardIndex, setUsingCardIndex] = useState<number | null>(null);
    const cards = player?.cards ?? [];

    if (!player || cards.length === 0) {
        return null;
    }

    const handleUseCard = (cardIndex: number) => {
        playCardUseSound();
        playCard(roomId, playerId, cardIndex);
        setShowCardInventory(false);
        setTimeout(() => clearCardEffect(roomId), 2500);
    };

    const handleUseTargetCard = (targetId: string) => {
        if (usingCardIndex === null) return;
        playCardUseSound();
        playCard(roomId, playerId, usingCardIndex, targetId);
        setUsingCardIndex(null);
        setTimeout(() => clearCardEffect(roomId), 2500);
    };

    const selectedCard = usingCardIndex !== null ? cards[usingCardIndex] : null;

    return (
        <>
            <div className="fixed left-2 bottom-4 z-50">
                <button
                    onClick={() => setShowCardInventory(!showCardInventory)}
                    className="px-3 py-2 bg-purple-600/80 hover:bg-purple-500/80 text-white text-xs font-bold rounded-xl border border-purple-400/30 shadow-lg backdrop-blur-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                    🎴 {cards.length} Kartu
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
                                {cards.map((card, index) => (
                                    <button
                                        key={card.id}
                                        onClick={() => {
                                            if (card.targetType === "self") {
                                                handleUseCard(index);
                                            } else {
                                                setUsingCardIndex(index);
                                                setShowCardInventory(false);
                                            }
                                        }}
                                        disabled={!isTurn}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                            isTurn
                                                ? "bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/20"
                                                : "bg-slate-800/50 opacity-50 cursor-not-allowed border border-slate-700/20"
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

            <AnimatePresence>
                {usingCardIndex !== null && selectedCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="bg-slate-900/95 border border-purple-500/40 rounded-2xl p-5 max-w-xs w-full shadow-2xl"
                        >
                            <h3 className="text-white font-bold text-center mb-1">
                                {selectedCard.emoji} {selectedCard.name}
                            </h3>
                            <p className="text-gray-400 text-xs text-center mb-4">Pilih target pemain:</p>
                            <div className="flex flex-col gap-2">
                                {players
                                    .filter((targetPlayer) => targetPlayer.id !== playerId)
                                    .map((targetPlayer, index) => (
                                        <button
                                            key={targetPlayer.id}
                                            onClick={() => handleUseTargetCard(targetPlayer.id)}
                                            className="flex items-center gap-3 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/20 rounded-xl transition-all cursor-pointer"
                                        >
                                            <img
                                                src={getAvatarImage(targetPlayer.avatar, index)}
                                                alt={targetPlayer.name}
                                                className="w-8 h-8 object-contain"
                                            />
                                            <div className="flex flex-col text-left">
                                                <span className="text-white text-sm font-bold">{targetPlayer.name}</span>
                                                <span className="text-gray-400 text-[10px]">Petak #{targetPlayer.position || 1}</span>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                            <button
                                onClick={() => setUsingCardIndex(null)}
                                className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
