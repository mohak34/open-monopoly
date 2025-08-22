import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Validation schemas
export const createGameRoomSchema = z.object({
  name: z.string().min(1, "Game room name is required").max(50, "Game room name too long"),
  boardSize: z.number().min(40, "Board size must be at least 40").max(100, "Board size cannot exceed 100"),
  maxPlayers: z.number().min(2, "At least 2 players required").max(8, "Maximum 8 players allowed"),
  hostId: z.string().min(1, "Host ID is required")
});

export const joinGameRoomSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  playerName: z.string().min(1, "Player name is required").max(20, "Player name too long"),
  playerColor: z.string().min(1, "Player color is required"),
  playerId: z.string().min(1, "Player ID is required")
});

export const startGameSchema = z.object({
  gameRoomId: z.string().min(1, "Game room ID is required")
});

export const socketEventSchemas = {
  'join-room': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required")
  }),
  'player-ready': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    isReady: z.boolean()
  }),
  'roll-dice': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required")
  }),
  'buy-property': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    propertyId: z.string().min(1, "Property ID is required")
  }),
  'end-turn': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required")
  }),
  'build-house': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    propertyId: z.string().min(1, "Property ID is required")
  }),
  'build-hotel': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    propertyId: z.string().min(1, "Property ID is required")
  }),
  'pay-bail': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required")
  }),
  'use-get-out-of-jail-card': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required")
  }),
  'propose-trade': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    toPlayerId: z.string().min(1, "Target player ID is required"),
    offeredProperties: z.array(z.string()).min(0),
    offeredCash: z.number().min(0),
    requestedProperties: z.array(z.string()).min(0),
    requestedCash: z.number().min(0)
  }),
  'respond-to-trade': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    tradeId: z.string().min(1, "Trade ID is required"),
    accept: z.boolean()
  }),
  'cancel-trade': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    tradeId: z.string().min(1, "Trade ID is required")
  }),
  'send-chat-message': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    message: z.object({
      id: z.string().min(1, "Message ID is required"),
      playerId: z.string().min(1, "Player ID is required"),
      playerName: z.string().min(1, "Player name is required"),
      content: z.string().min(1, "Message content is required").max(500, "Message too long"),
      timestamp: z.number().min(0)
    })
  }),
  'start-auction': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    propertyId: z.string().min(1, "Property ID is required")
  }),
  'place-bid': z.object({
    roomId: z.string().min(1, "Room ID is required"),
    playerId: z.string().min(1, "Player ID is required"),
    auctionId: z.string().min(1, "Auction ID is required"),
    bidAmount: z.number().min(1, "Bid must be at least $1")
  })
};

// Validation helper function
export function validateSocketEvent<T>(eventType: string, data: any): T {
  const schema = socketEventSchemas[eventType as keyof typeof socketEventSchemas];
  if (!schema) {
    throw new Error(`No validation schema found for event: ${eventType}`);
  }
  return schema.parse(data) as T;
}

// Error handling utilities
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return new AppError('Invalid input data', 400);
    }

    // Handle database errors
    if (error.message.includes('Unique constraint') || error.message.includes('duplicate')) {
      return new AppError('Resource already exists', 409);
    }

    if (error.message.includes('Foreign key constraint') || error.message.includes('not found')) {
      return new AppError('Resource not found', 404);
    }

    // Handle other known errors
    return new AppError(error.message, 500);
  }

  return new AppError('An unexpected error occurred', 500);
};

export const createErrorResponse = (error: AppError) => {
  return {
    error: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  };
};
