import { motion } from "framer-motion";
import { Dice } from "../Dice";
import type { GameState } from "../../lib/types";

interface GameControlsProps {
    gameState: GameState;
    handleRoll: () => void;
    disabled: boolean;
    showResult: boolean;
}

export function GameControls({ gameState, handleRoll, disabled, showResult }: GameControlsProps) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            whileDrag={{ scale: 1.15, cursor: "grabbing" }}
            style={{ cursor: "grab" }}
            className="fixed right-6 bottom-8 md:right-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-[60] touch-none"
        >
            <Dice
                rolling={!!gameState.isRolling}
                value={gameState.lastRoll}
                onRoll={handleRoll}
                disabled={disabled}
                showResult={showResult}
            />
        </motion.div>
    );
}
