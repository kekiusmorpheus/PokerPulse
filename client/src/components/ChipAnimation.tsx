import React, { useEffect, useState } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface ChipAnimationProps {
  potAmount: number;
  isWinning: boolean;
  winnerPosition?: number;
  onComplete?: () => void;
}

interface Chip {
  id: string;
  x: number;
  y: number;
  color: string;
  value: number;
}

const ChipAnimation: React.FC<ChipAnimationProps> = ({
  potAmount,
  isWinning,
  winnerPosition,
  onComplete
}) => {
  const [chips, setChips] = useState<Chip[]>([]);
  const { playSound } = useSoundEffects();

  // Generate chips based on pot amount
  useEffect(() => {
    const generateChips = () => {
      const chipTypes = [
        { value: 1000, color: 'bg-green-500' },
        { value: 5000, color: 'bg-blue-500' },
        { value: 10000, color: 'bg-red-500' },
        { value: 25000, color: 'bg-purple-500' },
        { value: 50000, color: 'bg-yellow-500' }
      ];

      const newChips: Chip[] = [];
      let remainingAmount = potAmount;
      let chipId = 0;

      chipTypes.reverse().forEach(chipType => {
        const count = Math.floor(remainingAmount / chipType.value);
        for (let i = 0; i < Math.min(count, 8); i++) {
          newChips.push({
            id: `chip-${chipId++}`,
            x: -20 + Math.random() * 40,
            y: -10 + Math.random() * 20,
            color: chipType.color,
            value: chipType.value
          });
        }
        remainingAmount %= chipType.value;
      });

      setChips(newChips.slice(0, 12)); // Limit to 12 chips for performance
    };

    if (potAmount > 0) {
      generateChips();
    }
  }, [potAmount]);

  // Handle winning animation
  useEffect(() => {
    if (isWinning && chips.length > 0) {
      playSound('potWin');
      
      // Animate chips moving to winner
      chips.forEach((chip, index) => {
        setTimeout(() => {
          playSound('chipStack');
        }, index * 100);
      });

      // Complete animation after all chips are collected
      const timer = setTimeout(() => {
        onComplete?.();
      }, chips.length * 100 + 500);

      return () => clearTimeout(timer);
    }
  }, [isWinning, chips, playSound, onComplete]);

  if (chips.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {chips.map((chip, index) => (
        <div
          key={chip.id}
          className={`absolute w-6 h-6 rounded-full border-2 border-[#00FF41] ${chip.color} ${
            isWinning ? 'chip-collect' : 'chip-scatter'
          }`}
          style={{
            left: `calc(50% + ${chip.x}px)`,
            top: `calc(50% + ${chip.y}px)`,
            '--collect-x': winnerPosition ? `${(winnerPosition - 5) * 50}px` : '0px',
            '--scatter-x': `${chip.x}px`,
            animationDelay: isWinning ? `${index * 100}ms` : `${Math.random() * 500}ms`,
            zIndex: 10 + index
          } as React.CSSProperties}
        >
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
            {chip.value >= 1000 ? `${chip.value / 1000}K` : chip.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChipAnimation;