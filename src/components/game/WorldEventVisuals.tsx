import { motion } from "framer-motion";
import { useState } from "react";

interface WorldEventVisualsProps {
    type: 'earthquake' | 'wind' | 'fog' | null;
}

export function WorldEventVisuals({ type }: WorldEventVisualsProps) {
    // Generate particles once on mount using useState initializer.
    // The parent component (Board) should use key={type} to force remount when type changes.
    const [particles] = useState(() => {
        if (!type) return [];
        return Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 5,
            opacity: 0.3 + Math.random() * 0.7
        }));
    });

    if (!type) return null;

    return (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-xl">
            {/* Fog Overlay */}
            {type === 'fog' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"
                >
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ x: p.x, y: p.y, opacity: 0 }}
                            animate={{ 
                                x: [p.x, `calc(${p.x} + 20px)`, p.x],
                                opacity: [0, p.opacity, 0] 
                            }}
                            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
                            className="absolute text-4xl opacity-50"
                        >
                            🌫️
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Wind Overlay */}
            {type === 'wind' && (
                <div className="absolute inset-0">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ x: "-10%", y: p.y, opacity: 0 }}
                            animate={{ x: "120%", opacity: [0, 1, 0], rotate: 360 }}
                            transition={{ 
                                duration: p.duration, 
                                repeat: Infinity, 
                                delay: p.delay,
                                ease: "linear"
                            }}
                            className="absolute text-2xl"
                        >
                            🍃
                        </motion.div>
                    ))}
                </div>
            )}
            
            {/* Earthquake overlay (Active Shake is on Board component, this adds dust/debris) */}
            {type === 'earthquake' && (
                 <div className="absolute inset-0">
                    {particles.slice(0, 5).map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ y: "-20%", left: p.x, opacity: 0 }}
                            animate={{ y: ["0%", "100%"], opacity: [0, 1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, repeatDelay: p.delay }}
                            className="absolute text-xl"
                            style={{ left: p.x }}
                        >
                            🪨
                        </motion.div>
                    ))}
                 </div>
            )}
        </div>
    );
}
