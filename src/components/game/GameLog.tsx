import { motion, AnimatePresence } from "framer-motion";

interface GameLogProps {
    logs: string[];
}

export function GameLog({ logs }: GameLogProps) {
    if (!logs || logs.length === 0) return null;

    return (
        <AnimatePresence mode='wait'>
            <motion.div
                key={logs.length}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3, type: "spring", damping: 20 }}
                className="fixed top-14 left-1/2 -translate-x-1/2 z-30"
            >
                <motion.div
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{ duration: 3.5, times: [0, 0.6, 1] }}
                    className="px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-yellow-500/20 text-[11px] text-yellow-300/90 font-medium whitespace-nowrap"
                >
                    {logs[logs.length - 1]}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
