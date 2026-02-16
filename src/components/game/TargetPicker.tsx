import { motion, AnimatePresence } from "framer-motion";
import type { Player, TreasureCard } from "../../lib/types";
import { getAvatarImage } from "../KnightAvatar";
import { playCardUseSound } from "../../lib/sounds";

interface TargetPickerProps {
    card: TreasureCard;
    players: Player[];
    currentPlayerId: string;
    onSelect: (targetId: string) => void;
    onCancel: () => void;
}

export function TargetPicker({ card, players, currentPlayerId, onSelect, onCancel }: TargetPickerProps) {
    return (
        <AnimatePresence>
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
                        {card.emoji} {card.name}
                    </h3>
                    <p className="text-gray-400 text-xs text-center mb-4">Pilih target pemain:</p>
                    <div className="flex flex-col gap-2">
                        {players.filter(p => p.id !== currentPlayerId).map((p, index) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    playCardUseSound();
                                    onSelect(p.id);
                                }}
                                className="flex items-center gap-3 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/20 rounded-xl transition-all cursor-pointer"
                            >
                                <img src={getAvatarImage(p.avatar, index)} alt={p.name} className="w-8 h-8 object-contain" />
                                <div className="flex flex-col text-left">
                                    <span className="text-white text-sm font-bold">{p.name}</span>
                                    <span className="text-gray-400 text-[10px]">Petak #{p.position || 1}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onCancel}
                        className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
