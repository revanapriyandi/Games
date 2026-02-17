import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay after 100%
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white z-50">
      <div className="mb-8 text-center animate-fade-in-scale opacity-0">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
          Snakes & Ladders
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mt-2 tracking-widest uppercase">
          Ultimate Challenge Edition
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-600 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="mt-2 text-sm text-gray-400 font-mono">Loading... {progress}%</p>
    </div>
  );
}
