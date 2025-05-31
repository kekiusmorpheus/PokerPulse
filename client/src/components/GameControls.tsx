import React, { useState } from 'react';
import { PlayerAction } from '../types/poker';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface GameControlsProps {
  isPlayerTurn: boolean;
  minBet: number;
  maxBet: number;
  currentChips: number;
  onAction: (action: PlayerAction, betAmount?: number) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  isPlayerTurn,
  minBet,
  maxBet,
  currentChips,
  onAction
}) => {
  const [showBetSlider, setShowBetSlider] = useState(false);
  const [betAmount, setBetAmount] = useState(minBet);
  const { playSound } = useSoundEffects();

  const handleFold = () => {
    playSound('fold');
    onAction('fold');
  };

  const handleCall = () => {
    playSound('call');
    onAction('call');
  };

  const handleRaise = () => {
    if (showBetSlider) {
      playSound('raise');
      onAction('raise', betAmount);
      setShowBetSlider(false);
    } else {
      playSound('chipBet');
      setShowBetSlider(true);
    }
  };

  const handleCheck = () => {
    playSound('call');
    onAction('check');
  };

  if (!isPlayerTurn) {
    return (
      <div className="text-center text-[#00FF41] opacity-60">
        <div className="text-sm">Waiting for other players...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Bet Slider */}
      {showBetSlider && (
        <div className="w-64 bg-black bg-opacity-80 p-4 border border-[#00FF41] rounded">
          <div className="text-center mb-2 text-[#00FF41]">
            Bet Amount: <span className="text-[#00AA2E]">{betAmount.toLocaleString()}</span> KEKMORPH
          </div>
          <Slider
            value={[betAmount]}
            onValueChange={(value) => setBetAmount(value[0])}
            min={minBet}
            max={Math.min(maxBet, currentChips)}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs mt-2 text-[#00FF41] opacity-80">
            <span>Min: {minBet.toLocaleString()}</span>
            <span>Max: {Math.min(maxBet, currentChips).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleFold}
          className="px-6 py-3 border-2 border-[#00FF41] bg-black bg-opacity-80 hover:bg-[#003300] text-[#00FF41] transition-all duration-300"
        >
          <i className="fas fa-times mr-2"></i>FOLD
        </Button>

        {minBet === 0 ? (
          <Button
            onClick={handleCheck}
            className="px-6 py-3 border-2 border-[#00FF41] bg-black bg-opacity-80 hover:bg-[#003300] text-[#00FF41] transition-all duration-300"
          >
            <i className="fas fa-check mr-2"></i>CHECK
          </Button>
        ) : (
          <Button
            onClick={handleCall}
            className="px-6 py-3 border-2 border-[#00FF41] bg-black bg-opacity-80 hover:bg-[#003300] text-[#00FF41] transition-all duration-300"
          >
            <i className="fas fa-check mr-2"></i>CALL ({minBet.toLocaleString()})
          </Button>
        )}

        <Button
          onClick={handleRaise}
          className="px-6 py-3 border-2 border-[#00AA2E] bg-[#003300] hover:bg-[#00FF41] hover:text-black text-[#00FF41] transition-all duration-300"
        >
          <i className="fas fa-arrow-up mr-2"></i>
          {showBetSlider ? 'CONFIRM RAISE' : 'RAISE'}
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
