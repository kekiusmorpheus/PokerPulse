import { useState, useEffect, useCallback } from 'react';
import { GameState, Player, RoomType, PlayerAction, Card } from '../types/poker';
import { usePhantomWallet } from './usePhantomWallet';
import { subscribeToGameState, createGame, addPlayerToGame, updateGameState, removePlayerFromGame, logTransaction } from '../lib/firebase';

export const usePokerGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isInGame, setIsInGame] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(20);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  const { walletState } = usePhantomWallet();
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const joinGame = useCallback(async (roomType: RoomType, playerData: { nickname: string; avatar: string }, chipAmount: number) => {
    if (!walletState.isConnected || !walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    const roomConfigs = {
      degen: { buyIn: 100000, smallBlind: 1000, bigBlind: 2000 },
      green: { buyIn: 500000, smallBlind: 5000, bigBlind: 10000 },
      morpheus: { buyIn: 1000000, smallBlind: 10000, bigBlind: 20000 }
    };

    const config = roomConfigs[roomType];
    
    try {
      // Use the actual chip amount from player's balance
      const player: Player = {
        id: walletState.publicKey,
        nickname: playerData.nickname,
        avatar: playerData.avatar,
        chips: chipAmount, // Use actual balance amount
        position: -1, // Will be assigned by game logic
        cards: [],
        isConnected: true,
        isActive: true,
        currentBet: 0,
        totalBet: 0,
        isDealer: false,
        isBigBlind: false,
        isSmallBlind: false,
        walletAddress: walletState.publicKey
      };

      // Use the shared game ID for the room type
      const gameId = `game_${roomType}`;
      setCurrentGameId(gameId);

      // Try to add player to existing game, create if it doesn't exist
      try {
        await addPlayerToGame(gameId, player);
      } catch (error) {
        // Game doesn't exist, create it first
        const initialGameState: GameState = {
          gameId,
          roomType,
          players: {},
          pot: 0,
          communityCards: [],
          currentPlayerTurn: null,
          bettingRound: 'PRE-FLOP',
          minBet: config.bigBlind,
          maxBet: config.buyIn,
          isGameActive: false,
          dealerPosition: 0,
          turnTimeLeft: 20,
          smallBlind: config.smallBlind,
          bigBlind: config.bigBlind,
          buyIn: config.buyIn
        };

        await createGame(gameId, initialGameState);
        await addPlayerToGame(gameId, player);
      }
      
      setCurrentPlayer(player);
      setIsInGame(true);

      // Subscribe to real-time game updates
      const unsub = subscribeToGameState(gameId, (updatedGameState: GameState | null) => {
        if (updatedGameState) {
          setGameState(updatedGameState);
          
          // Check if it's player's turn
          const isMyTurn = updatedGameState.currentPlayerTurn === walletState.publicKey;
          setIsPlayerTurn(isMyTurn);
          
          if (isMyTurn) {
            setTurnTimeLeft(20);
          }
        }
      });
      
      setUnsubscribe(() => unsub);

    } catch (error) {
      throw new Error(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [walletState]);

  const leaveGame = useCallback(async () => {
    if (!currentGameId || !currentPlayer) return;

    try {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      
      await removePlayerFromGame(currentGameId, currentPlayer.id);
      setGameState(null);
      setCurrentPlayer(null);
      setIsInGame(false);
      setIsPlayerTurn(false);
      setCurrentGameId(null);
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  }, [currentGameId, currentPlayer, unsubscribe]);

  const performAction = useCallback(async (action: PlayerAction, betAmount?: number) => {
    if (!currentGameId || !currentPlayer || !isPlayerTurn || !gameState) return;

    try {
      // Update game state based on player action
      const updatedGameState = { ...gameState };
      const player = updatedGameState.players[currentPlayer.id];
      
      if (player) {
        player.lastAction = action;
        
        switch (action) {
          case 'fold':
            player.isActive = false;
            break;
          case 'call':
            const callAmount = gameState.minBet - player.currentBet;
            if (callAmount > 0) {
              player.currentBet = gameState.minBet;
              player.chips -= callAmount;
              updatedGameState.pot += callAmount;
            }
            break;
          case 'raise':
            if (betAmount) {
              const raiseAmount = betAmount - player.currentBet;
              player.currentBet = betAmount;
              player.chips -= raiseAmount;
              updatedGameState.pot += raiseAmount;
              updatedGameState.minBet = betAmount;
            }
            break;
        }
      }

      // Update game state in Firebase
      await updateGameState(currentGameId, updatedGameState);
      setIsPlayerTurn(false);
      
    } catch (error) {
      console.error('Failed to perform action:', error);
      throw error;
    }
  }, [currentGameId, currentPlayer, isPlayerTurn, gameState]);

  // Turn timer effect
  useEffect(() => {
    if (!isPlayerTurn || turnTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-fold on timeout
          performAction('fold');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlayerTurn, turnTimeLeft, performAction]);

  return {
    gameState,
    currentPlayer,
    isInGame,
    isPlayerTurn,
    turnTimeLeft,
    joinGame,
    leaveGame,
    performAction
  };
};
