import { useEffect, useState, useRef, useCallback } from "react";
import { type GameState, subscribeToRoom, rollDice, SNAKES_LADDERS } from "../lib/game";
import { playLadderSound, playSnakeSound, playStepSound, playDiceResultSound } from "../lib/sounds";
import { getAvatarImage } from "../components/KnightAvatar";

interface UseGameRoomProps {
    roomId: string;
    playerId: string;
    onLeave: () => void;
}

export function useGameRoom({ roomId, playerId, onLeave }: UseGameRoomProps) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [displayPositions, setDisplayPositions] = useState<Record<string, number>>({});
    const [isAnimating, setIsAnimating] = useState(false);
    const [isWaitingForAnimation, setIsWaitingForAnimation] = useState(false);
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
    const pendingAnimRef = useRef<{pid: string, from: number, to: number, roll: number, hasChallenge: boolean, gameData: GameState} | null>(null);
    const portalCallbackRef = useRef<(() => void) | null>(null);
    const isFirstLoad = useRef(true);

    const handlePortalComplete = useCallback(() => {
        const cb = portalCallbackRef.current;
        portalCallbackRef.current = null;
        if (cb) cb();
    }, []);

    // Animation Logic
    const animateMovement = useCallback((pid: string, from: number, finalPos: number, roll: number, hasChallenge: boolean, gameData: GameState) => {
        if (from === finalPos) {
            return;
        }

        setIsAnimating(true);

        const onMovementFinished = (current: number) => {
            const hasSnakeLadder = current !== finalPos;
            const activePortals = gameData.portals || SNAKES_LADDERS;

            if (hasSnakeLadder && activePortals[current]) {
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

                setActivePortalCell(current);
                if (portalType === 'ladder') {
                    playLadderSound();
                } else {
                    playSnakeSound();
                }

                setTimeout(() => {
                    setShowPortal(true);
                }, 800);

                portalCallbackRef.current = () => {
                    setShowPortal(false);
                    setPortalInfo(null);
                    setActivePortalCell(null);

                    setTimeout(() => {
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
                setTimeout(() => {
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

        if (roll > 0) {
            let current = from;
            const walkTarget = Math.min(from + roll, 100);
            let stepsRemaining = walkTarget - from;

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
            setTimeout(() => {
                onMovementFinished(from);
            }, 500);
        }
    }, []);

    // Room Subscription
    useEffect(() => {
        const unsubscribe = subscribeToRoom(roomId, (data) => {
            const prevPos = prevPositionsRef.current;
            const players = data.players || {};

            const initializing = isFirstLoad.current;
            if (initializing) isFirstLoad.current = false;

            for (const [pid, player] of Object.entries(players)) {
                const oldPos = prevPos[pid] || 0;
                const newPos = player.position || 0;

                if (!initializing && oldPos !== newPos && newPos > 0) {
                    const hasChallenge = !!data.currentChallenge;
                    const roll = data.lastRoll || 0;
                    setDisplayPositions(prev => ({ ...prev, [pid]: oldPos }));
                    pendingAnimRef.current = { pid, from: oldPos, to: newPos, roll, hasChallenge, gameData: data };
                    setIsWaitingForAnimation(true);
                }
            }

            const newPrevPos: Record<string, number> = {};
            for (const [pid, player] of Object.entries(players)) {
                newPrevPos[pid] = player.position || 0;
            }
            prevPositionsRef.current = newPrevPos;

            setGameState(data);

            if (data.isRolling) {
                setIsWaitingForAnimation(false);
            }

            if (rollingRef.current && data.lastRoll !== null && !data.isRolling) {
                rollingRef.current = false;
                playDiceResultSound();
                setShowResult(true);
                if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
                resultTimerRef.current = setTimeout(() => {
                    setShowResult(false);
                    const pending = pendingAnimRef.current;
                    setIsWaitingForAnimation(false);
                    if (pending) {
                        pendingAnimRef.current = null;
                        animateMovement(pending.pid, pending.from, pending.to, pending.roll, pending.hasChallenge, pending.gameData);
                    }
                }, 1500);
            }

            if (!rollingRef.current && data.lastRoll !== null && !data.isRolling && prevRollingRef.current) {
                setShowResult(true);
                if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
                resultTimerRef.current = setTimeout(() => {
                    setShowResult(false);
                    const pending = pendingAnimRef.current;
                    setIsWaitingForAnimation(false);
                    if (pending) {
                        pendingAnimRef.current = null;
                        animateMovement(pending.pid, pending.from, pending.to, pending.roll, pending.hasChallenge, pending.gameData);
                    }
                }, 1500);
            }
            prevRollingRef.current = data.isRolling || false;

            if (pendingAnimRef.current && pendingAnimRef.current.roll <= 0 && !data.isRolling) {
                 const pending = pendingAnimRef.current;
                 pendingAnimRef.current = null;
                 setIsWaitingForAnimation(false);
                 animateMovement(pending.pid, pending.from, pending.to, pending.roll, pending.hasChallenge, pending.gameData);
            }

            const currentPlayerIds = Object.keys(players);
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
    }, [roomId, onLeave, playerId, animateMovement]);

    // Ensure displayPositions is initialized
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

    const handleRoll = async () => {
        rollingRef.current = true;
        setShowResult(false);
        setThinkingPlayerId(null);
        await rollDice(roomId, playerId);
    };

    return {
        gameState,
        displayPositions,
        isAnimating,
        isWaitingForAnimation,
        isCompletingChallenge,
        setIsCompletingChallenge,
        thinkingPlayerId,
        showPortal,
        activePortalCell,
        portalInfo,
        notification,
        showResult,
        handleRoll,
        handlePortalComplete
    };
}
