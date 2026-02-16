import { useEffect, useState, useRef } from "react";
import { type GameState, subscribeToRoom, startGame, rollDice, markChallengeComplete, failChallenge, kickPlayer, resetGame, SNAKES_LADDERS, dismissTreasure } from "../lib/game";
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
import { playLadderSound, playSnakeSound, playStepSound, playDiceResultSound, playTreasureSound } from "../lib/sounds";
import { CardInventory } from "./game-room/CardInventory";
import { GameRoomWaiting } from "./game-room/GameRoomWaiting";
import { PlayerTabs } from "./game-room/PlayerTabs";

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
            <GameRoomWaiting
                roomId={roomId}
                playerId={playerId}
                players={playersList}
                isHost={!!isHost}
                copied={copied}
                onCopyCode={handleCopy}
                onStartGame={() => startGame(roomId)}
                onLeave={onLeave}
                onKickPlayer={(kickPlayerId, playerName) => {
                    if (confirm(`Keluarkan ${playerName}?`)) kickPlayer(roomId, kickPlayerId);
                }}
            />
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
            <PlayerTabs
                players={playersList}
                currentTurnIndex={gameState.currentTurnIndex}
                heroTitles={gameState.aiConfig?.heroTitles}
            />

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

            <CardInventory
                player={player}
                players={playersList}
                playerId={playerId}
                roomId={roomId}
                isTurn={isTurn}
            />

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
