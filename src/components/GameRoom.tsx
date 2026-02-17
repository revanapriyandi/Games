import { useState } from "react";
import { playCard, clearCardEffect } from "../lib/game";
import { playCardUseSound } from "../lib/sounds";
import { Board } from "./Board";
import { useGameRoom } from "../hooks/useGameRoom";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { VoiceControl } from "./game/VoiceControl";
import { GameHeader } from "./game/GameHeader";
import { GameWaiting } from "./game/GameWaiting";
import { PlayerTabs } from "./game/PlayerTabs";
import { GameControls } from "./game/GameControls";
import { RobloxChat } from "./game/RobloxChat";
import { CardInventory } from "./game/CardInventory";
import { TargetPicker } from "./game/TargetPicker";
import { TurnAnnouncement } from "./game/TurnAnnouncement";
import { GameLog } from "./game/GameLog";
import { JoinNotification } from "./game/JoinNotification";
import { GameOverlays } from "./game/GameOverlays";

interface GameRoomProps {
    roomId: string;
    playerId: string;
    onLeave: () => void;
}

export function GameRoom({ roomId, playerId, onLeave }: GameRoomProps) {
    const {
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
    } = useGameRoom({ roomId, playerId, onLeave });

    const { isJoined, isMuted, toggleVoice, toggleMute, speakingPlayers } = useVoiceChat(roomId, playerId);

    const [usingCardIndex, setUsingCardIndex] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!gameState || !gameState.players) return <div className="text-white text-center mt-20 animate-pulse text-lg">⏳ Loading game state...</div>;

    const player = gameState.players[playerId];
    const isHost = player?.isHost;
    const playersList = Object.values(gameState.players);
    const isTurn = gameState.status === "playing" && playersList[gameState.currentTurnIndex]?.id === playerId;
    const activePlayer = playersList[gameState.currentTurnIndex];

    // Disable controls if: not turn, challenge pending, animating, rolling, or deciding on card target?
    // Actually card targeting is separate modal.
    const disabled = !isTurn || !!gameState.currentChallenge || isAnimating || !!gameState.isRolling;

    if (gameState.status === "waiting") {
        return (
            <>
                <VoiceControl
                    isJoined={isJoined}
                    isMuted={isMuted}
                    toggleVoice={toggleVoice}
                    toggleMute={toggleMute}
                />
                <GameWaiting
                    roomId={roomId}
                    players={playersList}
                    playerId={playerId}
                    isHost={!!isHost}
                    onLeave={onLeave}
                    onCopy={handleCopy}
                    copied={copied}
                />
                <RobloxChat roomId={roomId} playerId={playerId} chatMessages={gameState.chat} />
            </>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-y-auto bg-slate-900/50">
            <VoiceControl
                isJoined={isJoined}
                isMuted={isMuted}
                toggleVoice={toggleVoice}
                toggleMute={toggleMute}
            />
            <GameHeader
                roomId={roomId}
                onLeave={onLeave}
                aiConfig={gameState.aiConfig}
            />
            
            <PlayerTabs
                players={playersList}
                currentTurnIndex={gameState.currentTurnIndex}
                aiConfig={gameState.aiConfig}
            />

            <div className="flex-1 w-full flex items-center justify-center pb-32 pt-16 min-h-[500px]">
                <Board 
                    players={playersList} 
                    displayPositions={displayPositions} 
                    thinkingPlayerId={thinkingPlayerId} 
                    activePortalCell={activePortalCell} 
                    portals={gameState.portals}
                    activeCardEffect={gameState.activeCardEffect}
                    speakingPlayers={speakingPlayers}
                />
            </div>
            
            <GameControls
                gameState={gameState}
                handleRoll={handleRoll}
                disabled={disabled}
                showResult={showResult}
            />

            <RobloxChat roomId={roomId} playerId={playerId} chatMessages={gameState.chat} />

            {player && (
                <CardInventory
                    player={player}
                    isTurn={isTurn}
                    onPlayCard={(idx, card) => {
                        if (card.targetType === 'self') {
                            playCardUseSound();
                            playCard(roomId, playerId, idx);
                            setTimeout(() => clearCardEffect(roomId), 2500);
                        } else {
                            setUsingCardIndex(idx);
                        }
                    }}
                />
            )}

            {usingCardIndex !== null && player?.cards?.[usingCardIndex] && (
                <TargetPicker
                    card={player.cards[usingCardIndex]}
                    players={playersList}
                    currentPlayerId={playerId}
                    onSelect={(targetId) => {
                        playCard(roomId, playerId, usingCardIndex, targetId);
                        setUsingCardIndex(null);
                        setTimeout(() => clearCardEffect(roomId), 2500);
                    }}
                    onCancel={() => setUsingCardIndex(null)}
                />
            )}

            <TurnAnnouncement
                currentTurnIndex={gameState.currentTurnIndex}
                isTurn={isTurn}
                activePlayer={activePlayer}
            />

            <GameLog logs={gameState.logs} />
            <JoinNotification notification={notification} />

            <GameOverlays
                roomId={roomId}
                gameState={gameState}
                playerId={playerId}
                playersList={playersList}
                activePlayer={activePlayer}
                isAnimating={isAnimating}
                isWaitingForAnimation={isWaitingForAnimation}
                isCompletingChallenge={isCompletingChallenge}
                setIsCompletingChallenge={setIsCompletingChallenge}
                thinkingPlayerId={thinkingPlayerId}
                portalInfo={portalInfo}
                showPortal={showPortal}
                onPortalComplete={handlePortalComplete}
                onLeave={onLeave}
            />
        </div>
    );
}
