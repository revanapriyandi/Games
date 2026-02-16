import { useState, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { BackgroundMusic } from './components/BackgroundMusic';
import { leaveRoom } from './lib/game';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameSession, setGameSession] = useState<{ roomId: string; playerId: string } | null>(() => {
    const saved = localStorage.getItem("snake_ladder_session");
    return saved ? JSON.parse(saved) : null;
  });

  const handleJoin = useCallback((roomId: string, playerId: string) => {
    const session = { roomId, playerId };
    localStorage.setItem("snake_ladder_session", JSON.stringify(session));
    setGameSession(session);
  }, []);

  const handleLeave = useCallback(async () => {
    if (gameSession) {
      // Remove from Firebase room
      await leaveRoom(gameSession.roomId, gameSession.playerId).catch(console.error);
    }
    localStorage.removeItem("snake_ladder_session");
    setGameSession(null);
  }, [gameSession]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white flex flex-col items-center justify-center p-4">
      {!gameSession ? (
        <Lobby onJoin={handleJoin} />
      ) : (
        <GameRoom 
          roomId={gameSession.roomId} 
          playerId={gameSession.playerId} 
          onLeave={handleLeave}
        />
      )}
      <BackgroundMusic />
    </div>
  );
}

export default App;
