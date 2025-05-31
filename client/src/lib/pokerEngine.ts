import { GameState, Player, Card, PlayerAction, BettingRound } from '../types/poker';

export class PokerEngine {
  private gameState: GameState;
  private deck: Card[] = [];
  private playerOrder: string[] = [];

  constructor(gameId: string, roomType: any, buyIn: number) {
    this.gameState = {
      gameId,
      roomType,
      players: {},
      pot: 0,
      communityCards: [],
      currentPlayerTurn: null,
      bettingRound: 'PRE-FLOP',
      minBet: 0,
      maxBet: 0,
      isGameActive: false,
      dealerPosition: 0,
      turnTimeLeft: 20,
      smallBlind: roomType === 'degen' ? 1000 : roomType === 'green' ? 5000 : 10000,
      bigBlind: roomType === 'degen' ? 2000 : roomType === 'green' ? 10000 : 20000,
      buyIn
    };
  }

  private createDeck(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, isVisible: false });
      }
    }

    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public addPlayer(player: Player): void {
    if (Object.keys(this.gameState.players).length >= 9) {
      throw new Error('Table is full');
    }

    // Assign position
    const usedPositions = Object.values(this.gameState.players).map(p => p.position);
    let position = 0;
    while (usedPositions.includes(position)) {
      position++;
    }
    
    player.position = position;
    this.gameState.players[player.id] = player;
    this.playerOrder.push(player.id);

    // Start game if we have at least 2 players
    if (Object.keys(this.gameState.players).length >= 2 && !this.gameState.isGameActive) {
      this.startNewHand();
    }
  }

  public removePlayer(playerId: string): void {
    delete this.gameState.players[playerId];
    this.playerOrder = this.playerOrder.filter(id => id !== playerId);

    // End game if less than 2 players
    if (Object.keys(this.gameState.players).length < 2) {
      this.gameState.isGameActive = false;
    }
  }

  private startNewHand(): void {
    this.deck = this.createDeck();
    this.gameState.communityCards = [];
    this.gameState.pot = 0;
    this.gameState.bettingRound = 'PRE-FLOP';
    this.gameState.isGameActive = true;

    // Reset player states
    Object.values(this.gameState.players).forEach(player => {
      player.cards = [];
      player.currentBet = 0;
      player.totalBet = 0;
      player.isActive = true;
      player.lastAction = undefined;
    });

    // Set dealer position
    this.gameState.dealerPosition = this.gameState.dealerPosition % this.playerOrder.length;
    
    // Set blinds
    this.setBlinds();
    
    // Deal hole cards
    this.dealHoleCards();
    
    // Set first player to act (after big blind)
    this.setNextPlayerToAct();
  }

  private setBlinds(): void {
    const playerCount = this.playerOrder.length;
    const dealerIndex = this.gameState.dealerPosition;
    
    let smallBlindIndex = (dealerIndex + 1) % playerCount;
    let bigBlindIndex = (dealerIndex + 2) % playerCount;
    
    // In heads-up, dealer is small blind
    if (playerCount === 2) {
      smallBlindIndex = dealerIndex;
      bigBlindIndex = (dealerIndex + 1) % playerCount;
    }

    const smallBlindPlayerId = this.playerOrder[smallBlindIndex];
    const bigBlindPlayerId = this.playerOrder[bigBlindIndex];

    // Set blinds
    Object.values(this.gameState.players).forEach(player => {
      player.isDealer = player.id === this.playerOrder[dealerIndex];
      player.isSmallBlind = player.id === smallBlindPlayerId;
      player.isBigBlind = player.id === bigBlindPlayerId;

      if (player.isSmallBlind) {
        player.currentBet = this.gameState.smallBlind;
        player.chips -= this.gameState.smallBlind;
        this.gameState.pot += this.gameState.smallBlind;
      } else if (player.isBigBlind) {
        player.currentBet = this.gameState.bigBlind;
        player.chips -= this.gameState.bigBlind;
        this.gameState.pot += this.gameState.bigBlind;
      }
    });

    this.gameState.minBet = this.gameState.bigBlind;
  }

  private dealHoleCards(): void {
    // Deal 2 cards to each player
    for (let i = 0; i < 2; i++) {
      this.playerOrder.forEach(playerId => {
        const player = this.gameState.players[playerId];
        if (player && this.deck.length > 0) {
          const card = this.deck.pop()!;
          card.isVisible = true; // Players can see their own cards
          player.cards.push(card);
        }
      });
    }
  }

  private setNextPlayerToAct(): void {
    const activePlayers = this.playerOrder.filter(id => {
      const player = this.gameState.players[id];
      return player && player.isActive && player.chips > 0;
    });

    if (activePlayers.length === 0) {
      this.gameState.currentPlayerTurn = null;
      return;
    }

    // Find next player after current player
    let currentIndex = -1;
    if (this.gameState.currentPlayerTurn) {
      currentIndex = activePlayers.indexOf(this.gameState.currentPlayerTurn);
    }

    // For pre-flop, start after big blind
    if (this.gameState.bettingRound === 'PRE-FLOP' && currentIndex === -1) {
      const bigBlindPlayer = Object.values(this.gameState.players).find(p => p.isBigBlind);
      if (bigBlindPlayer) {
        currentIndex = activePlayers.indexOf(bigBlindPlayer.id);
      }
    }

    const nextIndex = (currentIndex + 1) % activePlayers.length;
    this.gameState.currentPlayerTurn = activePlayers[nextIndex];
    this.gameState.turnTimeLeft = 20;
  }

  public processPlayerAction(playerId: string, action: PlayerAction, betAmount?: number): GameState {
    const player = this.gameState.players[playerId];
    if (!player || this.gameState.currentPlayerTurn !== playerId) {
      throw new Error('Not your turn');
    }

    player.lastAction = action;

    switch (action) {
      case 'fold':
        player.isActive = false;
        break;

      case 'check':
        if (this.gameState.minBet > player.currentBet) {
          throw new Error('Cannot check, must call or raise');
        }
        break;

      case 'call':
        const callAmount = this.gameState.minBet - player.currentBet;
        if (callAmount > player.chips) {
          // All-in
          this.gameState.pot += player.chips;
          player.currentBet += player.chips;
          player.chips = 0;
        } else {
          this.gameState.pot += callAmount;
          player.currentBet += callAmount;
          player.chips -= callAmount;
        }
        break;

      case 'raise':
        if (!betAmount || betAmount <= this.gameState.minBet) {
          throw new Error('Raise amount must be higher than current bet');
        }
        const raiseAmount = betAmount - player.currentBet;
        if (raiseAmount > player.chips) {
          // All-in
          this.gameState.pot += player.chips;
          player.currentBet += player.chips;
          player.chips = 0;
        } else {
          this.gameState.pot += raiseAmount;
          player.currentBet = betAmount;
          player.chips -= raiseAmount;
          this.gameState.minBet = betAmount;
        }
        break;

      case 'all-in':
        this.gameState.pot += player.chips;
        player.currentBet += player.chips;
        const allInAmount = player.chips;
        player.chips = 0;
        if (player.currentBet > this.gameState.minBet) {
          this.gameState.minBet = player.currentBet;
        }
        break;
    }

    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.advanceBettingRound();
    } else {
      this.setNextPlayerToAct();
    }

    return { ...this.gameState };
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = Object.values(this.gameState.players).filter(p => p.isActive);
    
    if (activePlayers.length <= 1) return true;

    // Check if all active players have acted and matched the current bet
    const playersWithChips = activePlayers.filter(p => p.chips > 0);
    if (playersWithChips.length === 0) return true;

    const maxBet = Math.max(...activePlayers.map(p => p.currentBet));
    const allMatched = playersWithChips.every(p => 
      p.currentBet === maxBet || p.chips === 0
    );

    const allActed = activePlayers.every(p => 
      p.lastAction !== undefined || p.chips === 0
    );

    return allMatched && allActed;
  }

  private advanceBettingRound(): void {
    // Reset player betting states
    Object.values(this.gameState.players).forEach(player => {
      player.totalBet += player.currentBet;
      player.currentBet = 0;
      player.lastAction = undefined;
    });

    this.gameState.minBet = 0;

    switch (this.gameState.bettingRound) {
      case 'PRE-FLOP':
        this.dealFlop();
        this.gameState.bettingRound = 'FLOP';
        break;
      case 'FLOP':
        this.dealTurn();
        this.gameState.bettingRound = 'TURN';
        break;
      case 'TURN':
        this.dealRiver();
        this.gameState.bettingRound = 'RIVER';
        break;
      case 'RIVER':
        this.showdown();
        return;
    }

    // Set first active player for new betting round
    const activePlayers = this.playerOrder.filter(id => {
      const player = this.gameState.players[id];
      return player && player.isActive && player.chips > 0;
    });

    if (activePlayers.length > 1) {
      this.gameState.currentPlayerTurn = activePlayers[0];
      this.gameState.turnTimeLeft = 20;
    } else {
      // Skip to showdown if only one player left
      this.showdown();
    }
  }

  private dealFlop(): void {
    // Burn one card
    this.deck.pop();
    
    // Deal 3 community cards
    for (let i = 0; i < 3; i++) {
      if (this.deck.length > 0) {
        const card = this.deck.pop()!;
        card.isVisible = true;
        this.gameState.communityCards.push(card);
      }
    }
  }

  private dealTurn(): void {
    // Burn one card
    this.deck.pop();
    
    // Deal 1 community card
    if (this.deck.length > 0) {
      const card = this.deck.pop()!;
      card.isVisible = true;
      this.gameState.communityCards.push(card);
    }
  }

  private dealRiver(): void {
    // Burn one card
    this.deck.pop();
    
    // Deal 1 community card
    if (this.deck.length > 0) {
      const card = this.deck.pop()!;
      card.isVisible = true;
      this.gameState.communityCards.push(card);
    }
  }

  private showdown(): void {
    this.gameState.bettingRound = 'SHOWDOWN';
    this.gameState.currentPlayerTurn = null;

    const activePlayers = Object.values(this.gameState.players).filter(p => p.isActive);
    
    if (activePlayers.length === 1) {
      // Only one player left - they win
      const winner = activePlayers[0];
      winner.chips += this.gameState.pot;
      this.gameState.pot = 0;
    } else {
      // Evaluate hands and determine winner
      const playerHands = activePlayers.map(player => ({
        player,
        handStrength: this.evaluateHand(player.cards, this.gameState.communityCards)
      }));

      // Sort by hand strength (higher is better)
      playerHands.sort((a, b) => b.handStrength - a.handStrength);
      
      // Award pot to winner(s)
      const winners = playerHands.filter(ph => ph.handStrength === playerHands[0].handStrength);
      const winAmount = Math.floor(this.gameState.pot / winners.length);
      
      winners.forEach(winner => {
        winner.player.chips += winAmount;
      });
      
      this.gameState.pot = 0;
    }

    // Prepare for next hand
    setTimeout(() => {
      this.gameState.dealerPosition = (this.gameState.dealerPosition + 1) % this.playerOrder.length;
      this.startNewHand();
    }, 5000);
  }

  private evaluateHand(playerCards: Card[], communityCards: Card[]): number {
    // Simplified hand evaluation - in a real implementation, use a proper poker hand evaluator
    const allCards = [...playerCards, ...communityCards];
    const ranks = allCards.map(card => this.getCardValue(card.rank));
    const suits = allCards.map(card => card.suit);
    
    // Count ranks and suits
    const rankCounts: { [key: number]: number } = {};
    const suitCounts: { [key: string]: number } = {};
    
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });

    const sortedRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
    const sortedCounts = Object.values(rankCounts).sort((a, b) => b - a);
    
    const isFlush = Object.values(suitCounts).some(count => count >= 5);
    const isStraight = this.checkStraight(sortedRanks);

    // Hand rankings (simplified)
    if (isFlush && isStraight) return 8000 + Math.max(...sortedRanks); // Straight flush
    if (sortedCounts[0] === 4) return 7000 + sortedRanks[0]; // Four of a kind
    if (sortedCounts[0] === 3 && sortedCounts[1] === 2) return 6000 + sortedRanks[0]; // Full house
    if (isFlush) return 5000 + Math.max(...sortedRanks); // Flush
    if (isStraight) return 4000 + Math.max(...sortedRanks); // Straight
    if (sortedCounts[0] === 3) return 3000 + sortedRanks[0]; // Three of a kind
    if (sortedCounts[0] === 2 && sortedCounts[1] === 2) return 2000 + Math.max(...sortedRanks); // Two pair
    if (sortedCounts[0] === 2) return 1000 + sortedRanks[0]; // One pair
    
    return Math.max(...sortedRanks); // High card
  }

  private getCardValue(rank: Card['rank']): number {
    switch (rank) {
      case 'A': return 14;
      case 'K': return 13;
      case 'Q': return 12;
      case 'J': return 11;
      default: return parseInt(rank);
    }
  }

  private checkStraight(sortedRanks: number[]): boolean {
    // Check for 5 consecutive ranks
    for (let i = 0; i <= sortedRanks.length - 5; i++) {
      if (sortedRanks[i] - sortedRanks[i + 4] === 4) {
        return true;
      }
    }
    
    // Check for A-2-3-4-5 straight
    if (sortedRanks.includes(14) && sortedRanks.includes(5) && 
        sortedRanks.includes(4) && sortedRanks.includes(3) && sortedRanks.includes(2)) {
      return true;
    }
    
    return false;
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public handlePlayerTimeout(playerId: string): GameState {
    if (this.gameState.currentPlayerTurn === playerId) {
      return this.processPlayerAction(playerId, 'fold');
    }
    return this.getGameState();
  }
}