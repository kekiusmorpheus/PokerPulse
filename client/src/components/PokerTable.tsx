import React from 'react';
import { GameState, Player } from '../types/poker';
import PlayerPosition from './PlayerPosition';
import ChipAnimation from './ChipAnimation';
import { Card } from '../types/poker';

interface PokerTableProps {
  gameState: GameState | null;
  currentPlayer: Player | null;
  turnTimeLeft: number;
  isPlayerTurn: boolean;
}

const PokerTable: React.FC<PokerTableProps> = ({
  gameState,
  currentPlayer,
  turnTimeLeft,
  isPlayerTurn
}) => {
  const renderCommunityCard = (card: Card | null, index: number) => {
    if (!card) {
      return (
        <div key={index} className="card card-back w-16 h-24 flex items-center justify-center text-[#00FF41] animate-card-hover">
          <i className="fas fa-question opacity-50"></i>
        </div>
      );
    }

    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };

    const suitColors = {
      hearts: 'text-red-500',
      diamonds: 'text-red-500',
      clubs: 'text-black',
      spades: 'text-black'
    };

    return (
      <div key={index} className="card w-16 h-24 bg-white flex flex-col items-center justify-center text-lg font-bold animate-card-deal hover:animate-card-hover">
        <span className={`${suitColors[card.suit]} text-xl`}>{card.rank}</span>
        <span className={`${suitColors[card.suit]} text-2xl`}>{suitSymbols[card.suit]}</span>
      </div>
    );
  };

  const getPlayerAtPosition = (position: number): Player | null => {
    if (!gameState) return null;
    
    return Object.values(gameState.players).find(player => player.position === position) || null;
  };

  const renderTurnTimer = () => {
    if (!isPlayerTurn) return null;

    const progress = (20 - turnTimeLeft) / 20;
    const circumference = 2 * Math.PI * 28;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <div className="absolute top-4 right-4" id="turnTimer">
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90 w-16 h-16">
            <circle 
              cx="32" 
              cy="32" 
              r="28" 
              className="fill-none stroke-[#00FF41] stroke-[4px]"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                filter: 'drop-shadow(0 0 5px #00FF41)'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#00FF41]">
            {turnTimeLeft}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="poker-table w-full max-w-4xl h-96 relative rounded-full flex items-center justify-center">
      
      {/* Community Cards Area */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center mb-4">
          <div className="text-sm opacity-80 mb-2 text-[#00FF41]">COMMUNITY CARDS</div>
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4].map(index => 
              renderCommunityCard(gameState?.communityCards[index] || null, index)
            )}
          </div>
        </div>
        
        {/* Pot Information */}
        <div className="text-center relative">
          <div className="text-lg font-bold matrix-text">
            POT: <span>{gameState?.pot?.toLocaleString() || 0}</span> KEKMORPH
          </div>
          <div className="text-xs opacity-80 text-[#00FF41]">
            ROUND: <span>{gameState?.bettingRound || 'PRE-FLOP'}</span>
          </div>
          
          {/* Chip Animation */}
          <ChipAnimation
            potAmount={gameState?.pot || 0}
            isWinning={false}
            onComplete={() => {}}
          />
        </div>
      </div>
      
      {/* Player Positions (9 positions around the table) */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(position => {
        const player = getPlayerAtPosition(position);
        const isCurrentPlayerPosition = currentPlayer?.position === position;
        const isDealer = gameState?.dealerPosition === position;
        
        return (
          <PlayerPosition
            key={position}
            player={player}
            position={position}
            isCurrentPlayer={isCurrentPlayerPosition}
            isDealer={isDealer}
          />
        );
      })}
      
      {/* Turn Timer */}
      {renderTurnTimer()}
    </div>
  );
};

export default PokerTable;
