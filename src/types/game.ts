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
  currentPlayerIndex?: number;
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
  housePrice?: number;
  hotelPrice?: number;
}

export interface Auction {
  id: string;
  propertyId: string;
  propertyName: string;
  startingBid: number;
  currentBid: number;
  currentWinner: string | null;
  startTime: Date;
  endTime: Date;
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
  lastCardDrawn?: {
    type: 'CHANCE' | 'COMMUNITY_CHEST';
    card: Card;
    playerId: string;
  };
}

// Socket event interfaces
export interface SocketEventData {
  roomId: string;
}

export interface GameActionData extends SocketEventData {
  action: GameAction;
}

export interface GameAction {
  type: string;
  payload?: Record<string, unknown>;
}

export interface ChatMessageData extends SocketEventData {
  message: ChatMessage;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
}

export interface TransactionData extends SocketEventData {
  transaction: Transaction;
}

export interface Transaction {
  id: string;
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  type: "payment" | "trade" | "bank";
  timestamp: number;
}

export interface TradeProposalData extends SocketEventData {
  proposal: TradeProposal;
}

export interface TradeProposal {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredProperties: string[];
  offeredCash: number;
  requestedProperties: string[];
  requestedCash: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: Date;
}

export interface AuctionBidData extends SocketEventData {
  bid: AuctionBid;
}

export interface AuctionBid {
  playerId: string;
  amount: number;
}

export interface PropertyManagementData extends SocketEventData {
  management: PropertyManagement;
}

export interface PropertyManagement {
  propertyId: string;
  action: "upgrade" | "mortgage" | "sell";
  playerId: string;
}

export interface GameStateUpdateData extends SocketEventData {
  gameState: GameState;
}

export interface PlayerReadyData extends SocketEventData {
  playerId: string;
}

export interface StartGameData extends SocketEventData {
  // No additional properties needed for start game event
}

export interface DiceRollData extends SocketEventData {
  diceRoll: [number, number];
}

export interface PropertyActionData extends SocketEventData {
  property: Property;
}

export interface PaymentData extends SocketEventData {
  payment: Payment;
}

export interface Payment {
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  reason: string;
}

export interface EndTurnData extends SocketEventData {
  // No additional properties needed for end turn event
}

export interface BankruptcyData extends SocketEventData {
  playerId: string;
}

export interface CardDrawnData extends SocketEventData {
  card: Card;
}

export interface Card {
  id: string;
  type: 'CHANCE' | 'COMMUNITY_CHEST';
  text: string;
  action: string;
  amount?: number;
  moveTo?: number;
  getOutOfJailFree?: boolean;
}

export type CardAction =
  | "move"
  | "money"
  | "jail"
  | "jail-card"
  | "property-repair"
  | "go-to-jail"
  | "MOVE_TO"
  | "GO_TO_JAIL"
  | "GET_OUT_OF_JAIL_FREE"
  | "PAY_MONEY"
  | "COLLECT_MONEY";

export interface JailCardData extends SocketEventData {
  playerId: string;
}

export interface FinePaymentData extends SocketEventData {
  payment: Payment;
}

export interface PropertyUpgradeData extends SocketEventData {
  property: Property;
}

export interface PropertyMortgageData extends SocketEventData {
  property: Property;
}

export interface PropertySellData extends SocketEventData {
  property: Property;
}

export interface TradeResponseData extends SocketEventData {
  trade: TradeResponse;
}

export interface TradeResponse {
  tradeId: string;
  accepted: boolean;
  fromPlayer: string;
  toPlayer: string;
}

export interface AuctionData extends SocketEventData {
  property: Property;
}

export interface AuctionEndData extends SocketEventData {
  winner: AuctionWinner;
}

export interface AuctionWinner {
  playerId: string;
  amount: number;
}

export interface PlayerTurnData extends SocketEventData {
  playerId: string;
}

export interface GameOverData extends SocketEventData {
  winner: string;
}