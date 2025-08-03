"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

interface Player {
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

interface Property {
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

interface GameRoom {
  id: string;
  name: string;
  boardSize: number;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Player[];
  hostId: string;
}

interface GameState {
  gameRoom: GameRoom;
  properties: Property[];
  currentPlayerTurn: string;
  diceRolled: boolean;
  lastDiceRoll: [number, number];
  gameMessage: string;
}

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export const useGameSocket = (roomId?: string, playerId?: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!roomId || !playerId) return;

    const socket = io({
      path: '/api/socketio',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { roomId, playerId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room-updated', (state: GameState) => {
      setGameState(state);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    });

    socket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('chat-history', (messages: ChatMessage[]) => {
      setChatMessages(messages);
    });

    socket.on('auction-started', ({ auction }) => {
      toast({
        title: "Auction Started",
        description: `Auction for ${auction.propertyName} has started!`,
      });
    });

    socket.on('auction-ended', ({ auction }) => {
      toast({
        title: "Auction Ended",
        description: auction.currentWinner 
          ? `${auction.propertyName} sold for $${auction.currentBid}!`
          : `No bids for ${auction.propertyName}`,
      });
    });

    socket.on('bid-placed', ({ playerName, bidAmount, auction }) => {
      toast({
        title: "New Bid",
        description: `${playerName} bid $${bidAmount} for ${auction.propertyName}`,
      });
    });

    socket.on('trade-proposed', ({ tradeProposal, fromPlayer, toPlayer }) => {
      if (tradeProposal.toPlayerId === playerId) {
        toast({
          title: "Trade Proposal",
          description: `${fromPlayer} wants to trade with you!`,
        });
      }
    });

    socket.on('trade-resolved', ({ tradeProposal, accepted }) => {
      toast({
        title: "Trade " + (accepted ? "Accepted" : "Rejected"),
        description: accepted ? "Trade completed successfully!" : "Trade was rejected",
      });
    });

    socket.on('trade-cancelled', ({ tradeProposal }) => {
      toast({
        title: "Trade Cancelled",
        description: "The trade proposal was cancelled",
      });
    });

    socket.on('game-end-proposed', ({ playerName }) => {
      toast({
        title: "Game End Proposed",
        description: `${playerName} wants to end the game`,
      });
    });

    socket.on('game-ended', ({ winner, scores }) => {
      toast({
        title: "Game Ended",
        description: `${winner} wins the game!`,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, playerId, toast]);

  const setPlayerReady = (isReady: boolean) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('player-ready', { roomId, playerId, isReady });
    }
  };

  const rollDice = () => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('roll-dice', { roomId, playerId });
    }
  };

  const buyProperty = (propertyId: string) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('buy-property', { roomId, playerId, propertyId });
    }
  };

  const endTurn = () => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('end-turn', { roomId, playerId });
    }
  };

  const buildHouse = (propertyId: string) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('build-house', { roomId, playerId, propertyId });
    }
  };

  const buildHotel = (propertyId: string) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('build-hotel', { roomId, playerId, propertyId });
    }
  };

  const payBail = () => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('pay-bail', { roomId, playerId });
    }
  };

  const useGetOutOfJailCard = () => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('use-get-out-of-jail-card', { roomId, playerId });
    }
  };

  const sendChatMessage = (message: string) => {
    if (socketRef.current && roomId && playerId) {
      const chatMessage: ChatMessage = {
        playerId,
        playerName: gameState?.gameRoom.players.find(p => p.id === playerId)?.name || 'Unknown',
        message,
        timestamp: Date.now(),
      };
      socketRef.current.emit('send-chat-message', { roomId, message: chatMessage });
    }
  };

  const proposeTrade = (
    toPlayerId: string,
    offeredProperties: string[],
    offeredCash: number,
    requestedProperties: string[],
    requestedCash: number
  ) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('propose-trade', {
        roomId,
        playerId,
        toPlayerId,
        offeredProperties,
        offeredCash,
        requestedProperties,
        requestedCash,
      });
    }
  };

  const respondToTrade = (tradeId: string, accept: boolean) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('respond-to-trade', { roomId, playerId, tradeId, accept });
    }
  };

  const startAuction = (propertyId: string) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('start-auction', { roomId, playerId, propertyId });
    }
  };

  const placeBid = (auctionId: string, bidAmount: number) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('place-bid', { roomId, playerId, auctionId, bidAmount });
    }
  };

  const proposeGameEnd = () => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('propose-game-end', { roomId, playerId });
    }
  };

  const voteGameEnd = (agree: boolean) => {
    if (socketRef.current && roomId && playerId) {
      socketRef.current.emit('vote-game-end', { roomId, playerId, agree });
    }
  };

  const currentPlayer = gameState?.gameRoom.players.find(p => p.id === playerId);
  const isMyTurn = gameState?.currentPlayerTurn === playerId;
  const canRollDice = isMyTurn && !gameState?.diceRolled;
  const canEndTurn = isMyTurn && gameState?.diceRolled;

  return {
    gameState,
    isConnected,
    error,
    chatMessages,
    currentPlayer,
    isMyTurn,
    canRollDice,
    canEndTurn,
    setPlayerReady,
    rollDice,
    buyProperty,
    endTurn,
    buildHouse,
    buildHotel,
    payBail,
    useGetOutOfJailCard,
    sendChatMessage,
    proposeTrade,
    respondToTrade,
    startAuction,
    placeBid,
    proposeGameEnd,
    voteGameEnd,
  };
};