import { useEffect, useState, useRef } from "react";
import { type GameState, subscribeToRoom, startGame, rollDice, markChallengeComplete, failChallenge, kickPlayer, resetGame, SNAKES_LADDERS, dismissTreasure, playCard, clearCardEffect } from "../lib/game";
import { Button } from "./ui/button";
import { Board } from "./Board";
import { Dice } from "./Dice";
import { ChallengeModal } from "./ChallengeModal";
import { WinnerModal } from "./WinnerModal";
import { PortalAnimation } from "./PortalAnimation";
import TreasureModal from "./TreasureModal";
import { motion, AnimatePresence } from "framer-motion";
// import { useGameAnnouncer } from "../hooks/useGameAnnouncer"; // Removed
import { getAvatarImage } from "./KnightAvatar";
import { playLadderSound, playSnakeSound, playStepSound, playDiceResultSound, playTreasureSound, playCardUseSound } from "../lib/sounds";

interface GameRoomProps {
    roomId: string;
    playerId: string;
    onLeave: () => void;
}

export function GameRoom({ roomId, playerId, onLeave }: GameRoomProps) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [displayPositions, setDisplayPositions] = useState<Record<string, number>>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const [isWaitingForAnimation, setIsWaitingForAnimation] = useState(false); // Guard for the gap between result and move
    const [isCompletingChallenge, setIsCompletingChallenge] = useState(false);
    const [thinkingPlayerId, setThinkingPlayerId] = useState<string | null>(null);
    const [showPortal, setShowPortal] = useState(false);
    const [activePortalCell, setActivePortalCell] = useState<number | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [portalInfo, setPortalInfo] = useState<{
        type: 'ladder' | 'snake';
        fromCell: number;
        toCell: number;
        playerAvatar: string;
    } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rollingRef = useRef(false);
    const prevRollingRef = useRef(false);
    const prevPositionsRef = useRef<Record<string, number>>({});
    const prevPlayerIdsRef = useRef<string[]>([]);
    const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [usingCardIndex, setUsingCardIndex] = useState<number | null>(null);
    const [showCardInventory, setShowCardInventory] = useState(false);

    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Step-by-step animation: walk dice steps, then show portal animation if snake/ladder, then spring to final
    const animateMovement = (pid: string, from: number, finalPos: number, roll: number, hasChallenge: boolean, gameData: GameState) => {
        if (from === finalPos) {
            return;
        }
        
        setIsAnimating(true);

        const onMovementFinished = (current: number) => {
            const hasSnakeLadder = current !== finalPos;
            
            const activePortals = gameData.portals || SNAKES_LADDERS;
            if (hasSnakeLadder && activePortals[current]) {
                // Show portal animation before jumping
                const portalType = activePortals[current] > current ? 'ladder' : 'snake';
                const playersList = Object.values(gameData.players);
                const playerIndex = playersList.findIndex(p => p.id === pid);
                const playerData = gameData.players[pid];
                const avatarImg = getAvatarImage(playerData?.avatar || '', playerIndex >= 0 ? playerIndex : 0);
                
                setPortalInfo({
                    type: portalType as 'ladder' | 'snake',
                    fromCell: current,
                    toCell: finalPos,
                    playerAvatar: avatarImg,
                });
                
                // Activate portal cell grow animation + sound
                setActivePortalCell(current);
                if (portalType === 'ladder') {
                    playLadderSound();
                } else {
                    playSnakeSound();
                }
                
                // Delay showing fullscreen portal to let cell animation play
                setTimeout(() => {
                    setShowPortal(true);
                }, 800);
                
                // Portal onComplete will handle the rest
                portalCallbackRef.current = () => {
                    setShowPortal(false);
                    setPortalInfo(null);
                    setActivePortalCell(null);
                    
                    // Now spring-animate to final position
                    setTimeout(() => {
                        // Ensure final position is set and KEPT in displayPositions
                        setDisplayPositions(prev => ({ ...prev, [pid]: finalPos }));
                        
                        setTimeout(() => {
                            if (hasChallenge) {
                                setThinkingPlayerId(pid);
                                setIsAnimating(false);
                                setTimeout(() => {
                                    setThinkingPlayerId(null);
                                }, 2000);
                            } else {
                                setIsAnimating(false);
                            }
                        }, 800);
                    }, 300);
                };
            } else {
                // No snake/ladder, just spring-animate
                setTimeout(() => {
                    // Ensure final position is set and KEPT in displayPositions
                    setDisplayPositions(prev => ({ ...prev, [pid]: finalPos }));
                    
                    const springDelay = hasSnakeLadder ? 800 : 0;
                    setTimeout(() => {
                        if (hasChallenge) {
                            setThinkingPlayerId(pid);
                            setIsAnimating(false);
                            setTimeout(() => {
                                setThinkingPlayerId(null);
                            }, 2000);
                        } else {
                            setIsAnimating(false);
                        }
                    }, springDelay);
                }, hasSnakeLadder ? 300 : 200);
            }
        };

        // If roll > 0, walk first. If not (penalty/portal jump directly), skip walk.
        if (roll > 0) {
            let current = from;
            const walkTarget = Math.min(from + roll, 100);
            let stepsRemaining = walkTarget - from;
            
            // Clear any existing animation
            if (animTimerRef.current) clearInterval(animTimerRef.current);
            
            animTimerRef.current = setInterval(() => {
                current += 1;
                playStepSound();
                stepsRemaining -= 1;
                setDisplayPositions(prev => ({ ...prev, [pid]: current }));
                
                if (stepsRemaining <= 0) {
                    if (animTimerRef.current) clearInterval(animTimerRef.current);
                    animTimerRef.current = null;
                    onMovementFinished(current);
                }
            }, 300); 
        } else {
            // Penalty or direct move
            // Small delay to let user realize something happened
            setTimeout(() => {
                onMovementFinished(from);
            }, 500);
        }
    };

    const pendingAnimRef = useRef<{pid: string, from: number, to: number, roll: number, hasChallenge: boolean, gameData: GameState} | null>(null);
    const portalCallbackRef = useRef<(() => void) | null>(null);

    const isFirstLoad = useRef(true);

    const handlePortalComplete = () => {
        const cb = portalCallbackRef.current;
        portalCallbackRef.current = null;
        if (cb) cb();
    };

    useEffect(() => {
        const unsubscribe = subscribeToRoom(roomId, (data) => {
            // Detect position changes and queue animation
            const prevPos = prevPositionsRef.current;
            const players = data.players || {};
            
            const initializing = isFirstLoad.current;
            if (initializing) isFirstLoad.current = false;

            for (const [pid, player] of Object.entries(players)) {
                const oldPos = prevPos[pid] || 0;
                const newPos = player.position || 0;
                
                // Only animate if NOT initializing and position changed
                if (!initializing && oldPos !== newPos && newPos > 0) {
                    const hasChallenge = !!data.currentChallenge;
                    const roll = data.lastRoll || 0;
                    // Pin display at old position so Board doesn't jump ahead
                    setDisplayPositions(prev => ({ ...prev, [pid]: oldPos }));
                    // Queue animation — will be triggered after dice result finishes
                    pendingAnimRef.current = { pid, from: oldPos, to: newPos, roll, hasChallenge, gameData: data };
                    
                    // Guard: Block challenge view immediately
                    setIsWaitingForAnimation(true);
                }
            }
            
            // Update previous positions
            const newPrevPos: Record<string, number> = {};
            for (const [pid, player] of Object.entries(players)) {
                newPrevPos[pid] = player.position || 0;
            }
            prevPositionsRef.current = newPrevPos;

            setGameState(data);
            
            // Reset challenge view if rolling starts (for observers)
            if (data.isRolling) {
                // If we were waiting for anim but rolled again, cancel wait
                setIsWaitingForAnimation(false);
            }
            
            // For the player who rolled: detect when result arrives
            if (rollingRef.current && data.lastRoll !== null && !data.isRolling) {
                rollingRef.current = false;
                playDiceResultSound(); // Play result sound
                setShowResult(true);
                if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
                resultTimerRef.current = setTimeout(() => {
                    setShowResult(false);
                    const pending = pendingAnimRef.current;
                    setIsWaitingForAnimation(false); // Gap over
                    if (pending) {
                        pendingAnimRef.current = null;
                        animateMovement(pending.pid, pending.from, pending.to, pending.roll, pending.hasChallenge, pending.gameData);
                    }
                }, 1500);
            }
            
            // For non-rolling players: when isRolling goes false and there's a result, show it and animate
            if (!rollingRef.current && data.lastRoll !== null && !data.isRolling && prevRollingRef.current) {
                setShowResult(true);
                if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
                resultTimerRef.current = setTimeout(() => {
                    setShowResult(false);
                    const pending = pendingAnimRef.current;
                    setIsWaitingForAnimation(false); // Gap over
                    if (pending) {
                        pendingAnimRef.current = null;
                        animateMovement(pending.pid, pending.from, pending.to, pending.roll, pending.hasChallenge, pending.gameData);
                    }
                }, 1500);
            }
            prevRollingRef.current = data.isRolling || false;

            // Trigger animation for non-roll movements (e.g. penalties)
            if (pendingAnimRef.current && pendingAnimRef.current.roll <= 0 && !data.isRolling) {
                 const pending = pendingAnimRef.current;
                 pendingAnimRef.current = null;
                 setIsWaitingForAnimation(false);
                 animateMovement(pending.pid, pending.from, pending.to, pending.roll, pending.hasChallenge, pending.gameData);
            }

            // Check for new players (Announce Join)
            const currentPlayerIds = Object.keys(players);
            
            // Initial load check: if prev is empty, just set it (don't announce existing players)
            if (prevPlayerIdsRef.current.length === 0) {
                prevPlayerIdsRef.current = currentPlayerIds;
            } else {
                const newJoiners = currentPlayerIds.filter(id => !prevPlayerIdsRef.current.includes(id));
                newJoiners.forEach(id => {
                    if (players[id].id !== playerId) { 
                         setNotification(`Selamat datang, ${players[id].name}!`);
                         setTimeout(() => setNotification(null), 3000);
                    }
                });
                prevPlayerIdsRef.current = currentPlayerIds;
            }

            // Check if I was kicked
            if (data.players && !data.players[playerId]) {
                onLeave();
                return;
            }
        });
        return () => {
            unsubscribe();
            if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
            if (animTimerRef.current) clearInterval(animTimerRef.current);
        };
    }, [roomId, onLeave, playerId]);



    // Audio announcer effect removed
    // useEffect(() => { ... }, [gameState?.logs, speak]);

    // Ensure displayPositions is initialized for all players to prevent frame jumping
    if (gameState?.players) {
        const next = { ...displayPositions };
        let changed = false;
        Object.values(gameState.players).forEach(p => {
            if (next[p.id] === undefined && p.position) {
                next[p.id] = p.position;
                changed = true;
            }
        });
        if (changed) {
            setDisplayPositions(next);
        }
    }

    if (!gameState || !gameState.players) return <div className="text-white text-center mt-20 animate-pulse text-lg">⏳ Loading game state...</div>;

    const player = gameState.players[playerId];
    const isHost = player?.isHost;
    const playersList = Object.values(gameState.players);
    const isTurn = gameState.status === "playing" && playersList[gameState.currentTurnIndex]?.id === playerId;
    const disabled = !isTurn || !!gameState.currentChallenge || isAnimating || !!gameState.isRolling;
    const activePlayer = playersList[gameState.currentTurnIndex];

    const handleRoll = async () => {
        rollingRef.current = true;
        setShowResult(false);
        setThinkingPlayerId(null);
        await rollDice(roomId, playerId);
    };

    const handleChallengeComplete = async () => {
        setIsCompletingChallenge(true);
        await markChallengeComplete(roomId);
        setIsCompletingChallenge(false);
    }

    if (gameState.status === "waiting") {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="max-w-md w-full mx-auto p-8 bg-white/10 backdrop-blur-md rounded-xl text-center shadow-2xl border border-white/20"
            >
                <h2 className="text-2xl font-bold text-white mb-2">
                    Kode Ruang: <span onClick={handleCopy} className="text-yellow-400 tracking-wider font-mono bg-black/40 px-2 rounded-md border border-yellow-500/50 cursor-pointer hover:bg-white/20 transition-all select-none" title="Klik untuk menyalin">{copied ? "DISALIN!" : roomId}</span>
                </h2>
                <p className="text-gray-300 mb-2 font-light">Bagikan kode ini ke temanmu!</p>
                <p className="text-gray-400 mb-6 text-xs">📱 Max 4 pemain. Buka game di HP lain dan masukkan kode ini.</p>

                <div className="space-y-3 mb-8 text-left">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1">Ksatria ({playersList.length}/4)</h3>
                    {playersList.map((p, idx) => (
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            key={p.id} 
                            className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5"
                        >
                            <img src={getAvatarImage(p.avatar, idx)} alt={p.name} className="w-10 h-10 object-contain" />
                            <span className="text-white font-medium">{p.name} {p.id === playerId && <span className="text-gray-400 text-xs font-normal">(Kamu)</span>}</span>
                            
                            {/* Host Badge */}
                            {p.isHost && <span className="ml-auto text-[10px] uppercase font-bold bg-yellow-500 text-black px-2 py-1 rounded shadow-lg">HOST</span>}
                            
                            {/* Kick Button (only for Host, not on self) */}
                            {isHost && p.id !== playerId && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Keluarkan ${p.name}?`)) kickPlayer(roomId, p.id);
                                    }}
                                    className="ml-auto px-3 py-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold rounded-lg shadow-lg border border-red-400/30 flex items-center gap-1 transition-all active:scale-95 group"
                                    title="Keluarkan Pemain"
                                >
                                    <span className="group-hover:scale-110 transition-transform">⛔</span> 
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>

                {isHost ? (
                    <Button 
                        onClick={() => startGame(roomId)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-700 hover:from-green-600 hover:to-emerald-800 text-white font-bold py-6 text-xl shadow-xl transition-all hover:scale-[1.02]"
                    >
                        ⚔️ MULAI PERMAINAN
                    </Button>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400 animate-pulse bg-white/5 py-3 rounded-lg">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"/>
                        Menunggu host memulai permainan...
                </div>
                )}
                
                <Button 
                    variant="ghost" 
                    onClick={onLeave}
                    className="w-full mt-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs uppercase tracking-wider"
                >
                    Keluar Room
                </Button>
            </motion.div>
        );
    }


    return (
        <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-y-auto bg-slate-900/50">
            <div className="fixed top-2 right-2 z-50 flex flex-col items-end gap-1">
                <h1 className="text-[10px] md:text-xs text-white/30 font-mono select-none">ROOM: {roomId}</h1>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onLeave}
                    className="h-6 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                    Keluar
                </Button>
            </div>
            
            {/* Theme badge */}
            {gameState.aiConfig && (
                <div className="fixed top-1 left-2 z-20 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
                    ✨ {gameState.aiConfig.theme}
                </div>
            )}
            
            {/* Player tabs - small avatars peeking from top edge */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 flex gap-1">
                {playersList.map((p, index) => {
                    const isActive = gameState.currentTurnIndex === index;
                    const isSelected = selectedPlayer === p.id;
                    return (
                        <div key={p.id} className="relative">
                            <motion.div
                                onClick={() => setSelectedPlayer(isSelected ? null : p.id)}
                                animate={isActive ? { y: [0, -2, 0] } : {}}
                                transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
                                className={`cursor-pointer px-2 pt-1 pb-1.5 rounded-b-xl transition-all ${
                                    isActive 
                                        ? 'bg-gradient-to-b from-yellow-600/80 to-yellow-900/80 border border-t-0 border-yellow-400 shadow-[0_4px_15px_rgba(234,179,8,0.4)]' 
                                        : 'bg-black/60 border border-t-0 border-white/10 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <img src={getAvatarImage(p.avatar, index)} alt={p.name} className="w-7 h-7 object-contain drop-shadow-lg" />
                            </motion.div>

                            {/* Detail popup */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                        className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 min-w-[120px] shadow-2xl z-50"
                                    >
                                        <div className="flex flex-col items-center gap-1.5">
                                            <img src={getAvatarImage(p.avatar, index)} alt={p.name} className="w-12 h-12 object-contain" />
                                            <span className="text-xs text-white font-bold">{p.name}</span>
                                            {gameState.aiConfig?.heroTitles?.[index] && (
                                                <span className="text-[9px] text-purple-300 italic">"{gameState.aiConfig.heroTitles[index]}"</span>
                                            )}
                                            <span className="text-[10px] text-yellow-300 font-mono bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                Petak #{p.position || 1}
                                            </span>
                                            {isActive && (
                                                <span className="text-[9px] text-green-400 font-bold animate-pulse">🎯 GILIRAN</span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 w-full flex items-center justify-center pb-32 pt-16 min-h-[500px]">
                <Board 
                    players={playersList} 
                    displayPositions={displayPositions} 
                    thinkingPlayerId={thinkingPlayerId} 
                    activePortalCell={activePortalCell} 
                    portals={gameState.portals}
                    activeCardEffect={gameState.activeCardEffect}
                />
            </div>
            
            {/* Dice - floating, draggable */}
            <motion.div 
                drag
                dragMomentum={false}
                dragElastic={0.1}
                whileDrag={{ scale: 1.15, cursor: "grabbing" }}
                style={{ cursor: "grab" }}
                className="fixed right-6 bottom-8 md:right-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-50 touch-none"
            >
                <Dice 
                    rolling={!!gameState.isRolling} 
                    value={gameState.lastRoll} 
                    onRoll={handleRoll} 
                    disabled={disabled}
                    showResult={showResult}
                />
            </motion.div>

            {/* Card Inventory - floating panel */}
            {player && (player.cards?.length ?? 0) > 0 && (
                <div className="fixed left-2 bottom-4 z-50">
                    <button
                        onClick={() => setShowCardInventory(!showCardInventory)}
                        className="px-3 py-2 bg-purple-600/80 hover:bg-purple-500/80 text-white text-xs font-bold rounded-xl border border-purple-400/30 shadow-lg backdrop-blur-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                        🎴 {player.cards?.length || 0} Kartu
                    </button>
                    <AnimatePresence>
                        {showCardInventory && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                className="absolute bottom-12 left-0 bg-slate-900/95 border border-purple-500/30 rounded-xl p-2 shadow-2xl backdrop-blur-md min-w-[180px] max-w-[220px]"
                            >
                                <div className="text-[10px] text-purple-300 font-bold mb-1.5 px-1">KARTU KAMU:</div>
                                <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                                    {player.cards?.map((card: import('../lib/types').TreasureCard, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (card.targetType === 'self') {
                                                    playCardUseSound();
                                                    playCard(roomId, playerId, idx);
                                                    setShowCardInventory(false);
                                                    setTimeout(() => clearCardEffect(roomId), 2500);
                                                } else {
                                                    setUsingCardIndex(idx);
                                                    setShowCardInventory(false);
                                                }
                                            }}
                                            disabled={!isTurn}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                                isTurn 
                                                    ? 'bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/20'
                                                    : 'bg-slate-800/50 opacity-50 cursor-not-allowed border border-slate-700/20'
                                            }`}
                                        >
                                            <span className="text-lg">{card.emoji}</span>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white font-bold leading-tight">{card.name}</span>
                                                <span className="text-[8px] text-gray-400 leading-tight">{card.description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Target Picker Modal */}
            <AnimatePresence>
                {usingCardIndex !== null && (
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
                                {player?.cards?.[usingCardIndex]?.emoji} {player?.cards?.[usingCardIndex]?.name}
                            </h3>
                            <p className="text-gray-400 text-xs text-center mb-4">Pilih target pemain:</p>
                            <div className="flex flex-col gap-2">
                                {playersList.filter(p => p.id !== playerId).map((p, index) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            if (usingCardIndex === null) return;
                                            playCardUseSound();
                                            playCard(roomId, playerId, usingCardIndex, p.id);
                                            setUsingCardIndex(null);
                                            setTimeout(() => clearCardEffect(roomId), 2500);
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
                                onClick={() => setUsingCardIndex(null)}
                                className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Turn announcement - top toast that appears and fades */}
            <AnimatePresence>
                <motion.div
                    key={`turn-${gameState.currentTurnIndex}`}
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

            {/* Game log toast */}
            <AnimatePresence mode='wait'>
                {gameState.logs && gameState.logs.length > 0 && (
                    <motion.div
                        key={gameState.logs.length}
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
                            {gameState.logs[gameState.logs.length - 1]}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Challenge Overlay - shown AFTER movement animation */}
            <AnimatePresence>
                {!!gameState.currentChallenge && !isAnimating && !isWaitingForAnimation && !gameState.isRolling && !isCompletingChallenge && !thinkingPlayerId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <ChallengeModal 
                            isOpen={true}
                            challenge={gameState.currentChallenge || ""}
                            penalty={gameState.currentPenalty}
                            isActivePlayer={activePlayer?.id === playerId}
                            playerName={activePlayer?.name}
                            onComplete={handleChallengeComplete}
                            onFail={async () => {
                                setIsCompletingChallenge(true);
                                await failChallenge(roomId, activePlayer.name, activePlayer.id);
                                setIsCompletingChallenge(false);
                            }}
                            themeName={gameState.aiConfig?.theme}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Treasure Modal */}
            <AnimatePresence>
                {!!gameState.currentTreasure && !isAnimating && !isWaitingForAnimation && !gameState.isRolling && !thinkingPlayerId && (
                    <TreasureModal
                        isOpen={true}
                        card={gameState.currentTreasure}
                        isActivePlayer={activePlayer?.id === playerId}
                        playerName={activePlayer?.name}
                        onDismiss={async () => {
                            playTreasureSound();
                            await dismissTreasure(roomId);
                        }}
                    />
                )}
            </AnimatePresence>


            {/* Join Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 text-white px-6 py-2 rounded-full shadow-lg border border-blue-400 font-bold backdrop-blur-md"
                    >
                        👋 {notification}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Portal Animation Overlay */}
            <PortalAnimation
                isOpen={showPortal && !!portalInfo}
                type={portalInfo?.type || 'ladder'}
                fromCell={portalInfo?.fromCell || 0}
                toCell={portalInfo?.toCell || 0}
                playerAvatar={portalInfo?.playerAvatar || ''}
                onComplete={handlePortalComplete}
            />

            {/* Winner Overlay */}
            <AnimatePresence>
                {gameState.winner && (
                    <WinnerModal 
                        winnerId={gameState.winner}
                        players={playersList}
                        currentPlayerId={playerId}
                        onReset={() => resetGame(roomId)}
                        onExit={onLeave}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
