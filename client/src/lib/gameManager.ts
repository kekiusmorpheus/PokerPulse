import { PokerEngine } from './pokerEngine';
import { GameState, Player, RoomType, PlayerAction } from '../types/poker';

class GameManager {
  private gameInstances: Map<string, PokerEngine> = new Map();
  private gameStateListeners: Map<string, Set<(gameState: GameState) => void>> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> gameId

  public createGame(roomType: RoomType): string {
    const gameId = `${roomType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const buyInAmounts = {
      degen: 100000,
      green: 500000,
      morpheus: 1000000
    };

    const engine = new PokerEngine(gameId, roomType, buyInAmounts[roomType]);
    this.gameInstances.set(gameId, engine);
    this.gameStateListeners.set(gameId, new Set());

    console.log(`Created new ${roomType} game: ${gameId}`);
    return gameId;
  }

  public joinGame(gameId: string, player: Player): GameState {
    const engine = this.gameInstances.get(gameId);
    if (!engine) {
      throw new Error('Game not found');
    }

    try {
      engine.addPlayer(player);
      this.playerRooms.set(player.id, gameId);
      
      const gameState = engine.getGameState();
      this.notifyListeners(gameId, gameState);
      
      console.log(`Player ${player.nickname} joined game ${gameId}`);
      return gameState;
    } catch (error) {
      throw new Error(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public leaveGame(playerId: string): void {
    const gameId = this.playerRooms.get(playerId);
    if (!gameId) return;

    const engine = this.gameInstances.get(gameId);
    if (engine) {
      engine.removePlayer(playerId);
      this.playerRooms.delete(playerId);
      
      const gameState = engine.getGameState();
      this.notifyListeners(gameId, gameState);
      
      // Clean up empty games
      if (Object.keys(gameState.players).length === 0) {
        this.gameInstances.delete(gameId);
        this.gameStateListeners.delete(gameId);
        console.log(`Cleaned up empty game: ${gameId}`);
      }
    }
  }

  public performAction(playerId: string, action: PlayerAction, betAmount?: number): GameState {
    const gameId = this.playerRooms.get(playerId);
    if (!gameId) {
      throw new Error('Player not in any game');
    }

    const engine = this.gameInstances.get(gameId);
    if (!engine) {
      throw new Error('Game not found');
    }

    try {
      const gameState = engine.processPlayerAction(playerId, action, betAmount);
      this.notifyListeners(gameId, gameState);
      
      console.log(`Player ${playerId} performed action: ${action}${betAmount ? ` (${betAmount})` : ''}`);
      return gameState;
    } catch (error) {
      throw new Error(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public subscribeToGame(gameId: string, callback: (gameState: GameState) => void): () => void {
    const listeners = this.gameStateListeners.get(gameId);
    if (!listeners) {
      throw new Error('Game not found');
    }

    listeners.add(callback);

    // Send current state immediately
    const engine = this.gameInstances.get(gameId);
    if (engine) {
      callback(engine.getGameState());
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }

  public getGameState(gameId: string): GameState | null {
    const engine = this.gameInstances.get(gameId);
    return engine ? engine.getGameState() : null;
  }

  public findOrCreateGameForRoom(roomType: RoomType): string {
    // Find an existing game with available slots
    const entries = Array.from(this.gameInstances.entries());
    for (const [gameId, engine] of entries) {
      const gameState = engine.getGameState();
      if (gameState.roomType === roomType && Object.keys(gameState.players).length < 9) {
        return gameId;
      }
    }

    // Create new game if none available
    return this.createGame(roomType);
  }

  public handlePlayerTimeout(playerId: string): void {
    const gameId = this.playerRooms.get(playerId);
    if (!gameId) return;

    const engine = this.gameInstances.get(gameId);
    if (engine) {
      const gameState = engine.handlePlayerTimeout(playerId);
      this.notifyListeners(gameId, gameState);
    }
  }

  public getActiveGames(): { [roomType: string]: number } {
    const counts: { [key in RoomType]: number } = { degen: 0, green: 0, morpheus: 0 };
    
    this.gameInstances.forEach((engine) => {
      const gameState = engine.getGameState();
      const playerCount = Object.keys(gameState.players).length;
      if (playerCount > 0 && gameState.roomType in counts) {
        (counts as any)[gameState.roomType] += playerCount;
      }
    });

    return counts;
  }

  private notifyListeners(gameId: string, gameState: GameState): void {
    const listeners = this.gameStateListeners.get(gameId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(gameState);
        } catch (error) {
          console.error('Error notifying game state listener:', error);
        }
      });
    }
  }

  // Start periodic cleanup of inactive games
  public startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      this.gameInstances.forEach((engine, gameId) => {
        const gameState = engine.getGameState();
        
        // Remove games with no players for more than 5 minutes
        if (Object.keys(gameState.players).length === 0) {
          this.gameInstances.delete(gameId);
          this.gameStateListeners.delete(gameId);
          console.log(`Cleaned up inactive game: ${gameId}`);
        }
      });
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// Singleton instance
export const gameManager = new GameManager();

// Start cleanup on module load
gameManager.startCleanupInterval();