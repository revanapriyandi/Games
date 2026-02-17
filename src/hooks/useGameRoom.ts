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
    const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // State tracking refs to detect changes
    const prevGameStateRef = useRef<GameState | null>(null);
    const prevPlayerIdsRef = useRef<string[]>([]);

    // Animation queue/state
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

    const animateMovement = useCallback((pid: string, startPos: number, finalPos: number, _rollAmount: number, gameData: GameState) => {
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
                if (animIntervalRef.current) clearInterval(animIntervalRef.current);
                animIntervalRef.current = null;

                if (hasPortalEffect && gameData.portalFrom === current) {
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

                     portalCallbackRef.current = () => {
                         setShowPortal(false);
                         setActivePortalCell(null);
                         setPortalInfo(null);

                         setDisplayPositions(prev => ({ ...prev, [pid]: finalPos }));
                         finishAnimation(pid, gameData);
                     };
                } else {
                    finishAnimation(pid, gameData);
                }
            }

            setDisplayPositions(prev => ({ ...prev, [pid]: current }));

        }, 150); // Faster animation (150ms instead of 300ms)

    }, [finishAnimation]);

    // Room Subscription
    useEffect(() => {
        const unsubscribe = subscribeToRoom(roomId, (data) => {
            if (data && data.players) {
                setGameState(data);
            } else if (data && data.players === undefined) {
                 // Handle invalid state or kicked
                 // But wait, data might be null if room doesn't exist?
                 // Original code checked: if (data.players && !data.players[playerId]) onLeave();
            }
        });
        return () => {
            unsubscribe();
            if (animIntervalRef.current) clearInterval(animIntervalRef.current);
            if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
        };
    }, [roomId]);

    // React to GameState changes
    useEffect(() => {
        if (!gameState) return;

        const prevGameState = prevGameStateRef.current;
        const newPlayers = gameState.players;
        const currentPids = Object.keys(newPlayers);

        // 1. Check if player was kicked
        if (!newPlayers[playerId]) {
            onLeave();
            return;
        }

        // 2. Initial Load Handling
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            const initialPos: Record<string, number> = {};
            Object.values(newPlayers).forEach(p => initialPos[p.id] = p.position || 0);
            setDisplayPositions(initialPos);
            prevPlayerIdsRef.current = currentPids;
            prevGameStateRef.current = gameState;
            return;
        }

        // 3. Detect Position Changes
        Object.keys(newPlayers).forEach(pid => {
            const oldPos = prevGameState?.players[pid]?.position || 0;
            const newPos = newPlayers[pid].position || 0;

            if (oldPos !== newPos) {
                const roll = gameState.lastRoll || 0;
                // Queue animation
                pendingAnimRef.current = { pid, from: oldPos, to: newPos, roll };
                setIsWaitingForAnimation(true);
            }
        });

        // 4. Handle Rolling State Transitions
        const wasRolling = prevGameState?.isRolling || false;
        const isRolling = gameState.isRolling || false;

        if (wasRolling && !isRolling) {
            // Roll finished
            playDiceResultSound();
            setShowResult(true);

            if (resultTimerRef.current) clearTimeout(resultTimerRef.current);

            resultTimerRef.current = setTimeout(() => {
                setShowResult(false);

                if (pendingAnimRef.current) {
                    const { pid, from, to, roll } = pendingAnimRef.current;
                    pendingAnimRef.current = null;
                    animateMovement(pid, from, to, roll, gameState);
                } else {
                    setIsWaitingForAnimation(false);
                }
            }, 1500);
        } else if (!isRolling && pendingAnimRef.current && !isAnimating && !showResult) {
            // Animation pending (e.g. card effect, or joined late) and not rolling
             const { pid, from, to, roll } = pendingAnimRef.current;
             pendingAnimRef.current = null;
             animateMovement(pid, from, to, roll, gameState);
        }

        // 5. New Joiner Notification
        if (prevPlayerIdsRef.current.length > 0) {
             const joined = currentPids.find(id => !prevPlayerIdsRef.current.includes(id));
             if (joined && joined !== playerId) {
                 setNotification(`Selamat datang, ${newPlayers[joined].name}!`);
                 setTimeout(() => setNotification(null), 3000);
             }
        }

        // Update refs
        prevPlayerIdsRef.current = currentPids;
        prevGameStateRef.current = gameState;

    }, [gameState, playerId, onLeave, animateMovement, isAnimating, showResult]);

    const handleRoll = async () => {
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
