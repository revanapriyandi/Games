import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Player } from "../../lib/types";

interface TurnAnnouncementProps {
    currentTurnIndex: number;
    isTurn: boolean;
    activePlayer?: Player;
}

export function TurnAnnouncement({ currentTurnIndex, isTurn, activePlayer }: TurnAnnouncementProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => setVisible(true), 0);
        const timer2 = setTimeout(() => setVisible(false), 2500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [currentTurnIndex, isTurn]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key={`turn-${currentTurnIndex}`}
                    initial={{ opacity: 0, scale: 0.8, y: -50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.2, y: 50 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]"
                >
                    {isTurn ? (
                         <div className="relative">
                            <motion.div
                                 animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                                 transition={{ duration: 0.5 }}
                                 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] stroke-white"
                                 style={{ WebkitTextStroke: "2px white" }}
                            >
                                GILIRANMU!
                            </motion.div>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.2 }}
                                className="h-2 bg-white mt-2 rounded-full shadow-[0_0_15px_white]"
                            />
                         </div>
                    ) : (
                        <div className="bg-black/60 backdrop-blur-md border border-white/20 px-8 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-2">
                            <span className="text-gray-400 text-sm uppercase tracking-widest font-bold">Giliran</span>
                            <div className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                                <span className="text-4xl">{activePlayer?.avatar ? '🎲' : ''}</span>
                                {activePlayer?.name}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
