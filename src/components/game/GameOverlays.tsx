import { AnimatePresence } from "framer-motion";
import type { GameState, Player } from "../../lib/types";
import { ChallengeModal } from "../ChallengeModal";
import TreasureModal from "../TreasureModal";
import { WinnerModal } from "../WinnerModal";
import { PortalAnimation } from "../PortalAnimation";
import { RoleSelectionModal } from "./RoleSelectionModal";
import { failChallenge, markChallengeComplete, dismissTreasure, resetGame, selectRole } from "../../lib/game";
import { playTreasureSound } from "../../lib/sounds";

interface GameOverlaysProps {
    roomId: string;
    gameState: GameState;
    playerId: string;
    playersList: Player[];
    activePlayer?: Player;
    isAnimating: boolean;
    isWaitingForAnimation: boolean;
    isCompletingChallenge: boolean;
    setIsCompletingChallenge: (val: boolean) => void;
    thinkingPlayerId: string | null;
    portalInfo: {
        type: 'ladder' | 'snake';
        fromCell: number;
        toCell: number;
        playerAvatar: string;
    } | null;
    showPortal: boolean;
    onPortalComplete: () => void;
    onLeave: () => void;
}

export function GameOverlays({
    roomId,
    gameState,
    playerId,
    playersList,
    activePlayer,
    isAnimating,
    isWaitingForAnimation,
    isCompletingChallenge,
    setIsCompletingChallenge,
    thinkingPlayerId,
    portalInfo,
    showPortal,
    onPortalComplete,
    onLeave
}: GameOverlaysProps) {

    const handleChallengeComplete = async () => {
        setIsCompletingChallenge(true);
        await markChallengeComplete(roomId);
        setIsCompletingChallenge(false);
    }

    const handleChallengeFail = async () => {
        if (!activePlayer) return;
        setIsCompletingChallenge(true);
        await failChallenge(roomId, activePlayer.name, activePlayer.id);
        setIsCompletingChallenge(false);
    }

    const handleDismissTreasure = async () => {
        playTreasureSound();
        await dismissTreasure(roomId);
    }

    return (
        <>
            {/* Challenge Overlay */}
            <AnimatePresence>
                {!!gameState.currentChallenge && !isAnimating && !isWaitingForAnimation && !gameState.isRolling && !isCompletingChallenge && !thinkingPlayerId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <ChallengeModal
                            isOpen={true}
                            challenge={gameState.currentChallenge || ""}
                            penalty={gameState.currentPenalty}
                            isActivePlayer={activePlayer?.id === playerId}
                            playerName={activePlayer?.name || ""}
                            onComplete={handleChallengeComplete}
                            onFail={handleChallengeFail}
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
                        playerName={activePlayer?.name || ""}
                        onDismiss={handleDismissTreasure}
                    />
                )}
            </AnimatePresence>

            {/* Role Selection Overlay */}
            <AnimatePresence>
                {!!gameState.currentRoleSelection && !isAnimating && !isWaitingForAnimation && !gameState.isRolling && !thinkingPlayerId && activePlayer?.id === playerId && (
                    <RoleSelectionModal
                        roleIds={gameState.currentRoleSelection}
                        onSelect={(roleId) => selectRole(roomId, playerId, roleId)}
                    />
                )}
            </AnimatePresence>

            {/* Portal Animation Overlay */}
            <PortalAnimation
                isOpen={showPortal && !!portalInfo}
                type={portalInfo?.type || 'ladder'}
                fromCell={portalInfo?.fromCell || 0}
                toCell={portalInfo?.toCell || 0}
                playerAvatar={portalInfo?.playerAvatar || ''}
                onComplete={onPortalComplete}
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
        </>
    );
}
