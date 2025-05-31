import { useState } from 'react';
import { Player, GameState, Card } from '../types/poker';

export const PokerDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Demo game state showing poker dynamics
  const demoPlayers: Player[] = [
    {
      id: 'demo1',
      nickname: 'Neo',
      avatar: '🥷',
      chips: 245000,
      currentBet: 5000,
      position: 0,
      cards: [{ rank: 'A', suit: 'spades', isVisible: true }, { rank: 'K', suit: 'spades', isVisible: true }],
      isActive: true,
      isFolded: false,
      isAllIn: false
    },
    {
      id: 'demo2', 
      nickname: 'Morpheus',
      avatar: '🧙‍♂️',
      chips: 180000,
      currentBet: 5000,
      position: 1,
      cards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'diamonds' }],
      isActive: true,
      isFolded: false,
      isAllIn: false
    },
    {
      id: 'demo3',
      nickname: 'Trinity',
      avatar: '🦹‍♀️', 
      chips: 320000,
      currentBet: 10000,
      position: 2,
      cards: [{ rank: 'J', suit: 'clubs' }, { rank: '10', suit: 'clubs' }],
      isActive: true,
      isFolded: false,
      isAllIn: false
    },
    {
      id: 'demo4',
      nickname: 'Agent Smith',
      avatar: '🤖',
      chips: 0,
      currentBet: 0,
      position: 3,
      cards: [],
      isActive: false,
      isFolded: true,
      isAllIn: false
    }
  ];

  const communityCards: Card[] = [
    { rank: 'A', suit: 'hearts' },
    { rank: 'K', suit: 'clubs' },
    { rank: 'Q', suit: 'spades' },
    { rank: 'J', suit: 'hearts' },
    { rank: '10', suit: 'diamonds' }
  ];

  const demoGameState: GameState = {
    id: 'demo-game',
    players: demoPlayers,
    dealerPosition: 0,
    currentPlayerIndex: 2,
    communityCards,
    pot: 20000,
    currentBet: 10000,
    gamePhase: 'river',
    isGameActive: true,
    roomType: 'degen'
  };

  const renderCard = (card: Card) => (
    <div className="w-8 h-12 bg-white rounded border text-black text-xs flex flex-col items-center justify-center">
      <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}>
        {card.rank}
      </div>
      <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}>
        {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
      </div>
    </div>
  );

  if (!showDemo) {
    return (
      <div className="mb-4 p-3 border border-blue-500 bg-blue-900 bg-opacity-30">
        <div className="text-blue-400 text-sm font-bold mb-2">POKER DYNAMICS DEMO</div>
        <button 
          onClick={() => setShowDemo(true)}
          className="text-blue-300 text-xs hover:text-blue-100 underline"
        >
          Click to see how KEKMORPH Poker works
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 border border-blue-500 bg-blue-900 bg-opacity-30">
      <div className="flex justify-between items-center mb-3">
        <div className="text-blue-400 text-sm font-bold">POKER DYNAMICS DEMO</div>
        <button 
          onClick={() => setShowDemo(false)}
          className="text-blue-300 text-xs hover:text-blue-100"
        >
          ✕
        </button>
      </div>
      
      {/* Game Info */}
      <div className="mb-3 text-xs">
        <div className="text-blue-300">Game Phase: <span className="text-blue-100 font-bold">River (Final Betting)</span></div>
        <div className="text-blue-300">Pot: <span className="text-green-400 font-bold">{demoGameState.pot.toLocaleString()} KEKMORPH</span></div>
        <div className="text-blue-300">Current Bet: <span className="text-yellow-400">{demoGameState.currentBet.toLocaleString()} KEKMORPH</span></div>
      </div>

      {/* Community Cards */}
      <div className="mb-3">
        <div className="text-blue-300 text-xs mb-1">Community Cards:</div>
        <div className="flex gap-1">
          {communityCards.map((card, index) => (
            <div key={index}>{renderCard(card)}</div>
          ))}
        </div>
        <div className="text-green-400 text-xs mt-1">Straight: 10-J-Q-K-A!</div>
      </div>

      {/* Players */}
      <div className="space-y-2">
        {demoPlayers.map((player, index) => (
          <div 
            key={player.id} 
            className={`flex items-center justify-between p-2 rounded text-xs ${
              index === demoGameState.currentPlayerIndex ? 'bg-yellow-600 bg-opacity-30 border border-yellow-500' : 'bg-gray-800 bg-opacity-50'
            } ${player.isFolded ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{player.avatar}</span>
              <div>
                <div className="text-blue-300 font-bold">{player.nickname}</div>
                <div className="text-gray-400">
                  {player.isFolded ? 'FOLDED' : `${player.chips.toLocaleString()} chips`}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {!player.isFolded && (
                <>
                  <div className="text-yellow-400">Bet: {player.currentBet.toLocaleString()}</div>
                  <div className="flex gap-1 mt-1">
                    {player.cards.map((card, cardIndex) => (
                      <div key={cardIndex} className="w-6 h-8">
                        {renderCard(card)}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {index === demoGameState.currentPlayerIndex && (
                <div className="text-green-400 font-bold">TURN TO ACT</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="mt-3 p-2 bg-gray-800 bg-opacity-50 rounded text-xs">
        <div className="text-green-400 font-bold mb-1">How it works:</div>
        <div className="text-gray-300 space-y-1">
          <div>• Players buy in with real KEKMORPH tokens from treasury</div>
          <div>• Texas Hold'em with community cards and betting rounds</div>
          <div>• Trinity's turn - she can call 5K more, raise, or fold</div>
          <div>• Winners get KEKMORPH paid directly to their wallets</div>
          <div>• All transactions verified on Solana blockchain</div>
        </div>
      </div>
    </div>
  );
};