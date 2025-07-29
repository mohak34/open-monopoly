export interface Player {
  id: string;
  name: string;
  color: string;
  cash: number;
  position: number;
  inJail: boolean;
  isReady: boolean;
  isBankrupt: boolean;
  jailTurns: number;
  turnOrder: number;
  getOutOfJailFreeCards: number;
}

export interface GameRoom {
  id: string;
  name: string;
  boardSize: number;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Player[];
  hostId: string;
  currentPlayerIndex: number;
}

export interface Property {
  id: string;
  name: string;
  type: string;
  position: number;
  price?: number;
  rent?: number;
  rentWithHouse?: number;
  rentWithHotel?: number;
  colorGroup?: string;
  houses: number;
  hasHotel: boolean;
  ownerId?: string;
  isMortgaged: boolean;
}

export interface Auction {
  id: string;
  propertyId: string;
  propertyName: string;
  startingBid: number;
  currentBid: number;
  currentWinner: string | null;
  startTime: string;
  endTime: string;
  participants: string[];
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED';
}

export interface GameState {
  gameRoom: GameRoom;
  properties: Property[];
  currentPlayerTurn: string;
  diceRolled: boolean;
  lastDiceRoll: [number, number];
  gameMessage: string;
}