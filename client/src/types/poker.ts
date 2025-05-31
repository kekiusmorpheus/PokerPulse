export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  chips: number;
  position: number;
  cards: Card[];
  isConnected: boolean;
  isActive: boolean;
  currentBet: number;
  totalBet: number;
  isDealer: boolean;
  isBigBlind: boolean;
  isSmallBlind: boolean;
  lastAction?: PlayerAction;
  walletAddress?: string;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  isVisible: boolean;
}

export interface GameState {
  gameId: string;
  roomType: RoomType;
  players: { [playerId: string]: Player };
  pot: number;
  communityCards: Card[];
  currentPlayerTurn: string | null;
  bettingRound: BettingRound;
  minBet: number;
  maxBet: number;
  isGameActive: boolean;
  dealerPosition: number;
  turnTimeLeft: number;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
}

export type RoomType = 'degen' | 'green' | 'morpheus';

export type BettingRound = 'PRE-FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

export type PlayerAction = 'fold' | 'call' | 'raise' | 'check' | 'all-in';

export interface RoomConfig {
  name: string;
  description: string;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  maxPlayers: number;
  level: 'ENTRY LEVEL' | 'INTERMEDIATE' | 'ELITE';
  levelColor: string;
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  kekMorphBalance: number;
  isVerified: boolean;
}

export interface AvatarOption {
  id: string;
  icon: string;
  name: string;
}
