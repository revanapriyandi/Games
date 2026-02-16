import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { playDiceRollSound } from "../lib/sounds";

interface DiceProps {
    rolling: boolean;
    value: number | null;
    onRoll: () => void;
    disabled?: boolean;
    showResult?: boolean;
}

function DiceFace({ value, size = 40 }: { value: number; size?: number }) {
    const dotPositions: Record<number, [number, number][]> = {
        1: [[50, 50]],
        2: [[30, 30], [70, 70]],
        3: [[30, 30], [50, 50], [70, 70]],
        4: [[30, 30], [70, 30], [30, 70], [70, 70]],
        5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
        6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
    };
    const dots = dotPositions[value] || dotPositions[1];

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {dots.map(([x, y], i) => (
                <div
                    key={i}
                    className="absolute bg-white rounded-full"
                    style={{
                        left: `${x}%`, top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '20%', height: '20%',
                    }}
                />
            ))}
        </div>
    );
}

export function Dice({ rolling, value, onRoll, disabled, showResult }: DiceProps) {
    const canRoll = !disabled && !rolling;
    const [rollingFace, setRollingFace] = useState(1);

    // Cycle through dice faces 1-6 rapidly when rolling
    useEffect(() => {
        if (!rolling) return;
        const interval = setInterval(() => {
            setRollingFace(prev => (prev % 6) + 1);
            playDiceRollSound(); 
        }, 80);
        return () => clearInterval(interval);
    }, [rolling]);

    return (
        <>
            {/* Simple clickable dice */}
            <motion.div
                animate={canRoll ? {
                    y: [0, -6, 0],
                    rotate: [0, 3, -3, 0],
                    scale: [1, 1.05, 1],
                } : {
                    y: [0, -3, 0],
                }}
                transition={canRoll ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                } : {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                role="button"
                tabIndex={0}
                onClick={() => {
                    if (canRoll) onRoll();
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && canRoll) onRoll(); }}
                style={{
                    cursor: canRoll ? 'pointer' : 'not-allowed',
                    opacity: disabled ? 0.4 : 1,
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                }}
                whileHover={canRoll ? { scale: 1.15, rotate: 5 } : {}}
                whileTap={canRoll ? { scale: 0.9, rotate: -10 } : {}}
            >
                {/* Glow */}
                {canRoll && (
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -inset-3 bg-red-500/30 blur-xl rounded-full pointer-events-none" 
                    />
                )}

                {/* Dice cube */}
                <div
                    className={`relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden
                        bg-gradient-to-br from-red-500 via-red-600 to-red-800
                        shadow-[0_4px_0_#991b1b,0_6px_15px_rgba(0,0,0,0.4)]
                        border-2 border-red-400/50
                        ${rolling ? 'animate-bounce' : ''}
                    `}
                >
                    {rolling ? (
                        <DiceFace value={rollingFace} size={56} />
                    ) : value ? (
                        <DiceFace value={value} size={56} />
                    ) : (
                        <DiceFace value={1} size={56} />
                    )}
                </div>
            </motion.div>

            {/* ===== FULLSCREEN ROLLING OVERLAY (portaled to body) ===== */}
            {createPortal(
                <AnimatePresence>
                    {rolling && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 pointer-events-none"
                        >
                            <div className="flex flex-col items-center gap-8">
                                <motion.div
                                    animate={{
                                        rotateZ: [0, 90, 180, 270, 360],
                                        scale: [1, 1.3, 0.8, 1.2, 1],
                                        y: [0, -30, 10, -20, 0],
                                    }}
                                    transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
                                    className="w-36 h-36 rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-[0_0_80px_rgba(239,68,68,0.7)] border-4 border-red-300/60 flex items-center justify-center"
                                >
                                    <DiceFace value={rollingFace} size={120} />
                                </motion.div>
                                <motion.p
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{ duration: 0.4, repeat: Infinity }}
                                    className="text-xl md:text-3xl font-black text-white tracking-[0.2em] md:tracking-[0.3em] text-center px-4"
                                >
                                    MENGUNDI NASIB...
                                </motion.p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ===== FULLSCREEN RESULT OVERLAY (portaled to body) ===== */}
            {createPortal(
                <AnimatePresence>
                    {showResult && value && !rolling && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-[0_0_100px_rgba(239,68,68,0.9)] border-4 border-yellow-400 flex items-center justify-center">
                                    <DiceFace value={value} size={130} />
                                </div>
                                <motion.p
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-5xl font-black text-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                                >
                                    {value}!
                                </motion.p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
