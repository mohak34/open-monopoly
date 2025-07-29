import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerName, playerColor, playerId } = await request.json();

    if (!roomId || !playerName || !playerColor || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const gameRoom = await db.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        players: true,
      },
    });

    if (!gameRoom) {
      return NextResponse.json(
        { error: 'Game room not found' },
        { status: 404 }
      );
    }

    if (gameRoom.players.length >= gameRoom.maxPlayers) {
      return NextResponse.json(
        { error: 'Game room is full' },
        { status: 400 }
      );
    }

    if (gameRoom.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      );
    }

    // Check if this player ID already exists in this specific game room first
    const existingPlayerInRoom = gameRoom.players.find(p => p.id === playerId);
    if (existingPlayerInRoom) {
      return NextResponse.json(
        { error: 'Player already in this room' },
        { status: 400 }
      );
    }

    // Check if this player ID already exists in any OTHER game room
    const existingPlayerAnywhere = await db.player.findUnique({
      where: { id: playerId }
    });

    if (existingPlayerAnywhere && existingPlayerAnywhere.gameId !== roomId) {
      return NextResponse.json(
        { error: 'Player ID already exists in a different game' },
        { status: 400 }
      );
    }

    // Check if color is already taken
    const colorTaken = gameRoom.players.find(p => p.color === playerColor);
    if (colorTaken) {
      return NextResponse.json(
        { error: 'Player color already taken' },
        { status: 400 }
      );
    }

    await db.player.create({
      data: {
        id: playerId,
        name: playerName,
        color: playerColor,
        gameId: roomId,
        turnOrder: gameRoom.players.length,
        isReady: gameRoom.hostId === playerId, // Host is automatically ready
      },
    });

    // Add a small delay to ensure the database write is fully committed
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedRoom = await db.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            color: true,
            isReady: true,
            cash: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error joining game room:', error);
    return NextResponse.json(
      { error: 'Failed to join game room' },
      { status: 500 }
    );
  }
}