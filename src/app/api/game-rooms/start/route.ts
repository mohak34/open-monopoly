import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PropertyType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing room ID' },
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

    if (gameRoom.players.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 players to start' },
        { status: 400 }
      );
    }

    const allReady = gameRoom.players.every(p => p.isReady);
    if (!allReady) {
      return NextResponse.json(
        { error: 'All players must be ready' },
        { status: 400 }
      );
    }

    // Assign turn order to players randomly
    const shuffledPlayers = [...gameRoom.players].sort(() => Math.random() - 0.5);
    await Promise.all(
      shuffledPlayers.map((player, index) =>
        db.player.update({
          where: { id: player.id },
          data: { turnOrder: index },
        })
      )
    );

    await db.gameRoom.update({
      where: { id: roomId },
      data: { status: 'PLAYING' },
    });

    const properties = generateBoardProperties(gameRoom.boardSize, roomId);
    await db.property.createMany({
      data: properties,
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
            inJail: true,
          },
        },
        properties: true,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
}

function generateBoardProperties(boardSize: number, gameId: string): any[] {
  const properties: any[] = [];
  
  // Corner positions
  properties.push({
    gameId,
    name: 'GO',
    type: PropertyType.GO,
    position: 0,
  });

  properties.push({
    gameId,
    name: 'Jail',
    type: PropertyType.JAIL,
    position: Math.floor(boardSize / 4),
  });

  properties.push({
    gameId,
    name: 'Free Parking',
    type: PropertyType.FREE_PARKING,
    position: Math.floor(boardSize / 2),
  });

  properties.push({
    gameId,
    name: 'Go To Jail',
    type: PropertyType.GO_TO_JAIL,
    position: Math.floor(boardSize * 3 / 4),
  });

  // Generate properties for remaining positions
  const colorGroups = ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];
  const propertyNames = [
    'Mediterranean Avenue', 'Baltic Avenue', 'Oriental Avenue', 'Vermont Avenue',
    'Connecticut Avenue', 'St. Charles Place', 'States Avenue', 'Virginia Avenue',
    'St. James Place', 'Tennessee Avenue', 'New York Avenue', 'Kentucky Avenue',
    'Indiana Avenue', 'Illinois Avenue', 'Atlantic Avenue', 'Ventnor Avenue',
    'Marvin Gardens', 'Pacific Avenue', 'North Carolina Avenue', 'Pennsylvania Avenue',
    'Park Place', 'Boardwalk', 'Reading Railroad', 'Pennsylvania Railroad',
    'B&O Railroad', 'Short Line', 'Electric Company', 'Water Works'
  ];

  let propertyIndex = 0;
  let colorIndex = 0;

  for (let i = 1; i < boardSize; i++) {
    if (i === Math.floor(boardSize / 4) || 
        i === Math.floor(boardSize / 2) || 
        i === Math.floor(boardSize * 3 / 4)) {
      continue; // Skip corner positions
    }

    const position = i;
    const isRailroad = (i - 1) % 10 === 0;
    const isUtility = (i - 1) % 15 === 0;
    const isTax = (i - 1) % 8 === 0;
    const isChance = (i - 1) % 12 === 0;
    const isCommunityChest = (i - 1) % 14 === 0;

    if (isRailroad && propertyIndex < 4) {
      properties.push({
        gameId,
        name: `Railroad ${propertyIndex + 1}`,
        type: PropertyType.RAILROAD,
        position,
        price: 200,
        rent: 25,
        rentWithHouse: 50,
        rentWithHotel: 100,
      });
      propertyIndex++;
    } else if (isUtility && propertyIndex < 2) {
      properties.push({
        gameId,
        name: propertyIndex === 0 ? 'Electric Company' : 'Water Works',
        type: PropertyType.UTILITY,
        position,
        price: 150,
        rent: 4,
        rentWithHouse: 10,
        rentWithHotel: 20,
      });
      propertyIndex++;
    } else if (isTax) {
      properties.push({
        gameId,
        name: 'Tax',
        type: PropertyType.TAX,
        position,
      });
    } else if (isChance) {
      properties.push({
        gameId,
        name: 'Chance',
        type: PropertyType.CHANCE,
        position,
      });
    } else if (isCommunityChest) {
      properties.push({
        gameId,
        name: 'Community Chest',
        type: PropertyType.COMMUNITY_CHEST,
        position,
      });
    } else if (propertyIndex < propertyNames.length) {
      const basePrice = 60 + (colorIndex * 20);
      const baseRent = Math.floor(basePrice * 0.1);
      
      properties.push({
        gameId,
        name: propertyNames[propertyIndex % propertyNames.length],
        type: PropertyType.PROPERTY,
        position,
        price: basePrice,
        rent: baseRent,
        rentWithHouse: baseRent * 5,
        rentWithHotel: baseRent * 10,
        colorGroup: colorGroups[colorIndex % colorGroups.length],
      });
      
      propertyIndex++;
      if (propertyIndex % 2 === 0) {
        colorIndex++;
      }
    }
  }

  return properties;
}