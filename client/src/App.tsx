import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Components
import MatrixRain from './components/MatrixRain';
import WalletConnection from './components/WalletConnection';
import RoomSelector from './components/RoomSelector';
import PokerTable from './components/PokerTable';
import RealisticPokerTable from './components/RealisticPokerTable';
import GameControls from './components/GameControls';
import AvatarModal from './components/AvatarModal';
import ChatLog from './components/ChatLog';
import WinningAnimation from './components/WinningAnimation';
import { PlayerBalance } from './components/PlayerBalance';
import { PlayerBalancePanel } from './components/PlayerBalancePanel';
import { SimpleBalance } from './components/SimpleBalance';
import { PokerDemo } from './components/PokerDemo';

// Hooks
import { usePhantomWallet } from './hooks/usePhantomWallet';
import { usePokerGame } from './hooks/usePokerGame';
import { useRoomCounts } from './hooks/useRoomCounts';

// Utils
import { RoomType } from './types/poker';
import { initializeFirebase } from './lib/firebase';

function App() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [playerNickname, setPlayerNickname] = useState('ANONYMOUS');
  const [playerAvatar, setPlayerAvatar] = useState('neo');
  const [showChat, setShowChat] = useState(false);
  const [showWinning, setShowWinning] = useState(false);
  const [winData, setWinData] = useState({ amount: 0, winner: '' });
  const [showPokerTable, setShowPokerTable] = useState(false);
  const [pendingSeat, setPendingSeat] = useState<{position: number, room: RoomType, amount: number} | null>(null);

  const { walletState, processCashOut } = usePhantomWallet();
  const { 
    gameState, 
    currentPlayer, 
    isInGame, 
    isPlayerTurn, 
    turnTimeLeft, 
    joinGame, 
    leaveGame, 
    performAction 
  } = usePokerGame();
  const playerCounts = useRoomCounts();

  // Initialize Firebase on app load
  useEffect(() => {
    initializeFirebase();
  }, []);

  const handleRoomJoin = async () => {
    if (!selectedRoom || !walletState.isConnected) return;

    try {
      const roomConfigs = {
        degen: { buyIn: 100000 },
        green: { buyIn: 500000 },
        morpheus: { buyIn: 1000000 }
      };

      const config = roomConfigs[selectedRoom];
      
      if (walletState.kekMorphBalance < config.buyIn) {
        alert(`Insufficient KEKMORPH tokens. Need ${config.buyIn.toLocaleString()} but have ${walletState.kekMorphBalance.toLocaleString()}`);
        return;
      }

      // Enter the room and show the table for seat selection
      setShowChat(true);
      
      console.log(`Entered ${selectedRoom} room. Click on any seat to buy-in for ${config.buyIn.toLocaleString()} KEKMORPH`);
      
    } catch (error) {
      console.error('Failed to enter room:', error);
      alert(error instanceof Error ? error.message : 'Failed to enter room');
    }
  };

  const handleJoinTable = (roomType: RoomType) => {
    // Check both wallet state and direct window.solana connection
    const isWalletConnected = walletState.isConnected || (window.solana?.isConnected && window.solana?.publicKey);
    
    if (!isWalletConnected) {
      alert('Please connect your Phantom wallet first');
      return;
    }
    
    // Always allow table access - token verification happens during buy-in
    setSelectedRoom(roomType);
    setShowPokerTable(true);
  };

  const handleSeatSelection = async (position: number) => {
    // First check if Phantom wallet is available
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not detected. Please install Phantom wallet extension.');
      return;
    }

    // Check if wallet is connected, if not try to connect
    if (!window.solana.isConnected || !window.solana.publicKey) {
      try {
        console.log('Connecting to Phantom wallet...');
        await window.solana.connect();
      } catch (error) {
        alert('Please connect your Phantom wallet to continue');
        return;
      }
    }

    const publicKey = window.solana.publicKey?.toString();
    if (!selectedRoom || !publicKey) {
      alert('Unable to get wallet address. Please check your Phantom wallet connection.');
      return;
    }

    try {
      const roomConfigs = {
        degen: { buyIn: 100000 },
        green: { buyIn: 500000 },
        morpheus: { buyIn: 1000000 }
      };

      const config = roomConfigs[selectedRoom];
      const { getTreasuryWalletInfo } = await import('./lib/solana');
      const treasuryInfo = getTreasuryWalletInfo();
      
      // Show treasury wallet details for direct transfer
      const transferConfirmed = confirm(
        `SEND KEKMORPH TOKENS DIRECTLY TO TREASURY:\n\n` +
        `Amount: ${config.buyIn.toLocaleString()} KEKMORPH\n` +
        `Treasury Address: ${treasuryInfo.address}\n\n` +
        `After sending, click "VERIFY PAYMENT" to check your transaction and take seat ${position}.\n\n` +
        `Would you like to copy the treasury address to your clipboard?`
      );
      
      if (transferConfirmed) {
        // Copy treasury address to clipboard
        try {
          await navigator.clipboard.writeText(treasuryInfo.address);
          alert(`Treasury address copied to clipboard!\n\n` +
                `Send ${config.buyIn.toLocaleString()} KEKMORPH tokens to:\n${treasuryInfo.address}\n\n` +
                `Then click "VERIFY PAYMENT" button.`);
          
          // Set pending seat for this player
          setPendingSeat({ position, room: selectedRoom, amount: config.buyIn });
          
        } catch (clipboardError) {
          alert(`Treasury Address: ${treasuryInfo.address}\n\n` +
                `Send ${config.buyIn.toLocaleString()} KEKMORPH tokens to this address, then click "VERIFY PAYMENT".`);
          setPendingSeat({ position, room: selectedRoom, amount: config.buyIn });
        }
      }
      
    } catch (error) {
      console.error('Failed to process seat selection:', error);
      alert(error instanceof Error ? error.message : 'Failed to process seat selection');
    }
  };

  const handleVerifyPayment = async () => {
    if (!pendingSeat || !window.solana?.publicKey) return;

    const publicKey = window.solana.publicKey.toString();
    
    try {
      const { triggerPhantomTransfer } = await import('./lib/phantomTransaction');
      const { apiRequest } = await import('./lib/queryClient');
      
      console.log('Starting Phantom transaction...');
      const signature = await triggerPhantomTransfer(pendingSeat.amount, publicKey);
      console.log('Transaction completed:', signature);
      
      // Record transaction in database
      await fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: publicKey,
          transactionSignature: signature,
          amount: pendingSeat.amount,
          type: 'deposit',
          status: 'confirmed',
          blockchainConfirmed: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Transaction recorded in database');
      
      // Auto-join after successful transaction with the deposit amount as chips
      console.log('Joining game with player data:', { nickname: playerNickname, avatar: playerAvatar });
      await joinGame(pendingSeat.room, {
        nickname: playerNickname,
        avatar: playerAvatar
      }, pendingSeat.amount);
      
      console.log('Successfully joined game');
      setPendingSeat(null);
      
    } catch (error) {
      console.error('Payment verification failed:', error);
    }
  };

  const handleAvatarSave = (nickname: string, avatar: string) => {
    setPlayerNickname(nickname);
    setPlayerAvatar(avatar);
  };

  const handleCashOut = async () => {
    if (!currentPlayer || !walletState.isConnected) return;

    try {
      const chipAmount = currentPlayer.chips;
      if (chipAmount <= 0) {
        alert('No chips to cash out');
        return;
      }

      const signature = await processCashOut(chipAmount);
      alert(`Successfully cashed out ${chipAmount.toLocaleString()} chips as KEKMORPH tokens! Transaction: ${signature.substring(0, 8)}...`);
      
      // Leave the game after cash-out
      await leaveGame();
      setShowPokerTable(false);
      
    } catch (error) {
      console.error('Cash-out failed:', error);
      alert(error instanceof Error ? error.message : 'Cash-out failed');
    }
  };

  // Simulate winning for demo purposes
  const triggerWinDemo = () => {
    setWinData({ amount: 150000, winner: playerNickname });
    setShowWinning(true);
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-black text-[#00FF41] relative overflow-x-hidden">
          
          {/* Matrix Rain Background */}
          <MatrixRain />
          
          {/* Main Content */}
          <div className="relative z-10 min-h-screen flex flex-col">
            
            {/* Header */}
            <header className="flex justify-between items-center p-4 bg-black bg-opacity-80 backdrop-blur-sm border-b border-[#00FF41]">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold matrix-text">KEKMORPH POKER</h1>
                <div className="text-sm opacity-80">
                  <span className="animate-pulse">●</span> CONNECTED TO THE MATRIX
                </div>
              </div>
              
              <WalletConnection />
            </header>
            


            {/* Game Area */}
            <main className="flex-1 flex">
              
              {/* Sidebar - Room Selection & Player Info */}
              <aside className="w-80 bg-black bg-opacity-80 backdrop-blur-sm border-r border-[#00FF41] p-4">
                <h2 className="text-xl font-bold mb-6 matrix-text">SELECT YOUR REALM</h2>
                
                {/* Wallet Status & Balance */}
                {walletState.isConnected && walletState.publicKey ? (
                  <SimpleBalance walletAddress={walletState.publicKey} />
                ) : (
                  <div className="mb-4 p-3 border border-gray-500 bg-black bg-opacity-50 text-xs">
                    <div className="text-gray-400">Wallet Not Connected</div>
                    <div className="text-gray-500 text-xs">Connect wallet to see balance</div>
                  </div>
                )}
                

                

                
                {/* Poker Dynamics Info */}
                <div className="mb-4 p-3 border border-cyan-500 bg-cyan-900 bg-opacity-20">
                  <div className="text-cyan-400 text-sm font-bold mb-2">POKER DYNAMICS</div>
                  <div className="text-cyan-300 text-xs space-y-1">
                    <div>🎯 <strong>Buy-in:</strong> Real KEKMORPH tokens</div>
                    <div>🃏 <strong>Game:</strong> Texas Hold'em up to 9 players</div>
                    <div>💰 <strong>Payouts:</strong> Direct to your wallet</div>
                    <div>⚡ <strong>Updates:</strong> Real-time via webhooks</div>
                    <div>🔒 <strong>Security:</strong> Solana blockchain verified</div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-black bg-opacity-30 rounded">
                    <div className="text-green-400 text-xs font-bold mb-1">Cool Avatars Available:</div>
                    <div className="flex flex-wrap gap-1 text-lg">
                      <span title="Neo">🥷</span>
                      <span title="Morpheus">🧙‍♂️</span>
                      <span title="Trinity">🦹‍♀️</span>
                      <span title="Agent Smith">🤖</span>
                      <span title="Oracle">🔮</span>
                      <span title="Red Pill">💊</span>
                      <span title="Hacker">👨‍💻</span>
                      <span title="Glitch">⚡</span>
                      <span title="Digital Ghost">🌐</span>
                      <span title="Matrix Walker">🔢</span>
                    </div>
                  </div>
                </div>

                <RoomSelector
                  selectedRoom={selectedRoom}
                  onRoomSelect={setSelectedRoom}
                  onJoinTable={handleJoinTable}
                  playerCounts={playerCounts}
                />
                
                {selectedRoom && !isInGame && walletState.isConnected && (
                  <div className="mt-6">
                    <button
                      onClick={handleRoomJoin}
                      className="w-full px-4 py-3 border-2 border-[#00AA2E] bg-[#003300] hover:bg-[#00FF41] hover:text-black text-[#00FF41] transition-all duration-300 font-bold"
                    >
                      JOIN GAME
                    </button>
                  </div>
                )}
                
                {isInGame && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleCashOut}
                      className="w-full px-4 py-3 border-2 border-[#00AA2E] bg-[#003300] hover:bg-[#00FF41] hover:text-black text-[#00FF41] transition-all duration-300 font-bold"
                    >
                      CASH OUT ({currentPlayer?.chips?.toLocaleString() || 0} CHIPS)
                    </button>
                    <button
                      onClick={leaveGame}
                      className="w-full px-4 py-3 border-2 border-[#FF0040] bg-black hover:bg-[#FF0040] hover:text-white text-[#FF0040] transition-all duration-300 font-bold"
                    >
                      LEAVE GAME
                    </button>
                  </div>
                )}
                
                {/* Player Identity */}
                <div className="mt-8 p-4 border border-[#00FF41] bg-black bg-opacity-50">
                  <h3 className="font-bold mb-4 text-[#00FF41]">YOUR IDENTITY</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 border border-[#00FF41] bg-[#003300] rounded-full flex items-center justify-center">
                      <span className="text-xl">{getAvatarIcon(playerAvatar)}</span>
                    </div>
                    <div>
                      <div className="font-bold text-[#00FF41]">{playerNickname}</div>
                      <button 
                        className="text-xs text-[#00AA2E] hover:text-[#00FF41] transition-colors"
                        onClick={() => setShowAvatarModal(true)}
                      >
                        CHANGE IDENTITY
                      </button>
                    </div>
                  </div>
                  
                  {/* Demo Win Button */}
                  <button
                    onClick={triggerWinDemo}
                    className="w-full mt-2 px-2 py-1 text-xs border border-[#FFD700] bg-black hover:bg-[#FFD700] hover:text-black text-[#FFD700] transition-all duration-300"
                  >
                    🏆 DEMO WIN ANIMATION
                  </button>
                </div>
              </aside>
              
              {/* Poker Table Area */}
              <section className="flex-1 relative flex flex-col items-center justify-center p-8">
                
                {showPokerTable ? (
                  <>
                    {/* Realistic Poker Table */}
                    <RealisticPokerTable
                      gameState={gameState}
                      currentPlayer={currentPlayer}
                      turnTimeLeft={turnTimeLeft}
                      isPlayerTurn={isPlayerTurn}
                      onSeatSelect={handleSeatSelection}
                      walletAddress={walletState.publicKey || ''}
                      onChipUpdate={(newAmount) => {
                        if (currentPlayer) {
                          setCurrentPlayer({...currentPlayer, chips: newAmount});
                        }
                      }}
                    />
                    
                    {/* Game Controls - Only show when actually in game */}
                    {isInGame && (
                      <div className="mt-8">
                        <GameControls
                          isPlayerTurn={isPlayerTurn}
                          minBet={gameState?.minBet || 0}
                          maxBet={gameState?.maxBet || 50000}
                          currentChips={currentPlayer?.chips || 0}
                          onAction={performAction}
                        />
                      </div>
                    )}
                    
                    {/* Instructions when waiting for seat selection */}
                    {!isInGame && (
                      <div className="mt-8 text-center">
                        <div className="bg-black bg-opacity-80 border border-green-500 rounded-lg p-6 max-w-md mx-auto">
                          <h3 className="text-green-400 text-xl font-bold mb-3">Choose Your Seat</h3>
                          <p className="text-green-300 text-sm mb-2">
                            Click on any glowing seat to buy-in with KEKMORPH tokens
                          </p>
                          <div className="text-yellow-400 text-xs mb-4">
                            Buy-in: {selectedRoom === 'degen' ? '100K' : selectedRoom === 'green' ? '500K' : '1M'} KEKMORPH
                          </div>
                          
                          {/* Payment verification section */}
                          {pendingSeat && (
                            <div className="mt-4 p-4 border border-yellow-500 bg-yellow-900 bg-opacity-30 rounded">
                              <div className="text-yellow-300 text-sm mb-2">
                                Pending payment for Seat {pendingSeat.position}
                              </div>
                              <div className="text-yellow-200 text-xs mb-3">
                                Amount: {pendingSeat.amount.toLocaleString()} KEKMORPH
                              </div>
                              <button
                                onClick={handleVerifyPayment}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors"
                              >
                                BUY CHIPS
                              </button>
                              <div className="text-yellow-300 text-xs mt-2">
                                Opens Phantom wallet for seamless payment
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full">
                    <div className="text-center mb-8">
                      <div className="text-2xl font-bold matrix-text mb-4">
                        WELCOME TO THE MATRIX
                      </div>
                      <div className="text-lg opacity-80 text-[#00FF41] mb-4">
                        {!walletState.isConnected 
                          ? 'Connect your Phantom wallet to begin'
                          : !selectedRoom
                            ? 'Select a room to see available seats'
                            : 'Click any empty seat to buy-in and start playing'
                        }
                      </div>
                    </div>
                    
                    {/* Show poker table with clickable seats when JOIN TABLE is clicked */}
                    {walletState.isConnected && showPokerTable && selectedRoom ? (
                      <div>
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-[#00FF41] mb-2">
                            {selectedRoom.toUpperCase()} ROOM
                          </h3>
                          <p className="text-[#00AA2E]">Click any empty seat to buy-in</p>
                          <button
                            onClick={() => setShowPokerTable(false)}
                            className="mt-2 px-4 py-2 border border-[#FF0040] text-[#FF0040] hover:bg-[#FF0040] hover:text-white transition-all"
                          >
                            BACK TO ROOMS
                          </button>
                        </div>
                        <RealisticPokerTable
                          gameState={null}
                          currentPlayer={null}
                          turnTimeLeft={0}
                          isPlayerTurn={false}
                          onSeatSelect={handleSeatSelection}
                        />
                      </div>
                    ) : (
                      /* Demo Table */
                      <div className="poker-table w-full max-w-4xl h-96 relative rounded-full flex items-center justify-center opacity-50 mx-auto">
                        <div className="text-center">
                          <div className="text-lg font-bold matrix-text">
                            {!walletState.isConnected ? 'CONNECT WALLET TO PLAY' : 'SELECT A ROOM'}
                          </div>
                          <div className="text-sm opacity-60 mt-2">
                            The Matrix has you...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </main>
            
            {/* Footer with Legal Disclaimers */}
            <footer className="bg-black bg-opacity-80 backdrop-blur-sm border-t border-[#00FF41] p-4 text-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold mb-2 text-[#00FF41]">LEGAL DISCLAIMER (ENGLISH)</h4>
                  <p className="opacity-80 text-[#00FF41]">
                    KEKMORPH Poker is a decentralized application for entertainment purposes. Players participate at their own risk. 
                    This platform does not constitute financial advice. Users must comply with local gambling regulations. 
                    The platform operates on blockchain technology and transactions are irreversible.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-[#00FF41]">DESCARGO LEGAL (ESPAÑOL)</h4>
                  <p className="opacity-80 text-[#00FF41]">
                    KEKMORPH Poker es una aplicación descentralizada con fines de entretenimiento. Los jugadores participan bajo su propio riesgo. 
                    Esta plataforma no constituye asesoramiento financiero. Los usuarios deben cumplir con las regulaciones locales de juego. 
                    La plataforma opera con tecnología blockchain y las transacciones son irreversibles.
                  </p>
                </div>
              </div>
            </footer>
          </div>
          
          {/* Avatar Modal */}
          <AvatarModal
            isOpen={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            onSave={handleAvatarSave}
            currentNickname={playerNickname}
            currentAvatar={playerAvatar}
          />

          {/* Closable Chat Log */}
          <ChatLog
            gameId={gameState?.gameId || 'lobby'}
            currentPlayerId={walletState.publicKey || 'anonymous'}
            currentPlayerName={playerNickname}
            isVisible={showChat}
            onToggle={() => setShowChat(!showChat)}
            gameActions={[
              selectedRoom ? `Room: ${selectedRoom.toUpperCase()}` : 'No room selected',
              gameState ? `Players at table: ${Object.keys(gameState.players).length}/9` : 'Not at table',
              gameState?.pot ? `Pot: ${gameState.pot.toLocaleString()} KEKMORPH` : 'Pot: 0 KEKMORPH',
              gameState?.bettingRound ? `Round: ${gameState.bettingRound}` : 'Round: Waiting',
              isPlayerTurn ? '🔥 YOUR TURN TO ACT!' : currentPlayer ? 'Waiting for other players' : 'Spectating',
              walletState.isConnected ? `Balance: ${walletState.kekMorphBalance.toLocaleString()} KEKMORPH` : 'Wallet not connected'
            ].filter(Boolean)}
          />

          {/* Winning Animation */}
          <WinningAnimation
            isVisible={showWinning}
            winAmount={winData.amount}
            winnerName={winData.winner}
            onComplete={() => setShowWinning(false)}
          />
          
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
