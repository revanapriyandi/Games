import { motion, AnimatePresence } from "framer-motion";
import portalLadderImg from "../assets/portal_ladder.png";
import portalSnakeImg from "../assets/portal_snake.png";

interface PortalAnimationProps {
    isOpen: boolean;
    type: "ladder" | "snake";
    fromCell: number;
    toCell: number;
    playerAvatar: string;
    onComplete: () => void;
}

interface ParticleData {
    x: number;
    y: number;
    duration: number;
    delay: number;
    size: number;
    hueOffset: number;
    lightOffset: number;
}

// Pre-computed at module load to avoid Math.random during render
const PARTICLES: ParticleData[] = Array.from({ length: 30 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 2 + Math.random() * 1.5,
    delay: Math.random() * 0.8,
    size: 4 + Math.random() * 6,
    hueOffset: Math.random() * 20,
    lightOffset: Math.random() * 30,
}));

export function PortalAnimation({ isOpen, type, fromCell, toCell, playerAvatar, onComplete }: PortalAnimationProps) {
    const isLadder = type === "ladder";
    const portalImg = isLadder ? portalLadderImg : portalSnakeImg;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)" }}
                >
                    {/* Particle field background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {PARTICLES.map((p: ParticleData, i: number) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: `${p.x}%`,
                                    y: `${p.y}%`,
                                    opacity: 0,
                                    scale: 0,
                                }}
                                animate={{
                                    y: isLadder ? [null, "-20%"] : [null, "120%"],
                                    opacity: [0, 0.8, 0],
                                    scale: [0, 1.5, 0],
                                }}
                                transition={{
                                    duration: p.duration,
                                    delay: p.delay,
                                    ease: "easeOut",
                                }}
                                className="absolute rounded-full"
                                style={{
                                    width: p.size,
                                    height: p.size,
                                    background: isLadder
                                        ? `hsl(${170 + p.hueOffset}, 100%, ${60 + p.lightOffset}%)`
                                        : `hsl(${340 + p.hueOffset}, 100%, ${50 + p.lightOffset}%)`,
                                    filter: "blur(1px)",
                                }}
                            />
                        ))}
                    </div>

                    {/* Main portal scene */}
                    <div className="relative flex flex-col items-center gap-4">
                        {/* Title text - appears first */}
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-center z-10"
                        >
                            <motion.h2
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={`text-3xl md:text-4xl font-black tracking-wider ${isLadder ? "text-cyan-300" : "text-red-400"}`}
                                style={{
                                    textShadow: isLadder
                                        ? "0 0 30px rgba(34,211,238,0.8), 0 0 60px rgba(34,211,238,0.4)"
                                        : "0 0 30px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.4)",
                                }}
                            >
                                {isLadder ? "⬆ PORTAL UP!" : "⬇ DRAGGED DOWN!"}
                            </motion.h2>
                        </motion.div>

                        {/* Portal container */}
                        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                            {/* Portal glow ring */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [0, 1.3, 1.1],
                                    opacity: [0, 0.6, 0.4],
                                    rotate: isLadder ? [0, 360] : [0, -360],
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute w-full h-full rounded-full"
                                style={{
                                    background: isLadder
                                        ? "radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%)"
                                        : "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)",
                                    filter: "blur(20px)",
                                }}
                            />

                            {/* Portal image - spawns and swirls */}
                            <motion.div
                                initial={{ scale: 0, rotate: isLadder ? -180 : 180, opacity: 0 }}
                                animate={{
                                    scale: [0, 1.2, 1],
                                    rotate: [isLadder ? -180 : 180, 0],
                                    opacity: [0, 1, 1],
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative w-52 h-52 md:w-64 md:h-64"
                            >
                                {/* Inner glow pulse */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.15, 1],
                                        opacity: [0.5, 0.9, 0.5],
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: isLadder
                                            ? "radial-gradient(circle, rgba(34,211,238,0.5) 0%, transparent 60%)"
                                            : "radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 60%)",
                                    }}
                                />
                                <img
                                    src={portalImg}
                                    alt={isLadder ? "Ladder Portal" : "Snake Portal"}
                                    className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                                    style={{
                                        filter: isLadder
                                            ? "drop-shadow(0 0 30px rgba(34,211,238,0.8))"
                                            : "drop-shadow(0 0 30px rgba(239,68,68,0.8))",
                                    }}
                                />

                                {/* Door opening effect - two halves splitting */}
                                {isLadder && (
                                    <>
                                        <motion.div
                                            initial={{ x: 0 }}
                                            animate={{ x: "-100%", opacity: [1, 1, 0] }}
                                            transition={{ delay: 1.0, duration: 0.8, ease: "easeInOut" }}
                                            className="absolute inset-0 z-20 overflow-hidden"
                                            style={{ clipPath: "inset(0 50% 0 0)" }}
                                        >
                                            <div className="w-full h-full bg-gradient-to-r from-cyan-900/80 to-transparent" />
                                        </motion.div>
                                        <motion.div
                                            initial={{ x: 0 }}
                                            animate={{ x: "100%", opacity: [1, 1, 0] }}
                                            transition={{ delay: 1.0, duration: 0.8, ease: "easeInOut" }}
                                            className="absolute inset-0 z-20 overflow-hidden"
                                            style={{ clipPath: "inset(0 0 0 50%)" }}
                                        >
                                            <div className="w-full h-full bg-gradient-to-l from-cyan-900/80 to-transparent" />
                                        </motion.div>
                                    </>
                                )}

                                {/* Sinkhole effect for snake */}
                                {!isLadder && (
                                    <motion.div
                                        initial={{ scale: 0.3, opacity: 0 }}
                                        animate={{
                                            scale: [0.3, 1.5],
                                            opacity: [0, 0.6, 0],
                                        }}
                                        transition={{ delay: 1.0, duration: 1.2, ease: "easeIn" }}
                                        className="absolute inset-0 z-20 rounded-full"
                                        style={{
                                            background: "radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(100,0,50,0.4) 50%, transparent 70%)",
                                        }}
                                    />
                                )}
                            </motion.div>

                            {/* Player avatar going through portal */}
                            <motion.div
                                initial={{ scale: 1, y: 0, opacity: 0 }}
                                animate={
                                    isLadder
                                        ? {
                                            opacity: [0, 1, 1, 1, 0],
                                            y: [40, 0, -10, -150, -300],
                                            scale: [0.8, 1.2, 1.3, 1, 0.5],
                                            rotate: [0, 0, -5, 5, 0],
                                        }
                                        : {
                                            opacity: [0, 1, 1, 1, 0],
                                            y: [-40, 0, 10, 80, 200],
                                            scale: [0.8, 1.2, 1.1, 0.6, 0.1],
                                            rotate: [0, 0, 30, 180, 720],
                                        }
                                }
                                transition={{ delay: 0.8, duration: 1.8, ease: "easeInOut" }}
                                onAnimationComplete={onComplete}
                                className="absolute z-30"
                            >
                                <img
                                    src={playerAvatar}
                                    alt="Player"
                                    className="w-20 h-20 md:w-24 md:h-24 object-contain"
                                    style={{
                                        filter: isLadder
                                            ? "drop-shadow(0 0 15px rgba(34,211,238,0.9))"
                                            : "drop-shadow(0 0 15px rgba(239,68,68,0.9))",
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Cell info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="flex items-center gap-3 text-white/90 text-lg md:text-xl font-bold z-10"
                        >
                            <span className={`px-3 py-1 rounded-lg ${isLadder ? "bg-cyan-500/30 border border-cyan-400/50" : "bg-red-500/30 border border-red-400/50"}`}>
                                #{fromCell}
                            </span>
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="text-2xl"
                            >
                                {isLadder ? "➡" : "➡"}
                            </motion.span>
                            <span className={`px-3 py-1 rounded-lg ${isLadder ? "bg-green-500/30 border border-green-400/50" : "bg-orange-500/30 border border-orange-400/50"}`}>
                                #{toCell}
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
