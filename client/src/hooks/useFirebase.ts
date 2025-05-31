import { useEffect, useState } from 'react';
import { waitForFirebase } from '../lib/firebase';
import { GameState, Player } from '../types/poker';

export const useFirebase = () => {
  const [db, setDb] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        const database = await waitForFirebase();
        setDb(database);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };

    initFirebase();
  }, []);

  const subscribeToGameState = (
    gameId: string,
    callback: (gameState: GameState | null) => void
  ) => {
    if (!db) return () => {};

    // In a real implementation, this would use Firebase Realtime Database
    const unsubscribe = () => {
      console.log(`Unsubscribed from game ${gameId}`);
    };

    // Mock subscription for development
    const mockGameState: GameState = {
      gameId,
      roomType: 'degen',
      players: {},
      pot: 0,
      communityCards: [],
      currentPlayerTurn: null,
      bettingRound: 'PRE-FLOP',
      minBet: 1000,
      maxBet: 50000,
      isGameActive: false,
      dealerPosition: 0,
      turnTimeLeft: 20,
      smallBlind: 1000,
      bigBlind: 2000,
      buyIn: 100000
    };

    callback(mockGameState);
    return unsubscribe;
  };

  const updateGameState = async (gameId: string, updates: Partial<GameState>) => {
    if (!db) throw new Error('Firebase not initialized');
    
    console.log(`Updating game ${gameId}:`, updates);
    // In a real implementation, this would update Firebase
  };

  const addPlayer = async (gameId: string, player: Player) => {
    if (!db) throw new Error('Firebase not initialized');
    
    console.log(`Adding player to game ${gameId}:`, player);
    // In a real implementation, this would add player to Firebase
  };

  const removePlayer = async (gameId: string, playerId: string) => {
    if (!db) throw new Error('Firebase not initialized');
    
    console.log(`Removing player ${playerId} from game ${gameId}`);
    // In a real implementation, this would remove player from Firebase
  };

  return {
    isConnected,
    subscribeToGameState,
    updateGameState,
    addPlayer,
    removePlayer
  };
};
