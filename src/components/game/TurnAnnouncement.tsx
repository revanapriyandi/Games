import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "../../lib/types";

interface TurnAnnouncementProps {
    currentTurnIndex: number;
    isTurn: boolean;
    activePlayer?: Player;
}

export function TurnAnnouncement({ currentTurnIndex, isTurn, activePlayer }: TurnAnnouncementProps) {
    return (
        <AnimatePresence>
            <motion.div
                key={`turn-${currentTurnIndex}`}
                initial={{ opacity: 0, y: -60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -60 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="fixed top-16 left-1/2 -translate-x-1/2 z-30"
            >
                <motion.div
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{ duration: 4, times: [0, 0.7, 1] }}
                    className={`px-5 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl text-sm font-bold whitespace-nowrap ${isTurn ? 'bg-green-500/20 border-green-500 text-green-300 shadow-green-500/20' : 'bg-black/70 border-white/10 text-gray-300'}`}
                >
                    {isTurn ? "🎯 GILIRANMU!" : `⏳ GILIRAN ${activePlayer?.name}`}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
