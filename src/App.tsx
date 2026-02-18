import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { leaveRoom } from './lib/game';

// Lazy load components with named exports
const Lobby = lazy(() => import('./components/Lobby').then(module => ({ default: module.Lobby })));
const GameRoom = lazy(() => import('./components/GameRoom').then(module => ({ default: module.GameRoom })));

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameSession, setGameSession] = useState<{ roomId: string; playerId: string } | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    const saved = localStorage.getItem("snake_ladder_session");
    const session = saved ? JSON.parse(saved) : null;

    if (roomParam && session && session.roomId !== roomParam) {
      return null;
    }
    return session;
  });

  // Preload components while splash screen is showing
  useEffect(() => {
    const preload = () => {
      import('./components/Lobby');
      import('./components/GameRoom');
    };
    // Delay slightly to let the splash screen animation start smoothly
    const timer = setTimeout(preload, 500);
    return () => clearTimeout(timer);
  }, []);

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
      <Suspense fallback={<div className="text-white animate-pulse">Loading adventure...</div>}>
        {!gameSession ? (
          <Lobby onJoin={handleJoin} />
        ) : (
          <GameRoom
            roomId={gameSession.roomId}
            playerId={gameSession.playerId}
            onLeave={handleLeave}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
