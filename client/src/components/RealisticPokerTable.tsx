import React from 'react';
import { GameState, Player } from '../types/poker';
import PlayerPosition from './PlayerPosition';
import { PokerChipManager } from './PokerChipManager';

interface RealisticPokerTableProps {
  gameState: GameState | null;
  currentPlayer: Player | null;
  turnTimeLeft: number;
  isPlayerTurn: boolean;
  onSeatSelect?: (position: number) => void;
  walletAddress?: string;
  onChipUpdate?: (newAmount: number) => void;
}

const RealisticPokerTable: React.FC<RealisticPokerTableProps> = ({
  gameState,
  currentPlayer,
  turnTimeLeft,
  isPlayerTurn,
  onSeatSelect,
  walletAddress,
  onChipUpdate
}) => {
  // Seat positions for an oval poker table (9 seats) - positioned around the perimeter
  const seatPositions = [
    { position: 0, x: 50, y: 8, label: 'Seat 1' }, // Top center
    { position: 1, x: 78, y: 20, label: 'Seat 2' }, // Top right
    { position: 2, x: 92, y: 50, label: 'Seat 3' }, // Right
    { position: 3, x: 78, y: 80, label: 'Seat 4' }, // Bottom right
    { position: 4, x: 50, y: 92, label: 'Seat 5' }, // Bottom center
    { position: 5, x: 22, y: 80, label: 'Seat 6' }, // Bottom left
    { position: 6, x: 8, y: 50, label: 'Seat 7' }, // Left
    { position: 7, x: 22, y: 20, label: 'Seat 8' }, // Top left
    { position: 8, x: 35, y: 12, label: 'Seat 9' }, // Top left-center
  ];

  const getPlayerAtPosition = (position: number): Player | null => {
    if (!gameState || !gameState.players) return null;
    return Object.values(gameState.players).find(p => p.position === position) || null;
  };

  const handleSeatClick = (position: number) => {
    const playerAtSeat = getPlayerAtPosition(position);
    if (!playerAtSeat && onSeatSelect) {
      console.log(`Attempting to select seat ${position}`);
      onSeatSelect(position);
    }
  };

  const renderCommunityCards = () => {
    const cards = gameState?.communityCards || [];
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-12 h-16 rounded-lg border-2 ${
              cards[i] 
                ? 'bg-white border-gray-300 shadow-lg' 
                : 'bg-gray-800 border-gray-600 border-dashed'
            } flex items-center justify-center text-xs font-bold`}
          >
            {cards[i] ? (
              <div className={`${cards[i].suit === 'hearts' || cards[i].suit === 'diamonds' ? 'text-red-600' : 'text-black'}`}>
                {cards[i].rank}
                <div className="text-center">
                  {cards[i].suit === 'hearts' && '♥️'}
                  {cards[i].suit === 'diamonds' && '♦️'}
                  {cards[i].suit === 'clubs' && '♣️'}
                  {cards[i].suit === 'spades' && '♠️'}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">?</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPot = () => {
    return (
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-green-900 border-2 border-green-500 rounded-full px-4 py-2 text-center">
          <div className="text-green-400 text-xs font-semibold">POT</div>
          <div className="text-green-300 text-lg font-bold">
            {gameState?.pot?.toLocaleString() || 0}
          </div>
          <div className="text-green-400 text-xs">KEKMORPH</div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[700px] flex items-center justify-center p-8">
      {/* Poker Table */}
      <div className="relative w-[900px] h-[600px]">
        {/* Table Surface - Oval Shape */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-green-800 to-green-900 rounded-full border-8 border-yellow-600 shadow-2xl"
          style={{
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, #1a5d1a 0%, #0f3d0f 70%, #0a2a0a 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 0 100px rgba(0,255,65,0.3)'
          }}
        >
          {/* Felt Pattern */}
          <div className="absolute inset-4 rounded-full opacity-20">
            <div className="w-full h-full rounded-full border border-green-400 opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border border-green-400 rounded-full opacity-20"></div>
          </div>
          
          {/* Table Logo */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="text-green-400 font-mono text-lg font-bold tracking-wider opacity-70">
              KEKMORPH POKER
            </div>
          </div>

          {/* Community Cards Area */}
          {renderCommunityCards()}
          
          {/* Pot Display */}
          {renderPot()}

          {/* Betting Round Indicator */}
          {gameState && (
            <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-60 border border-green-500 rounded px-3 py-1">
                <div className="text-green-400 text-sm font-semibold text-center">
                  {gameState.bettingRound}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player Seats */}
        {seatPositions.map((seat) => {
          const player = getPlayerAtPosition(seat.position);
          const isEmpty = !player;
          
          return (
            <div
              key={seat.position}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${seat.x}%`,
                top: `${seat.y}%`,
              }}
            >
              {isEmpty ? (
                <button
                  onClick={() => handleSeatClick(seat.position)}
                  className="w-24 h-24 rounded-full border-3 border-dashed border-green-400 bg-green-900 bg-opacity-50 hover:bg-green-700 hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-green-500/50 relative z-10"
                  style={{
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-green-300 text-sm font-bold group-hover:text-green-100">
                      {seat.label}
                    </div>
                    <div className="text-green-400 text-xs opacity-90 group-hover:opacity-100 font-semibold">
                      BUY-IN
                    </div>
                    <div className="text-green-500 text-xs opacity-70 group-hover:opacity-100">
                      Click here
                    </div>
                  </div>
                </button>
              ) : (
                <PlayerPosition
                  player={player}
                  position={seat.position}
                  isCurrentPlayer={currentPlayer?.id === player.id}
                  isDealer={player.isDealer}
                  className="transform -translate-x-1/2 -translate-y-1/2"
                />
              )}
              
              {/* Dealer Button */}
              {player?.isDealer && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 border-2 border-yellow-300 rounded-full flex items-center justify-center text-black text-xs font-bold">
                  D
                </div>
              )}
              
              {/* Blind Indicators */}
              {player?.isSmallBlind && (
                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-blue-500 border border-blue-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  SB
                </div>
              )}
              {player?.isBigBlind && (
                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-red-500 border border-red-300 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  BB
                </div>
              )}
            </div>
          );
        })}

        {/* Turn Timer */}
        {isPlayerTurn && (
          <div className="absolute top-4 right-4">
            <div className="bg-red-600 border border-red-400 rounded px-3 py-1">
              <div className="text-white text-sm font-bold">
                Your Turn: {turnTimeLeft}s
              </div>
            </div>
          </div>
        )}

        {/* Chip Manager - Show when player is seated */}
        {currentPlayer && walletAddress && onChipUpdate && (
          <div className="absolute bottom-4 right-4 w-64">
            <PokerChipManager 
              walletAddress={walletAddress}
              currentChips={currentPlayer.chips}
              onChipUpdate={onChipUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RealisticPokerTable;