import React, { useEffect, useState } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface WinningAnimationProps {
  isVisible: boolean;
  winAmount: number;
  winnerName: string;
  onComplete: () => void;
}

const WinningAnimation: React.FC<WinningAnimationProps> = ({
  isVisible,
  winAmount,
  winnerName,
  onComplete
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (isVisible) {
      // Play chip collecting sounds first, then victory
      playSound('potWin');
      setTimeout(() => playSound('win'), 800);
      setShowConfetti(true);
      
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, playSound, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
      
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#FFD700] animate-winning-glow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Main winning message */}
      <div className="relative z-10 text-center animate-winning-glow">
        <div className="text-6xl font-bold text-[#FFD700] mb-4 matrix-text">
          🏆 WINNER! 🏆
        </div>
        
        <div className="text-3xl font-bold text-[#00FF41] mb-2">
          {winnerName}
        </div>
        
        <div className="text-2xl text-[#00AA2E]">
          Won: {winAmount.toLocaleString()} KEKMORPH
        </div>
        
        <div className="mt-4 text-lg text-[#00FF41] opacity-80 animate-pulse">
          Welcome to the Matrix of Victory
        </div>
      </div>
    </div>
  );
};

export default WinningAnimation;