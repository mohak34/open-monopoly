import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    
    if (roomId) {
      // Get specific room
      const gameRoom = await db.gameRoom.findUnique({
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
              isBankrupt: true,
              inJail: true,
            },
          },
        },
      });
      
      if (!gameRoom) {
        return NextResponse.json(
          { error: 'Game room not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(gameRoom);
    }
    
    // Get all rooms
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

export async function DELETE(request: NextRequest) {
  try {
    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Delete the game room and all associated data (players, properties, transactions)
    // Prisma's cascade delete will handle related records
    const deletedRoom = await db.gameRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true, deletedRoom });
  } catch (error) {
    console.error('Error deleting game room:', error);
    return NextResponse.json(
      { error: 'Failed to delete game room' },
      { status: 500 }
    );
  }
}