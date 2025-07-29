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

    const existingPlayer = gameRoom.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player already in room' },
        { status: 400 }
      );
    }

    const player = await db.player.create({
      data: {
        id: playerId,
        name: playerName,
        color: playerColor,
        gameId: roomId,
        turnOrder: gameRoom.players.length,
      },
    });

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