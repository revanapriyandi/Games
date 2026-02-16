import { Button } from "./ui/button";
import { motion } from "framer-motion";

interface ChallengeModalProps {
    isOpen: boolean;
    challenge: string;
    penalty?: { type: 'steps' | 'skip_turn', value: number };
    onComplete: () => void;
    isActivePlayer: boolean;
    playerName: string;
    themeName?: string;
    onFail?: () => void;
}

export function ChallengeModal({ isOpen, challenge, penalty, onComplete, isActivePlayer, playerName, themeName, onFail }: ChallengeModalProps) {
    if (!isOpen) return null;

    const formattedTheme = themeName?.toUpperCase();
    const title = formattedTheme 
        ? (formattedTheme.startsWith("TANTANGAN") ? `⚡ ${formattedTheme}!` : `⚡ TANTANGAN ${formattedTheme}!`)
        : "⚡ TANTANGAN!";

    const penaltyText = penalty?.type === 'skip_turn' 
        ? `Lewati ${penalty.value} Giliran` 
        : `Mundur ${penalty?.value || 3} Langkah`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-white/20 p-8 rounded-2xl max-w-lg w-full shadow-2xl text-center"
            >
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500 mb-2">
                        {title}
                    </h2>
                    <p className="text-gray-400 text-sm uppercase tracking-widest">
                        {isActivePlayer ? "Lakukan tugas ini:" : `${playerName} harus:`}
                    </p>
                </div>

                <div className="bg-white/10 p-6 rounded-xl mb-8 border border-white/5 min-h-[160px] flex items-center justify-center">
                    {challenge === "...GENERATING..." ? (
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
                            />
                            <motion.p
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-indigo-300 font-mono text-sm"
                            >
                                Meracik tantangan pedas...
                            </motion.p>
                        </div>
                    ) : (
                        <div className="max-h-[35vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            <p className="text-lg md:text-2xl text-white font-medium leading-relaxed">
                                {challenge}
                            </p>
                        </div>
                    )}
                </div>

                {!isActivePlayer ? (
                    <Button
                        onClick={onComplete}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 text-lg"
                    >
                        VERIFIKASI SELESAI (Dia sudah melakukan?)
                    </Button>
                ) : (
                    <div className="flex flex-col gap-3 w-full">
                        <div className="text-yellow-400 font-mono animate-pulse text-sm">
                            Lakukan tantangan ini agar temanmu memverifikasi!
                        </div>

                        {onFail && (
                            <Button
                                variant="destructive"
                                onClick={onFail}
                                className="w-full bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-500/30 text-xs py-3 mt-2"
                            >
                                💀 GAGAL / MENYERAH (Sanksi: {penaltyText})
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
