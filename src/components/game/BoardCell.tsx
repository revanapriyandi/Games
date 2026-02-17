import { memo } from "react";
import { motion } from "framer-motion";
import portalLadderImg from '../../assets/portal_ladder.png';
import portalSnakeImg from '../../assets/portal_snake.png';

interface BoardCellProps {
    cellNum: number;
    rowFromTop: number;
    colIndex: number;
    portal?: number;
    isChallenge: boolean;
    isTreasure: boolean;
    isRole?: boolean;
    activePortalCell: number | null;
}

export const BoardCell = memo(function BoardCell({ cellNum, rowFromTop, colIndex, portal, isChallenge, isTreasure, isRole, activePortalCell }: BoardCellProps) {
    const isLadder = portal !== undefined && portal > cellNum;
    const isSnake = portal !== undefined && portal < cellNum;

    return (
        <div
            style={{
                gridRow: rowFromTop + 1,
                gridColumn: colIndex + 1
            }}
            className={`
                relative flex items-center justify-center border-[0.5px] border-white/5
                ${cellNum === 100 ? 'bg-yellow-500/40' : ''}
                ${cellNum === 1 ? 'bg-green-500/40' : ''}
                ${isChallenge && !isLadder && !isSnake ? 'bg-amber-500/15' : ''}
                ${isTreasure && !isLadder && !isSnake ? 'bg-purple-500/15' : ''}
                ${isRole && !isLadder && !isSnake ? 'bg-indigo-500/15' : ''}
            `}
        >
            <span className="absolute top-0.5 left-0.5 z-[5] text-[7px] md:text-[9px] font-bold text-white bg-black/30 backdrop-blur-[1px] px-0.5 rounded-br text-center leading-none shadow-sm min-w-[12px]">
                {cellNum}
            </span>

            {isChallenge && !isLadder && !isSnake && (
                <span className="absolute top-0 right-0 text-[6px] md:text-[8px] leading-none select-none opacity-70">⚡</span>
            )}

            {isTreasure && !isLadder && !isSnake && (
                <motion.span
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-0 right-0 text-[6px] md:text-[8px] leading-none select-none"
                >
                    💎
                </motion.span>
            )}

            {isRole && !isLadder && !isSnake && (
                <motion.span
                    animate={{ y: [0, -2, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-0 right-0 text-[6px] md:text-[8px] leading-none select-none"
                >
                    🎭
                </motion.span>
            )}

            {isLadder && (
                <>
                    <motion.div
                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-sm pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0) 70%)',
                        }}
                    />
                    <motion.img
                        src={portalLadderImg}
                        alt="Ladder"
                        animate={activePortalCell === cellNum ? {
                            scale: [1, 2.5, 2.2],
                            rotate: [0, 180, 360],
                        } : {
                            scale: [0.9, 1.1, 0.9],
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={activePortalCell === cellNum ? {
                            duration: 0.8,
                            ease: "easeOut",
                        } : {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className={`absolute w-[70%] h-[70%] object-contain pointer-events-none z-[2] ${
                            activePortalCell === cellNum
                                ? 'opacity-100 drop-shadow-[0_0_20px_rgba(34,211,238,1)]'
                                : 'opacity-80 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]'
                        }`}
                    />
                    <span className="absolute bottom-0 right-0 text-[5px] md:text-[7px] text-green-300 font-black leading-none opacity-70 drop-shadow-[0_0_3px_rgba(34,197,94,0.8)] z-[1]">
                        ▲{portal}
                    </span>
                </>
            )}

            {isSnake && (
                <>
                    <motion.div
                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute inset-0 rounded-sm pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0) 70%)',
                        }}
                    />
                    <motion.img
                        src={portalSnakeImg}
                        alt="Snake"
                        animate={activePortalCell === cellNum ? {
                            scale: [1, 2.5, 2.2],
                            rotate: [0, -180, -360],
                        } : {
                            scale: [0.9, 1.1, 0.9],
                            rotate: [0, -10, 10, 0],
                        }}
                        transition={activePortalCell === cellNum ? {
                            duration: 0.8,
                            ease: "easeOut",
                        } : {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1,
                        }}
                        className={`absolute w-[70%] h-[70%] object-contain pointer-events-none z-[2] ${
                            activePortalCell === cellNum
                                ? 'opacity-100 drop-shadow-[0_0_20px_rgba(239,68,68,1)]'
                                : 'opacity-80 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]'
                        }`}
                    />
                    <span className="absolute bottom-0 right-0 text-[5px] md:text-[7px] text-red-300 font-black leading-none opacity-70 drop-shadow-[0_0_3px_rgba(239,68,68,0.8)] z-[1]">
                        ▼{portal}
                    </span>
                </>
            )}
        </div>
    );
});
