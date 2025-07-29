import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const gameRooms = await db.gameRoom.findMany({
      include: {
        players: {
          select: {
            id: true,
            name: true,
            color: true,
            isReady: true,
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(gameRooms);
  } catch (error) {
    console.error('Error fetching game rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, boardSize, maxPlayers, hostId } = await request.json();

    if (!name || !boardSize || !maxPlayers || !hostId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const gameRoom = await db.gameRoom.create({
      data: {
        name,
        boardSize,
        maxPlayers,
        hostId,
        status: 'WAITING',
        settings: {
          auctionOnDecline: false,
          speedDie: false,
          turnTimer: 30,
        },
      },
      include: {
        players: true,
      },
    });

    return NextResponse.json(gameRoom);
  } catch (error) {
    console.error('Error creating game room:', error);
    return NextResponse.json(
      { error: 'Failed to create game room' },
      { status: 500 }
    );
  }
}