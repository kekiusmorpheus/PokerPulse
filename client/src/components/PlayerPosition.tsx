import React from 'react';
import { Player } from '../types/poker';

interface PlayerPositionProps {
  player: Player | null;
  position: number;
  isCurrentPlayer?: boolean;
  isDealer?: boolean;
  className?: string;
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({
  player,
  position,
  isCurrentPlayer = false,
  isDealer = false,
  className = ''
}) => {
  const getPositionClasses = (pos: number) => {
    const positions = {
      1: 'absolute -top-8 left-1/2 transform -translate-x-1/2',
      2: 'absolute top-4 right-0',
      3: 'absolute top-1/2 -right-8 transform -translate-y-1/2',
      4: 'absolute bottom-4 right-0',
      5: 'absolute -bottom-8 left-1/2 transform -translate-x-1/2',
      6: 'absolute bottom-4 left-0',
      7: 'absolute top-1/2 -left-8 transform -translate-y-1/2',
      8: 'absolute top-4 left-0',
      9: 'absolute top-0 left-1/4'
    };
    return positions[pos as keyof typeof positions] || '';
  };

  const getAvatarIcon = (avatar: string) => {
    const avatarIcons = {
      neo: '🕴️',
      morpheus: '🥽',
      trinity: '👩‍💼',
      agent: '🤵',
      oracle: '👵',
      cipher: '🧔',
      tank: '👨‍🔧',
      switch: '👩‍🎤'
    };
    return avatarIcons[avatar as keyof typeof avatarIcons] || '🕴️';
  };

  if (!player) {
    return (
      <div className={`player-position w-24 h-20 rounded-lg flex flex-col items-center justify-center text-xs ${getPositionClasses(position)} ${className}`}>
        <div className="font-bold mb-1 text-[#00FF41]">EMPTY</div>
        <div className="text-xs opacity-40 text-[#00FF41]">WAITING...</div>
      </div>
    );
  }

  return (
    <div className={`player-position w-24 h-20 rounded-lg flex flex-col items-center justify-center text-xs ${getPositionClasses(position)} ${isCurrentPlayer ? 'border-[#00AA2E]' : ''} ${className}`}>
      {/* Player Avatar */}
      <div className="w-8 h-8 border border-[#00FF41] bg-[#003300] rounded-full flex items-center justify-center mb-1">
        <span className="text-sm">{getAvatarIcon(player.avatar)}</span>
      </div>
      
      {/* Player Info */}
      <div className={`font-bold mb-1 ${isCurrentPlayer ? 'text-[#00AA2E]' : 'text-[#00FF41]'}`}>
        {isCurrentPlayer ? 'YOU' : player.nickname}
      </div>
      <div className="text-xs opacity-80 text-[#00FF41]">
        {player.chips.toLocaleString()}
      </div>
      
      {/* Player Cards */}
      <div className="flex space-x-1 mt-1">
        {player.cards.length > 0 ? (
          player.cards.map((card, index) => (
            <div key={index} className={`w-6 h-8 ${card.isVisible ? 'card bg-white text-black' : 'card-back'} text-xs flex items-center justify-center animate-card-deal hover:animate-card-hover transition-all duration-300`}>
              {card.isVisible ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold">{card.rank}</span>
                  <span className={`text-xs ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                    {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                  </span>
                </div>
              ) : (
                <span className="text-[#00FF41] opacity-60">?</span>
              )}
            </div>
          ))
        ) : (
          <>
            <div className="card-back w-6 h-8 animate-card-hover"></div>
            <div className="card-back w-6 h-8 animate-card-hover"></div>
          </>
        )}
      </div>
      
      {/* Dealer Button */}
      {isDealer && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#00FF41] text-black rounded-full flex items-center justify-center font-bold text-xs">
          D
        </div>
      )}
      
      {/* Current Bet */}
      {player.currentBet > 0 && (
        <div className="absolute -bottom-2 bg-[#003300] border border-[#00FF41] px-2 py-1 rounded text-xs">
          {player.currentBet.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default PlayerPosition;
