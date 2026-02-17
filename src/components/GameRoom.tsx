import { useState, useEffect, useRef } from "react";
import { playCard, clearCardEffect, updateStakes, acceptStakes } from "../lib/game";
import { playCardUseSound, playWorldEventSound, playDiceResultSound } from "../lib/sounds";
import { Board } from "./Board";
import { useGameRoom } from "../hooks/useGameRoom";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { SystemMenu } from "./game/SystemMenu";
import { GameWaiting } from "./game/GameWaiting";
import { PlayerTabs } from "./game/PlayerTabs";
import { GameControls } from "./game/GameControls";
import { GameChat } from "./game/GameChat";
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

    const activeEventId = gameState?.activeWorldEvent?.id;

    // Play World Event Sound
    useEffect(() => {
        if (activeEventId) {
             playWorldEventSound();
        }
    }, [activeEventId]);

    // Sound alert when stakes are accepted
    const lastStakeCountRef = useRef(0);
    const [stakesNotification, setStakesNotification] = useState<string | null>(null);

    useEffect(() => {
        const currentCount = gameState?.stakesAcceptedBy?.length || 0;
        if (currentCount > lastStakeCountRef.current && currentCount > 0) {
             playDiceResultSound(); 
             const players = Object.values(gameState?.players || {});
             const lastAccepterId = gameState?.stakesAcceptedBy?.[gameState.stakesAcceptedBy.length - 1]; 
             const lastAccepter = players.find(p => p.id === lastAccepterId);
             if (lastAccepter) {
                 setTimeout(() => {
                     setStakesNotification(`${lastAccepter.name} menyetujui taruhan! 🤝`);
                     setTimeout(() => setStakesNotification(null), 3000);
                 }, 0);
             }
        }
        lastStakeCountRef.current = currentCount;
    }, [gameState?.stakesAcceptedBy, gameState?.players]);


    const [usingCardIndex, setUsingCardIndex] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // Stakes Editing State
    const [isEditingStakes, setIsEditingStakes] = useState(false);
    const [editStakesValue, setEditStakesValue] = useState("");

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditStakes = () => {
        if (!gameState?.players[playerId]?.isHost) return;
        setEditStakesValue(gameState.stakes || "");
        setIsEditingStakes(true);
    };

    const handleSaveStakes = () => {
        updateStakes(roomId, editStakesValue);
        setIsEditingStakes(false);
        // Play notification sound? (Managed by listener)
    };

    if (!gameState || !gameState.players) return <div className="text-white text-center mt-20 animate-pulse text-lg">⏳ Loading game state...</div>;

    const player = gameState.players[playerId];
    const isHost = player?.isHost;
    const playersList = Object.values(gameState.players);
    const isTurn = gameState.status === "playing" && playersList[gameState.currentTurnIndex]?.id === playerId;
    const activePlayer = playersList[gameState.currentTurnIndex];

    const disabled = !isTurn || !!gameState.currentChallenge || isAnimating || !!gameState.isRolling;

    if (gameState.status === "waiting") {
        return (
            <>
                <SystemMenu
                    roomId={roomId}
                    onLeave={onLeave}
                    isVoiceJoined={isJoined}
                    isVoiceMuted={isMuted}
                    toggleVoice={toggleVoice}
                    toggleMute={toggleMute}
                    onToggleChat={() => setIsChatOpen(!isChatOpen)}
                    isChatOpen={isChatOpen}
                    themeName={gameState.aiConfig?.theme}
                />
                <GameWaiting
                    roomId={roomId}
                    players={playersList}
                    playerId={playerId}
                    isHost={!!isHost}
                    onLeave={onLeave}
                    onCopy={handleCopy}
                    copied={copied}
                    stakes={gameState.stakes}
                    onChangeStakes={(val) => updateStakes(roomId, val)}
                    stakesAcceptedBy={gameState.stakesAcceptedBy || []}
                    onAcceptStakes={() => acceptStakes(roomId, playerId)}
                />
                <GameChat
                    roomId={roomId}
                    playerId={playerId}
                    chatMessages={gameState.chat}
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(!isChatOpen)}
                />
            </>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center relative overflow-y-auto bg-slate-900/50">
            <SystemMenu
                roomId={roomId}
                onLeave={onLeave}
                isVoiceJoined={isJoined}
                isVoiceMuted={isMuted}
                toggleVoice={toggleVoice}
                toggleMute={toggleMute}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                isChatOpen={isChatOpen}
                themeName={gameState.aiConfig?.theme}
            />

            {/* Stakes Notification Toast */}
            {stakesNotification && (
                <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
                    <div className="bg-green-600/90 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-green-400/30 backdrop-blur-md">
                        <span className="text-xl">🤝</span>
                        <span className="font-bold text-sm">{stakesNotification}</span>
                    </div>
                </div>
            )}

            {/* Theme badge converted to inside settings */}\n

            {/* Room ID badge */}
            <div className="fixed top-3 right-3 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-gray-400 select-all">
                ROOM: <span className="text-white font-bold">{roomId}</span>
            </div>

            {/* Stakes Badge (In-Game) */}
            {gameState.stakes && (
                <div 
                    onClick={isHost ? handleEditStakes : undefined}
                    className={`fixed top-3 right-36 z-20 hidden md:block ${isHost ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : 'pointer-events-none'}`}
                    title={isHost ? "Klik untuk edit taruhan" : "Taruhan"}
                >
                     <div className={`px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[10px] text-yellow-400 font-bold flex items-center gap-2 ${isHost ? 'hover:bg-yellow-500/20' : ''}`}>
                        <span>🏆</span>
                        <span className="max-w-[150px] truncate">"{gameState.stakes}"</span>
                        {isHost && <span className="text-[8px] opacity-50 ml-1">(Edit)</span>}
                     </div>
                </div>
            )}
            
            {/* World Event Notification */}
            {gameState.activeWorldEvent && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-md px-4">
                    <div className="bg-black/80 backdrop-blur-md border border-yellow-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-bounce-in">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-400 uppercase tracking-widest drop-shadow-sm">
                                {gameState.activeWorldEvent.name}
                            </h3>
                            <p className="text-white/90 text-sm font-medium mt-1">
                                {gameState.activeWorldEvent.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                    fogActive={(gameState.fogDuration || 0) > 0}
                    worldEventType={gameState.activeWorldEvent?.type}
                />
            </div>
            
            <GameControls
                gameState={gameState}
                handleRoll={handleRoll}
                disabled={disabled}
                showResult={showResult}
            />

            <GameChat
                roomId={roomId}
                playerId={playerId}
                chatMessages={gameState.chat}
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
            />

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

            {/* Stakes Edit Modal */}
            {isEditingStakes && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>🏆</span> Edit Taruhan & Hukuman
                        </h3>
                        
                        <div className="mb-6">
                            <label className="block text-xs uppercase tracking-wider text-white/50 font-bold mb-2">
                                Isi Taruhan Baru
                            </label>
                            <textarea
                                value={editStakesValue}
                                onChange={(e) => setEditStakesValue(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-500/50 transition-colors min-h-[120px] resize-none"
                                placeholder="Contoh: Yang kalah push up 10x..."
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsEditingStakes(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveStakes}
                                className="flex-1 px-4 py-3 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
