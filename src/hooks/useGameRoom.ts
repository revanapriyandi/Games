import { useEffect, useState, useRef, useCallback } from "react";
import { type GameState, subscribeToRoom, rollDice } from "../lib/game";
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
    // displayPositions tracks where the player token *visually* is on the board
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
    const prevRollingRef = useRef(false);
    // Stores the last known server position to detect changes
    const prevPositionsRef = useRef<Record<string, number>>({});
    const prevPlayerIdsRef = useRef<string[]>([]);

    // Animation refs
    const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // pendingAnim stores the move we need to execute once the dice result is shown
    const pendingAnimRef = useRef<{pid: string, from: number, to: number, roll: number} | null>(null);
    const portalCallbackRef = useRef<(() => void) | null>(null);
    const isFirstLoad = useRef(true);

    const handlePortalComplete = useCallback(() => {
        const cb = portalCallbackRef.current;
        portalCallbackRef.current = null;
        if (cb) cb();
    }, []);

    const finishAnimation = useCallback((pid: string, gameData: GameState) => {
        setIsAnimating(false);
        setIsWaitingForAnimation(false);
        setThinkingPlayerId(null);

        if (gameData.currentChallenge && gameData.currentTurnIndex !== undefined) {
             const activePid = Object.keys(gameData.players)[gameData.currentTurnIndex];
             if (activePid === pid) {
                 setThinkingPlayerId(pid);
                 setTimeout(() => setThinkingPlayerId(null), 2000);
             }
        }
    }, []);

    // --- Animation Logic ---
    const animateMovement = useCallback((pid: string, startPos: number, finalPos: number, _rollAmount: number, gameData: GameState) => {
        // If no movement, just sync and exit
        if (startPos === finalPos) {
            setDisplayPositions(prev => ({ ...prev, [pid]: finalPos }));
            setIsAnimating(false);
            return;
        }

        setIsAnimating(true);

        const hasPortalEffect = gameData.portalFrom && gameData.portalTo && gameData.portalFrom !== gameData.portalTo;
        let walkDest = finalPos;
        if (hasPortalEffect && gameData.portalFrom) {
             walkDest = gameData.portalFrom;
        }

        let current = startPos;

        if (animIntervalRef.current) clearInterval(animIntervalRef.current);

        animIntervalRef.current = setInterval(() => {
            if (current < walkDest) {
                current++;
                playStepSound();
            } else if (current > walkDest) {
                current--;
            } else {
                // Reached walk destination
                if (animIntervalRef.current) clearInterval(animIntervalRef.current);
                animIntervalRef.current = null;

                // Now handle Portal or finish
                if (hasPortalEffect && gameData.portalFrom === current) {
                     // Trigger Portal Animation
                     const from = gameData.portalFrom;
                     const to = gameData.portalTo!;
                     const type = gameData.portalType as 'ladder' | 'snake';

                     const playersList = Object.values(gameData.players);
                     const pIndex = playersList.findIndex(p => p.id === pid);
                     const avatar = getAvatarImage(gameData.players[pid]?.avatar || '', pIndex);

                     setPortalInfo({
                        type,
                        fromCell: from,
                        toCell: to,
                        playerAvatar: avatar
                     });
                     setActivePortalCell(from);
                     setShowPortal(true);

                     if (type === 'ladder') playLadderSound();
                     else playSnakeSound();

                     // Portal callback (called by UI when animation done)
                     portalCallbackRef.current = () => {
                         setShowPortal(false);
                         setActivePortalCell(null);
                         setPortalInfo(null);

                         // Jump to final
                         setDisplayPositions(prev => ({ ...prev, [pid]: finalPos }));
                         finishAnimation(pid, gameData);
                     };
                } else {
                    // Just finished walking
                    finishAnimation(pid, gameData);
                }
            }

            // Update UI position every step
            setDisplayPositions(prev => ({ ...prev, [pid]: current }));

        }, 300); // 300ms per step

    }, [finishAnimation]);


    // Room Subscription
    useEffect(() => {
        const unsubscribe = subscribeToRoom(roomId, (data) => {
            if (!data || !data.players) return;

            setGameState(_prev => {
                // Determine previous players state from PREV state, or fallback
                const newPlayers = data.players;

                // If this is the VERY first load, just sync positions without animation
                if (isFirstLoad.current) {
                    isFirstLoad.current = false;
                    const initialPos: Record<string, number> = {};
                    Object.values(newPlayers).forEach(p => initialPos[p.id] = p.position || 0);
                    setDisplayPositions(initialPos);
                    prevPositionsRef.current = initialPos;
                    // Important: Return the new data so state updates!
                    return data;
                }

                // Check each player for movement
                Object.keys(newPlayers).forEach(pid => {
                    const oldPos = prevPositionsRef.current[pid] || 0;
                    const newPos = newPlayers[pid].position || 0;

                    if (oldPos !== newPos) {
                        const roll = data.lastRoll || 0;

                        // Update our "previous" ref so we don't detect it again immediately
                        prevPositionsRef.current[pid] = newPos;

                        // Queue animation
                        pendingAnimRef.current = { pid, from: oldPos, to: newPos, roll };
                        setIsWaitingForAnimation(true);
                    }
                });

                // Handling Rolling State Changes
                const wasRolling = prevRollingRef.current;
                const isRolling = data.isRolling || false;

                if (wasRolling && !isRolling) {
                    // Roll finished!
                    playDiceResultSound();
                    setShowResult(true);

                    // Clear any old timer
                    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);

                    // Show dice result for 1.5s, then animate movement
                    resultTimerRef.current = setTimeout(() => {
                        setShowResult(false);

                        if (pendingAnimRef.current) {
                            const { pid, from, to, roll } = pendingAnimRef.current;
                            pendingAnimRef.current = null;
                            animateMovement(pid, from, to, roll, data);
                        } else {
                            // No movement pending? (maybe rolled but stayed same? rare)
                            setIsWaitingForAnimation(false);
                        }

                    }, 1500);
                } else if (!isRolling && pendingAnimRef.current && !isAnimating && !showResult) {
                    // If we have a pending move but not rolling and not showing result (maybe a card effect?)
                    // Animate immediately
                     const { pid, from, to, roll } = pendingAnimRef.current;
                     pendingAnimRef.current = null;
                     animateMovement(pid, from, to, roll, data);
                }

                prevRollingRef.current = isRolling;

                // New Joiner Notification
                const currentPids = Object.keys(newPlayers);
                if (prevPlayerIdsRef.current.length > 0) {
                     const joined = currentPids.find(id => !prevPlayerIdsRef.current.includes(id));
                     if (joined && joined !== playerId) {
                         setNotification(`Selamat datang, ${newPlayers[joined].name}!`);
                         setTimeout(() => setNotification(null), 3000);
                     }
                }
                prevPlayerIdsRef.current = currentPids;

                return data;
            });

            // Handle kicked/left
            if (data.players && !data.players[playerId]) {
                onLeave();
            }
        });

        return () => {
            unsubscribe();
            if (animIntervalRef.current) clearInterval(animIntervalRef.current);
            if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
        };
    }, [roomId, playerId, onLeave, animateMovement]);


    const handleRoll = async () => {
        // Optimistic update? No, wait for server.
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
