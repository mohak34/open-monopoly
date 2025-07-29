import { Server } from 'socket.io';
import { db } from '@/lib/db';
import { TransactionType } from '@prisma/client';

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

interface GameRoom {
  id: string;
  name: string;
  boardSize: number;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Player[];
  hostId: string;
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

interface GameState {
  gameRoom: GameRoom;
  properties: Property[];
  currentPlayerTurn: string;
  diceRolled: boolean;
  lastDiceRoll: [number, number];
  gameMessage: string;
}

interface Card {
  id: string;
  type: 'CHANCE' | 'COMMUNITY_CHEST';
  text: string;
  action: string;
  amount?: number;
  moveTo?: number;
  getOutOfJailFree?: boolean;
}

const chanceCards: Card[] = [
  { id: 'c1', type: 'CHANCE', text: 'Advance to GO', action: 'MOVE_TO', moveTo: 0 },
  { id: 'c2', type: 'CHANCE', text: 'Go to Jail', action: 'GO_TO_JAIL' },
  { id: 'c3', type: 'CHANCE', text: 'Get Out of Jail Free', action: 'GET_OUT_OF_JAIL_FREE', getOutOfJailFree: true },
  { id: 'c4', type: 'CHANCE', text: 'Pay poor tax of $15', action: 'PAY_MONEY', amount: 15 },
  { id: 'c5', type: 'CHANCE', text: 'Your building loan matures. Collect $150', action: 'COLLECT_MONEY', amount: 150 },
  { id: 'c6', type: 'CHANCE', text: 'You have won a crossword competition. Collect $100', action: 'COLLECT_MONEY', amount: 100 },
  { id: 'c7', type: 'CHANCE', text: 'Bank error in your favor. Collect $200', action: 'COLLECT_MONEY', amount: 200 },
  { id: 'c8', type: 'CHANCE', text: 'Doctor fee. Pay $50', action: 'PAY_MONEY', amount: 50 },
  { id: 'c9', type: 'CHANCE', text: 'From sale of stock, you get $50', action: 'COLLECT_MONEY', amount: 50 },
  { id: 'c10', type: 'CHANCE', text: 'Holiday fund matures. Receive $100', action: 'COLLECT_MONEY', amount: 100 },
];

const communityChestCards: Card[] = [
  { id: 'cc1', type: 'COMMUNITY_CHEST', text: 'Advance to GO', action: 'MOVE_TO', moveTo: 0 },
  { id: 'cc2', type: 'COMMUNITY_CHEST', text: 'Go to Jail', action: 'GO_TO_JAIL' },
  { id: 'cc3', type: 'COMMUNITY_CHEST', text: 'Get Out of Jail Free', action: 'GET_OUT_OF_JAIL_FREE', getOutOfJailFree: true },
  { id: 'cc4', type: 'COMMUNITY_CHEST', text: 'Pay hospital $100', action: 'PAY_MONEY', amount: 100 },
  { id: 'cc5', type: 'COMMUNITY_CHEST', text: 'Doctor fee. Pay $50', action: 'PAY_MONEY', amount: 50 },
  { id: 'cc6', type: 'COMMUNITY_CHEST', text: 'Income tax refund. Collect $20', action: 'COLLECT_MONEY', amount: 20 },
  { id: 'cc7', type: 'COMMUNITY_CHEST', text: 'Life insurance matures. Collect $100', action: 'COLLECT_MONEY', amount: 100 },
  { id: 'cc8', type: 'COMMUNITY_CHEST', text: 'Pay school tax of $150', action: 'PAY_MONEY', amount: 150 },
  { id: 'cc9', type: 'COMMUNITY_CHEST', text: 'Receive $25 consultancy fee', action: 'COLLECT_MONEY', amount: 25 },
  { id: 'cc10', type: 'COMMUNITY_CHEST', text: 'You have won second prize in a beauty contest. Collect $10', action: 'COLLECT_MONEY', amount: 10 },
];

interface TradeProposal {
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

interface Auction {
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

const activeAuctions = new Map<string, Auction>();
const gameRooms = new Map<string, GameState>();

const tradeProposals = new Map<string, TradeProposal>();
const chanceDeck = [...chanceCards];
const communityChestDeck = [...communityChestCards];

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function drawCard(type: 'CHANCE' | 'COMMUNITY_CHEST'): Card {
  const deck = type === 'CHANCE' ? chanceDeck : communityChestDeck;
  const card = deck.shift();
  
  if (!card) {
    // Reshuffle deck if empty
    const newDeck = shuffleDeck(type === 'CHANCE' ? chanceCards : communityChestCards);
    if (type === 'CHANCE') {
      chanceDeck.length = 0;
      chanceDeck.push(...newDeck);
    } else {
      communityChestDeck.length = 0;
      communityChestDeck.push(...newDeck);
    }
    return drawCard(type);
  }
  
  return card;
}

async function handleCardAction(card: Card, gameState: GameState, currentPlayer: Player, roomId: string, playerId: string) {
  let gameMessage = `${currentPlayer.name} drew a card: "${card.text}"`;
  
  switch (card.action) {
    case 'MOVE_TO':
      if (card.moveTo !== undefined) {
        currentPlayer.position = card.moveTo;
        await db.player.update({
          where: { id: playerId },
          data: { position: card.moveTo },
        });
        gameMessage += ` and moved to position ${card.moveTo}`;
      }
      break;
      
    case 'GO_TO_JAIL':
      const jailPosition = Math.floor(gameState.gameRoom.boardSize / 4);
      currentPlayer.position = jailPosition;
      currentPlayer.inJail = true;
      currentPlayer.jailTurns = 0;
      
      await db.player.update({
        where: { id: playerId },
        data: { 
          position: jailPosition,
          inJail: true,
          jailTurns: 0,
        },
      });
      gameMessage += ` and was sent to jail!`;
      break;
      
    case 'GET_OUT_OF_JAIL_FREE':
      currentPlayer.getOutOfJailFreeCards += 1;
      await db.player.update({
        where: { id: playerId },
        data: { getOutOfJailFreeCards: currentPlayer.getOutOfJailFreeCards },
      });
      gameMessage += ` and received a Get Out of Jail Free card!`;
      break;
      
    case 'PAY_MONEY':
      if (card.amount && currentPlayer.cash >= card.amount) {
        currentPlayer.cash -= card.amount;
        await db.player.update({
          where: { id: playerId },
          data: { cash: currentPlayer.cash },
        });
        gameMessage += ` and paid $${card.amount}`;
        
        // Check for bankruptcy after payment
        await checkBankruptcy(gameState, roomId);
      } else if (card.amount) {
        gameMessage += ` but cannot afford to pay $${card.amount}!`;
        
        // Player goes bankrupt if they can't pay
        currentPlayer.cash -= card.amount; // Force negative cash
        await checkBankruptcy(gameState, roomId);
      }
      break;
      
    case 'COLLECT_MONEY':
      if (card.amount) {
        currentPlayer.cash += card.amount;
        await db.player.update({
          where: { id: playerId },
          data: { cash: currentPlayer.cash },
        });
        gameMessage += ` and collected $${card.amount}`;
      }
      break;
  }
  
  await db.transaction.create({
    data: {
      type: card.type === 'CHANCE' ? TransactionType.CHANCE_CARD : TransactionType.COMMUNITY_CHEST_CARD,
      amount: card.amount || 0,
      description: card.text,
      gameId: roomId,
      playerId,
    },
  });
  
  return gameMessage;
}

function generateDiceRoll(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
}

async function checkGameEnd(gameState: GameState, roomId: string) {
  const activePlayers = gameState.gameRoom.players.filter(p => !p.isBankrupt);
  
  // Game ends when only one player remains
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    gameState.gameRoom.status = 'FINISHED';
    
    await db.gameRoom.update({
      where: { id: roomId },
      data: { status: 'FINISHED' },
    });
    
    // Calculate total assets (cash + property values)
    const playerProperties = gameState.properties.filter(p => p.ownerId === winner.id);
    const propertyValues = playerProperties.reduce((total, property) => {
      return total + (property.price || 0) + (property.houses * 50) + (property.hasHotel ? 100 : 0);
    }, 0);
    
    const totalAssets = winner.cash + propertyValues;
    
    gameState.gameMessage = `🎉 ${winner.name} wins the game! Final assets: $${totalAssets.toLocaleString()} (Cash: $${winner.cash.toLocaleString()}, Properties: $${propertyValues.toLocaleString()})`;
    
    return true;
  }
  
  // Check if all players agree to end early (this would need UI implementation)
  // For now, we'll just check for bankruptcy condition
  
  return false;
}

async function checkBankruptcy(gameState: GameState, roomId: string) {
  const bankruptPlayers: Player[] = [];
  
  for (const player of gameState.gameRoom.players) {
    if (player.isBankrupt) continue;
    
    // Check if player has negative cash or can't pay debts
    if (player.cash < 0) {
      bankruptPlayers.push(player);
    }
  }
  
  for (const player of bankruptPlayers) {
    player.isBankrupt = true;
    
    // Return all properties to the bank (unowned)
    const playerProperties = gameState.properties.filter(p => p.ownerId === player.id);
    for (const property of playerProperties) {
      property.ownerId = undefined;
      property.houses = 0;
      property.hasHotel = false;
      
      await db.property.update({
        where: { id: property.id },
        data: { 
          ownerId: null,
          houses: 0,
          hasHotel: false,
        },
      });
    }
    
    await db.player.update({
      where: { id: player.id },
      data: { isBankrupt: true },
    });
    
    await db.transaction.create({
      data: {
        type: TransactionType.BANKRUPTCY,
        amount: 0,
        description: `${player.name} declared bankruptcy`,
        gameId: roomId,
        playerId: player.id,
      },
    });
    
    gameState.gameMessage = `${player.name} has gone bankrupt and is out of the game!`;
  }
  
  // Check if game should end (only one player left)
  const activePlayers = gameState.gameRoom.players.filter(p => !p.isBankrupt);
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    gameState.gameRoom.status = 'FINISHED';
    
    await db.gameRoom.update({
      where: { id: roomId },
      data: { status: 'FINISHED' },
    });
    
    gameState.gameMessage = `🎉 ${winner.name} wins the game! All other players have gone bankrupt.`;
    
    // Calculate total assets for the winner
    const playerProperties = gameState.properties.filter(p => p.ownerId === winner.id);
    const propertyValues = playerProperties.reduce((total, property) => {
      return total + (property.price || 0) + (property.houses * 50) + (property.hasHotel ? 100 : 0);
    }, 0);
    
    const totalAssets = winner.cash + propertyValues;
    gameState.gameMessage += ` Final assets: $${totalAssets.toLocaleString()} (Cash: $${winner.cash.toLocaleString()}, Properties: $${propertyValues.toLocaleString()})`;
  }
  
  // Check for game end conditions
  await checkGameEnd(gameState, roomId);
  
  return bankruptPlayers.length > 0;
}

function calculateRent(property: Property, ownedInGroup: number = 0): number {
  if (!property.rent) return 0;
  
  if (property.hasHotel && property.rentWithHotel) {
    return property.rentWithHotel;
  }
  
  if (property.houses > 0 && property.rentWithHouse) {
    return property.rentWithHouse * property.houses;
  }
  
  if (ownedInGroup > 1 && property.colorGroup) {
    return property.rent * 2;
  }
  
  return property.rent;
}

export const setupSocket = (io: Server) => {
  
  // Store the io instance for use in other functions
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', async ({ roomId, playerId }) => {
      try {
        socket.join(roomId);
        console.log(`Player ${playerId} attempting to join room ${roomId}`);
        
        // Retry mechanism with exponential backoff for database synchronization
        const maxRetries = 7; // Increased retries
        let retryCount = 0;
        
        const attemptJoin = async (): Promise<void> => {
          const delay = Math.min(150 * Math.pow(1.5, retryCount), 3000); // Longer delays: 150ms, 225ms, 337ms, 506ms, 759ms, 1138ms, 1707ms
          if (retryCount > 0) {
            console.log(`Retry attempt ${retryCount} for player ${playerId} in room ${roomId} (waiting ${delay}ms)`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const gameRoom = await db.gameRoom.findUnique({
            where: { id: roomId },
            include: {
              players: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  cash: true,
                  position: true,
                  inJail: true,
                  isReady: true,
                  isBankrupt: true,
                  jailTurns: true,
                  turnOrder: true,
                  getOutOfJailFreeCards: true,
                },
              },
            },
          });

          if (!gameRoom) {
            console.error(`Game room ${roomId} not found`);
            socket.emit('error', { message: 'Game room not found' });
            return;
          }

          // Check if player exists in the room
          const playerInRoom = gameRoom.players.find(p => p.id === playerId);
          if (!playerInRoom) {
            console.error(`Player ${playerId} not found in room ${roomId} (attempt ${retryCount + 1}/${maxRetries})`);
            console.error(`Available players:`, gameRoom.players.map(p => ({ id: p.id, name: p.name })));
            console.error(`Looking for exact match with playerId: "${playerId}"`);
            console.error(`Player ID types:`, gameRoom.players.map(p => ({ id: p.id, type: typeof p.id })));
            
            if (retryCount < maxRetries - 1) {
              retryCount++;
              return attemptJoin();
            } else {
              // Final attempt failed
              console.error(`Player ${playerId} not found after ${maxRetries} attempts. Sending error.`);
              socket.emit('error', { message: 'Player not found in room. Please rejoin from the lobby.' });
              return;
            }
          }

          console.log(`Player ${playerId} found in room ${roomId}:`, playerInRoom.name);
          await handleSuccessfulJoin(socket, roomId, playerId, gameRoom);
        };
        
        await attemptJoin();

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    async function handleSuccessfulJoin(socket: any, roomId: string, playerId: string, gameRoom: any) {
      try {
        const properties = await db.property.findMany({
          where: { gameId: roomId },
        });

        // Always fetch fresh data from database to ensure we have the latest players
        const freshGameRoom = await db.gameRoom.findUnique({
          where: { id: roomId },
          include: {
            players: {
              select: {
                id: true,
                name: true,
                color: true,
                cash: true,
                position: true,
                inJail: true,
                isReady: true,
                isBankrupt: true,
                jailTurns: true,
                turnOrder: true,
                getOutOfJailFreeCards: true,
              },
            },
          },
        });

        if (!freshGameRoom) {
          console.error('Fresh game room not found');
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        console.log(`Fresh room data contains ${freshGameRoom.players.length} players:`, 
                   freshGameRoom.players.map(p => ({ id: p.id, name: p.name })));

        // Create or update gameState with fresh data
        const gameState = {
          gameRoom: {
            id: freshGameRoom.id,
            name: freshGameRoom.name,
            boardSize: freshGameRoom.boardSize,
            maxPlayers: freshGameRoom.maxPlayers,
            status: freshGameRoom.status,
            hostId: freshGameRoom.hostId,
            players: freshGameRoom.players.map((p: any) => ({
              ...p,
              cash: Number(p.cash),
              position: Number(p.position),
              jailTurns: Number(p.jailTurns),
              turnOrder: Number(p.turnOrder),
              getOutOfJailFreeCards: Number(p.getOutOfJailFreeCards || 0),
            })),
          },
          properties: properties.map((p: any) => ({
            ...p,
            price: p.price ? Number(p.price) : undefined,
            rent: p.rent ? Number(p.rent) : undefined,
            rentWithHouse: p.rentWithHouse ? Number(p.rentWithHouse) : undefined,
            rentWithHotel: p.rentWithHotel ? Number(p.rentWithHotel) : undefined,
            houses: Number(p.houses),
          })),
          currentPlayerTurn: freshGameRoom.players[0]?.id || '',
          diceRolled: false,
          lastDiceRoll: [0, 0] as [number, number],
          gameMessage: 'Game started! Good luck!',
        };

        // Update the cache with fresh data
        gameRooms.set(roomId, gameState);

        console.log(`Sending room update to player ${playerId}`);
        console.log(`GameState contains ${gameState.gameRoom.players.length} players:`, 
                   gameState.gameRoom.players.map(p => ({ id: p.id, name: p.name })));
        
        socket.emit('room-updated', gameState);
        socket.to(roomId).emit('room-updated', gameState);
      } catch (error) {
        console.error('Error in handleSuccessfulJoin:', error);
        socket.emit('error', { message: 'Failed to complete room join' });
      }
    }

    socket.on('player-ready', async ({ roomId, playerId, isReady }) => {
      try {
        await db.player.update({
          where: { id: playerId },
          data: { isReady },
        });

        const gameRoom = await db.gameRoom.findUnique({
          where: { id: roomId },
          include: {
            players: {
              select: {
                id: true,
                name: true,
                color: true,
                cash: true,
                position: true,
                inJail: true,
                isReady: true,
                isBankrupt: true,
                jailTurns: true,
                turnOrder: true,
                  getOutOfJailFreeCards: true,
              },
            },
          },
        });

        const properties = await db.property.findMany({
          where: { gameId: roomId },
        });

        if (gameRoom) {
          const gameState = gameRooms.get(roomId);
          if (gameState) {
            gameState.gameRoom = {
              id: gameRoom.id,
              name: gameRoom.name,
              boardSize: gameRoom.boardSize,
              maxPlayers: gameRoom.maxPlayers,
              status: gameRoom.status,
              hostId: gameRoom.hostId,
              players: gameRoom.players.map(p => ({
                ...p,
                cash: Number(p.cash),
                position: Number(p.position),
                jailTurns: Number(p.jailTurns),
                turnOrder: Number(p.turnOrder),
                getOutOfJailFreeCards: Number(p.getOutOfJailFreeCards || 0),
              })),
            };
            
            gameRooms.set(roomId, gameState);
            io.to(roomId).emit('room-updated', gameState);
          }
        }
      } catch (error) {
        console.error('Error updating player ready status:', error);
        socket.emit('error', { message: 'Failed to update ready status' });
      }
    });

    socket.on('roll-dice', async ({ roomId, playerId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.currentPlayerTurn !== playerId) {
          socket.emit('error', { message: 'Not your turn!' });
          return;
        }

        if (gameState.diceRolled) {
          socket.emit('error', { message: 'You already rolled the dice!' });
          return;
        }

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer) return;

        // Handle jail mechanics
        if (currentPlayer.inJail) {
          const diceRoll = generateDiceRoll();
          gameState.diceRolled = true;
          gameState.lastDiceRoll = diceRoll;

          const isDoubles = diceRoll[0] === diceRoll[1];
          
          if (isDoubles) {
            // Player rolled doubles and gets out of jail
            currentPlayer.inJail = false;
            currentPlayer.jailTurns = 0;
            
            const moveAmount = diceRoll[0] + diceRoll[1];
            const newPosition = (currentPlayer.position + moveAmount) % gameState.gameRoom.boardSize;
            currentPlayer.position = newPosition;
            
            await db.player.update({
              where: { id: playerId },
              data: { 
                inJail: false,
                jailTurns: 0,
                position: newPosition,
              },
            });

            gameState.gameMessage = `${currentPlayer.name} rolled doubles (${diceRoll[0]} + ${diceRoll[1]}) and got out of jail! Moved to position ${newPosition}.`;
          } else {
            // Player failed to roll doubles
            currentPlayer.jailTurns += 1;
            
            await db.player.update({
              where: { id: playerId },
              data: { jailTurns: currentPlayer.jailTurns },
            });

            if (currentPlayer.jailTurns >= 3) {
              // Player must pay bail after 3 failed attempts
              const bailAmount = 50;
              if (currentPlayer.cash >= bailAmount) {
                currentPlayer.cash -= bailAmount;
                currentPlayer.inJail = false;
                currentPlayer.jailTurns = 0;
                
                await db.player.update({
                  where: { id: playerId },
                  data: { 
                    cash: currentPlayer.cash,
                    inJail: false,
                    jailTurns: 0,
                  },
                });

                await db.transaction.create({
                  data: {
                    type: TransactionType.JAIL_FINE,
                    amount: bailAmount,
                    fromPlayer: playerId,
                    description: 'Forced bail payment after 3 turns in jail',
                    gameId: roomId,
                    playerId,
                  },
                });

                gameState.gameMessage = `${currentPlayer.name} failed to roll doubles for the 3rd time and paid $${bailAmount} bail to get out of jail!`;
                
                // Check for bankruptcy after forced bail payment
                await checkBankruptcy(gameState, roomId);
              } else {
                gameState.gameMessage = `${currentPlayer.name} failed to roll doubles and cannot afford bail! Stuck in jail.`;
                
                // Player goes bankrupt if they can't pay forced bail
                currentPlayer.cash -= bailAmount; // Force negative cash
                await checkBankruptcy(gameState, roomId);
              }
            } else {
              gameState.gameMessage = `${currentPlayer.name} rolled ${diceRoll[0]} + ${diceRoll[1]} and failed to roll doubles. Still in jail (${currentPlayer.jailTurns}/3 attempts).`;
            }
          }

          gameRooms.set(roomId, gameState);
          io.to(roomId).emit('room-updated', gameState);
          return;
        }

        const diceRoll = generateDiceRoll();
        gameState.diceRolled = true;
        gameState.lastDiceRoll = diceRoll;

        const newPosition = (currentPlayer.position + diceRoll[0] + diceRoll[1]) % gameState.gameRoom.boardSize;
        
        await db.player.update({
          where: { id: playerId },
          data: { position: newPosition },
        });

        currentPlayer.position = newPosition;

        const landedProperty = gameState.properties.find(p => p.position === newPosition);
        let gameMessage = `${currentPlayer.name} rolled ${diceRoll[0]} + ${diceRoll[1]} = ${diceRoll[0] + diceRoll[1]} and moved to position ${newPosition}`;

        if (landedProperty) {
          gameMessage += ` (${landedProperty.name})`;
          
          if (landedProperty.type === 'GO') {
            const goAmount = 200;
            currentPlayer.cash += goAmount;
            await db.player.update({
              where: { id: playerId },
              data: { cash: currentPlayer.cash },
            });
            
            await db.transaction.create({
              data: {
                type: TransactionType.COLLECT_GO,
                amount: goAmount,
                toPlayer: playerId,
                description: 'Passed GO',
                gameId: roomId,
                playerId,
              },
            });
            
            gameMessage += ` and collected $${goAmount}!`;
          } else if (landedProperty.type === 'GO_TO_JAIL') {
            // Send player to jail
            const jailPosition = Math.floor(gameState.gameRoom.boardSize / 4);
            currentPlayer.position = jailPosition;
            currentPlayer.inJail = true;
            currentPlayer.jailTurns = 0;
            
            await db.player.update({
              where: { id: playerId },
              data: { 
                position: jailPosition,
                inJail: true,
                jailTurns: 0,
              },
            });
            
            await db.transaction.create({
              data: {
                type: TransactionType.CHANCE_CARD,
                amount: 0,
                description: 'Go to Jail',
                gameId: roomId,
                playerId,
              },
            });
            
            gameMessage += ` and was sent to jail!`;
          } else if (landedProperty.type === 'PROPERTY' && landedProperty.price && !landedProperty.ownerId) {
            gameMessage += '. Property available for purchase!';
          } else if (landedProperty.type === 'PROPERTY' && landedProperty.ownerId && landedProperty.ownerId !== playerId) {
            const owner = gameState.gameRoom.players.find(p => p.id === landedProperty.ownerId);
            if (owner && !owner.isBankrupt) {
              const ownedInGroup = gameState.properties.filter(p => 
                p.colorGroup === landedProperty.colorGroup && p.ownerId === landedProperty.ownerId
              ).length;
              const rent = calculateRent(landedProperty, ownedInGroup);
              
              if (currentPlayer.cash >= rent) {
                currentPlayer.cash -= rent;
                owner.cash += rent;
                
                await db.player.update({
                  where: { id: playerId },
                  data: { cash: currentPlayer.cash },
                });
                
                await db.player.update({
                  where: { id: owner.id },
                  data: { cash: owner.cash },
                });
                
                await db.transaction.create({
                  data: {
                    type: TransactionType.PAY_RENT,
                    amount: rent,
                    fromPlayer: playerId,
                    toPlayer: owner.id,
                    description: `Rent for ${landedProperty.name}`,
                    gameId: roomId,
                    playerId,
                  },
                });
                
                gameMessage += ` and paid $${rent} rent to ${owner.name}!`;
                
                // Check for bankruptcy after rent payment
                await checkBankruptcy(gameState, roomId);
              } else {
                gameMessage += ` but cannot afford $${rent} rent!`;
                
                // Player goes bankrupt if they can't pay rent
                currentPlayer.cash -= rent; // Force negative cash
                await checkBankruptcy(gameState, roomId);
              }
            }
          } else if (landedProperty.type === 'TAX') {
            const taxAmount = 100; // Standard tax amount
            if (currentPlayer.cash >= taxAmount) {
              currentPlayer.cash -= taxAmount;
              
              await db.player.update({
                where: { id: playerId },
                data: { cash: currentPlayer.cash },
              });
              
              await db.transaction.create({
                data: {
                  type: TransactionType.PAY_TAX,
                  amount: taxAmount,
                  fromPlayer: playerId,
                  description: `Tax payment`,
                  gameId: roomId,
                  playerId,
                },
              });
              
              gameMessage += ` and paid $${taxAmount} in taxes!`;
              
              // Check for bankruptcy after tax payment
              await checkBankruptcy(gameState, roomId);
            } else {
              gameMessage += ` but cannot afford $${taxAmount} in taxes!`;
              
              // Player goes bankrupt if they can't pay taxes
              currentPlayer.cash -= taxAmount; // Force negative cash
              await checkBankruptcy(gameState, roomId);
            }
          } else if (landedProperty.type === 'CHANCE') {
            const card = drawCard('CHANCE');
            const cardMessage = await handleCardAction(card, gameState, currentPlayer, roomId, playerId);
            gameMessage += `. ${cardMessage}`;
          } else if (landedProperty.type === 'COMMUNITY_CHEST') {
            const card = drawCard('COMMUNITY_CHEST');
            const cardMessage = await handleCardAction(card, gameState, currentPlayer, roomId, playerId);
            gameMessage += `. ${cardMessage}`;
          }
        }

        gameState.gameMessage = gameMessage;
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error rolling dice:', error);
        socket.emit('error', { message: 'Failed to roll dice' });
      }
    });

    socket.on('buy-property', async ({ roomId, playerId, propertyId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.currentPlayerTurn !== playerId) {
          socket.emit('error', { message: 'Not your turn!' });
          return;
        }

        if (!gameState.diceRolled) {
          socket.emit('error', { message: 'Roll dice first!' });
          return;
        }

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer) return;

        const property = gameState.properties.find(p => p.id === propertyId);
        if (!property || property.ownerId || !property.price) {
          socket.emit('error', { message: 'Property not available for purchase!' });
          return;
        }

        if (currentPlayer.cash < property.price) {
          socket.emit('error', { message: 'Not enough money to buy this property!' });
          return;
        }

        currentPlayer.cash -= property.price;
        property.ownerId = playerId;

        await db.player.update({
          where: { id: playerId },
          data: { cash: currentPlayer.cash },
        });

        await db.property.update({
          where: { id: propertyId },
          data: { ownerId: playerId },
        });

        await db.transaction.create({
          data: {
            type: TransactionType.BUY_PROPERTY,
            amount: property.price,
            fromPlayer: playerId,
            description: `Purchased ${property.name}`,
            gameId: roomId,
            playerId,
          },
        });

        gameState.gameMessage = `${currentPlayer.name} bought ${property.name} for $${property.price}!`;
        
        // Check for bankruptcy after property purchase
        await checkBankruptcy(gameState, roomId);
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error buying property:', error);
        socket.emit('error', { message: 'Failed to buy property' });
      }
    });

    socket.on('end-turn', async ({ roomId, playerId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.currentPlayerTurn !== playerId) {
          socket.emit('error', { message: 'Not your turn!' });
          return;
        }

        if (!gameState.diceRolled) {
          socket.emit('error', { message: 'Roll dice first!' });
          return;
        }

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer) return;

        const isDoubles = gameState.lastDiceRoll[0] === gameState.lastDiceRoll[1];
        
        if (isDoubles) {
          gameState.gameMessage = `${currentPlayer.name} rolled doubles! Take another turn!`;
          gameState.diceRolled = false;
        } else {
          const activePlayers = gameState.gameRoom.players.filter(p => !p.isBankrupt);
          const currentIndex = activePlayers.findIndex(p => p.id === playerId);
          const nextIndex = (currentIndex + 1) % activePlayers.length;
          gameState.currentPlayerTurn = activePlayers[nextIndex].id;
          gameState.diceRolled = false;
          
          const nextPlayer = gameState.gameRoom.players.find(p => p.id === gameState.currentPlayerTurn);
          gameState.gameMessage = `${currentPlayer.name}'s turn ended. ${nextPlayer?.name}'s turn now!`;
        }

        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error ending turn:', error);
        socket.emit('error', { message: 'Failed to end turn' });
      }
    });

    socket.on('game-started', async ({ roomId }) => {
      try {
        const gameRoom = await db.gameRoom.findUnique({
          where: { id: roomId },
          include: {
            players: {
              select: {
                id: true,
                name: true,
                color: true,
                cash: true,
                position: true,
                inJail: true,
                isReady: true,
                isBankrupt: true,
                jailTurns: true,
                turnOrder: true,
                  getOutOfJailFreeCards: true,
              },
            },
          },
        });

        const properties = await db.property.findMany({
          where: { gameId: roomId },
        });

        if (gameRoom) {
          const gameState = gameRooms.get(roomId);
          if (gameState) {
            gameState.gameRoom = {
              ...gameRoom,
              players: gameRoom.players.map(p => ({
                ...p,
                cash: Number(p.cash),
                position: Number(p.position),
                jailTurns: Number(p.jailTurns),
                turnOrder: Number(p.turnOrder),
                getOutOfJailFreeCards: Number(p.getOutOfJailFreeCards || 0),
              })),
            };
            
            gameRooms.set(roomId, gameState);
            io.to(roomId).emit('room-updated', gameState);
          }
        }
      } catch (error) {
        console.error('Error handling game started:', error);
      }
    });

    socket.on('build-hotel', async ({ roomId, playerId, propertyId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer) return;

        const property = gameState.properties.find(p => p.id === propertyId);
        if (!property || property.ownerId !== playerId || property.type !== 'PROPERTY') {
          socket.emit('error', { message: 'You do not own this property!' });
          return;
        }

        if (property.houses !== 4) {
          socket.emit('error', { message: 'You need 4 houses before building a hotel!' });
          return;
        }

        if (property.hasHotel) {
          socket.emit('error', { message: 'This property already has a hotel!' });
          return;
        }

        const hotelCost = 100; // Standard hotel cost
        if (currentPlayer.cash < hotelCost) {
          socket.emit('error', { message: 'Not enough money to build a hotel!' });
          return;
        }

        // Check if player owns all properties in the color group
        const colorGroupProperties = gameState.properties.filter(p => 
          p.colorGroup === property.colorGroup && p.type === 'PROPERTY'
        );
        const ownsAllInGroup = colorGroupProperties.every(p => p.ownerId === playerId);
        
        if (!ownsAllInGroup) {
          socket.emit('error', { message: 'You must own all properties in this color group!' });
          return;
        }

        currentPlayer.cash -= hotelCost;
        property.hasHotel = true;
        property.houses = 0;

        await db.player.update({
          where: { id: playerId },
          data: { cash: currentPlayer.cash },
        });

        await db.property.update({
          where: { id: propertyId },
          data: { hasHotel: true, houses: 0 },
        });

        await db.transaction.create({
          data: {
            type: TransactionType.BUILD_HOTEL,
            amount: hotelCost,
            fromPlayer: playerId,
            description: `Built hotel on ${property.name}`,
            gameId: roomId,
            playerId,
          },
        });

        gameState.gameMessage = `${currentPlayer.name} built a hotel on ${property.name} for $${hotelCost}!`;
        
        // Check for bankruptcy after building hotel
        await checkBankruptcy(gameState, roomId);
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error building hotel:', error);
        socket.emit('error', { message: 'Failed to build hotel' });
      }
    });

    socket.on('build-house', async ({ roomId, playerId, propertyId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer) return;

        const property = gameState.properties.find(p => p.id === propertyId);
        if (!property || property.ownerId !== playerId || property.type !== 'PROPERTY') {
          socket.emit('error', { message: 'You do not own this property!' });
          return;
        }

        if (property.houses >= 4) {
          socket.emit('error', { message: 'Maximum houses reached. Build a hotel instead!' });
          return;
        }

        if (property.hasHotel) {
          socket.emit('error', { message: 'This property already has a hotel!' });
          return;
        }

        const houseCost = 50; // Standard house cost
        if (currentPlayer.cash < houseCost) {
          socket.emit('error', { message: 'Not enough money to build a house!' });
          return;
        }

        // Check if player owns all properties in the color group
        const colorGroupProperties = gameState.properties.filter(p => 
          p.colorGroup === property.colorGroup && p.type === 'PROPERTY'
        );
        const ownsAllInGroup = colorGroupProperties.every(p => p.ownerId === playerId);
        
        if (!ownsAllInGroup) {
          socket.emit('error', { message: 'You must own all properties in this color group!' });
          return;
        }

        // Check if building is even (must build evenly across color group)
        const minHousesInGroup = Math.min(...colorGroupProperties.map(p => p.houses));
        if (property.houses > minHousesInGroup) {
          socket.emit('error', { message: 'Build houses evenly across all properties in the color group!' });
          return;
        }

        currentPlayer.cash -= houseCost;
        property.houses += 1;

        await db.player.update({
          where: { id: playerId },
          data: { cash: currentPlayer.cash },
        });

        await db.property.update({
          where: { id: propertyId },
          data: { houses: property.houses },
        });

        await db.transaction.create({
          data: {
            type: TransactionType.BUILD_HOUSE,
            amount: houseCost,
            fromPlayer: playerId,
            description: `Built house on ${property.name}`,
            gameId: roomId,
            playerId,
          },
        });

        gameState.gameMessage = `${currentPlayer.name} built a house on ${property.name} for $${houseCost}!`;
        
        // Check for bankruptcy after building house
        await checkBankruptcy(gameState, roomId);
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error building house:', error);
        socket.emit('error', { message: 'Failed to build house' });
      }
    });

    socket.on('pay-bail', async ({ roomId, playerId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.currentPlayerTurn !== playerId) {
          socket.emit('error', { message: 'Not your turn!' });
          return;
        }

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer || !currentPlayer.inJail) {
          socket.emit('error', { message: 'You are not in jail!' });
          return;
        }

        const bailAmount = 50;
        if (currentPlayer.cash < bailAmount) {
          socket.emit('error', { message: 'Not enough money to pay bail!' });
          return;
        }

        currentPlayer.cash -= bailAmount;
        currentPlayer.inJail = false;
        currentPlayer.jailTurns = 0;

        await db.player.update({
          where: { id: playerId },
          data: { 
            cash: currentPlayer.cash,
            inJail: false,
            jailTurns: 0,
          },
        });

        await db.transaction.create({
          data: {
            type: TransactionType.JAIL_FINE,
            amount: bailAmount,
            fromPlayer: playerId,
            description: 'Paid bail to get out of jail',
            gameId: roomId,
            playerId,
          },
        });

        gameState.gameMessage = `${currentPlayer.name} paid $${bailAmount} bail and got out of jail!`;
        gameState.diceRolled = false; // Allow player to roll dice
        
        // Check for bankruptcy after bail payment
        await checkBankruptcy(gameState, roomId);
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error paying bail:', error);
        socket.emit('error', { message: 'Failed to pay bail' });
      }
    });

    socket.on('use-get-out-of-jail-card', async ({ roomId, playerId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.currentPlayerTurn !== playerId) {
          socket.emit('error', { message: 'Not your turn!' });
          return;
        }

        const currentPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!currentPlayer || !currentPlayer.inJail) {
          socket.emit('error', { message: 'You are not in jail!' });
          return;
        }

        if (currentPlayer.getOutOfJailFreeCards <= 0) {
          socket.emit('error', { message: 'You do not have any Get Out of Jail Free cards!' });
          return;
        }

        currentPlayer.getOutOfJailFreeCards -= 1;
        currentPlayer.inJail = false;
        currentPlayer.jailTurns = 0;

        await db.player.update({
          where: { id: playerId },
          data: { 
            getOutOfJailFreeCards: currentPlayer.getOutOfJailFreeCards,
            inJail: false,
            jailTurns: 0,
          },
        });

        await db.transaction.create({
          data: {
            type: TransactionType.CHANCE_CARD,
            amount: 0,
            description: 'Used Get Out of Jail Free card',
            gameId: roomId,
            playerId,
          },
        });

        gameState.gameMessage = `${currentPlayer.name} used a Get Out of Jail Free card!`;
        gameState.diceRolled = false; // Allow player to roll dice
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error using Get Out of Jail Free card:', error);
        socket.emit('error', { message: 'Failed to use card' });
      }
    });

    socket.on('propose-trade', async ({ roomId, playerId, toPlayerId, offeredProperties, offeredCash, requestedProperties, requestedCash }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const fromPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
        const toPlayer = gameState.gameRoom.players.find(p => p.id === toPlayerId);
        
        if (!fromPlayer || !toPlayer) {
          socket.emit('error', { message: 'Player not found!' });
          return;
        }

        if (fromPlayer.isBankrupt || toPlayer.isBankrupt) {
          socket.emit('error', { message: 'Cannot trade with bankrupt players!' });
          return;
        }

        if (fromPlayer.cash < offeredCash) {
          socket.emit('error', { message: 'You do not have enough cash for this trade!' });
          return;
        }

        if (toPlayer.cash < requestedCash) {
          socket.emit('error', { message: 'Other player does not have enough cash for this trade!' });
          return;
        }

        // Verify offered properties belong to fromPlayer
        for (const propertyId of offeredProperties) {
          const property = gameState.properties.find(p => p.id === propertyId);
          if (!property || property.ownerId !== playerId) {
            socket.emit('error', { message: 'You do not own all offered properties!' });
            return;
          }
        }

        // Verify requested properties belong to toPlayer
        for (const propertyId of requestedProperties) {
          const property = gameState.properties.find(p => p.id === propertyId);
          if (!property || property.ownerId !== toPlayerId) {
            socket.emit('error', { message: 'Other player does not own all requested properties!' });
            return;
          }
        }

        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tradeProposal: TradeProposal = {
          id: tradeId,
          fromPlayerId: playerId,
          toPlayerId,
          offeredProperties,
          offeredCash,
          requestedProperties,
          requestedCash,
          status: 'PENDING',
          createdAt: new Date(),
        };

        tradeProposals.set(tradeId, tradeProposal);

        // Notify both players about the trade proposal
        io.to(playerId).emit('trade-proposed', { tradeProposal, fromPlayer: fromPlayer.name, toPlayer: toPlayer.name });
        io.to(toPlayerId).emit('trade-proposed', { tradeProposal, fromPlayer: fromPlayer.name, toPlayer: toPlayer.name });

        gameState.gameMessage = `${fromPlayer.name} proposed a trade to ${toPlayer.name}!`;
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error proposing trade:', error);
        socket.emit('error', { message: 'Failed to propose trade' });
      }
    });

    socket.on('respond-to-trade', async ({ roomId, playerId, tradeId, accept }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const tradeProposal = tradeProposals.get(tradeId);
        if (!tradeProposal || tradeProposal.status !== 'PENDING') {
          socket.emit('error', { message: 'Trade proposal not found or already resolved!' });
          return;
        }

        if (tradeProposal.toPlayerId !== playerId) {
          socket.emit('error', { message: 'You are not the recipient of this trade!' });
          return;
        }

        const fromPlayer = gameState.gameRoom.players.find(p => p.id === tradeProposal.fromPlayerId);
        const toPlayer = gameState.gameRoom.players.find(p => p.id === tradeProposal.toPlayerId);
        
        if (!fromPlayer || !toPlayer) {
          socket.emit('error', { message: 'Players not found!' });
          return;
        }

        if (accept) {
          // Verify trade is still valid
          if (fromPlayer.cash < tradeProposal.offeredCash || toPlayer.cash < tradeProposal.requestedCash) {
            socket.emit('error', { message: 'Trade is no longer valid due to insufficient funds!' });
            tradeProposal.status = 'CANCELLED';
            tradeProposals.set(tradeId, tradeProposal);
            return;
          }

          // Execute the trade
          // Transfer cash
          fromPlayer.cash -= tradeProposal.offeredCash;
          toPlayer.cash += tradeProposal.offeredCash;
          toPlayer.cash -= tradeProposal.requestedCash;
          fromPlayer.cash += tradeProposal.requestedCash;

          // Transfer properties
          for (const propertyId of tradeProposal.offeredProperties) {
            const property = gameState.properties.find(p => p.id === propertyId);
            if (property) {
              property.ownerId = tradeProposal.toPlayerId;
              await db.property.update({
                where: { id: propertyId },
                data: { ownerId: tradeProposal.toPlayerId },
              });
            }
          }

          for (const propertyId of tradeProposal.requestedProperties) {
            const property = gameState.properties.find(p => p.id === propertyId);
            if (property) {
              property.ownerId = tradeProposal.fromPlayerId;
              await db.property.update({
                where: { id: propertyId },
                data: { ownerId: tradeProposal.fromPlayerId },
              });
            }
          }

          // Update player cash in database
          await db.player.update({
            where: { id: tradeProposal.fromPlayerId },
            data: { cash: fromPlayer.cash },
          });

          await db.player.update({
            where: { id: tradeProposal.toPlayerId },
            data: { cash: toPlayer.cash },
          });

          // Record transactions
          await db.transaction.create({
            data: {
              type: TransactionType.BUY_PROPERTY, // Using this as a general trade transaction
              amount: tradeProposal.offeredCash,
              fromPlayer: tradeProposal.fromPlayerId,
              toPlayer: tradeProposal.toPlayerId,
              description: `Trade: ${fromPlayer.name} to ${toPlayer.name}`,
              gameId: roomId,
              playerId: tradeProposal.fromPlayerId,
            },
          });

          tradeProposal.status = 'ACCEPTED';
          gameState.gameMessage = `${toPlayer.name} accepted the trade from ${fromPlayer.name}!`;
        } else {
          tradeProposal.status = 'REJECTED';
          gameState.gameMessage = `${toPlayer.name} rejected the trade from ${fromPlayer.name}!`;
        }

        tradeProposals.set(tradeId, tradeProposal);
        
        // Notify both players about the trade result
        io.to(tradeProposal.fromPlayerId).emit('trade-resolved', { tradeProposal, accepted: accept });
        io.to(tradeProposal.toPlayerId).emit('trade-resolved', { tradeProposal, accepted: accept });
        
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

        // Remove old trade proposals after some time
        setTimeout(() => {
          tradeProposals.delete(tradeId);
        }, 60000); // Keep for 1 minute

      } catch (error) {
        console.error('Error responding to trade:', error);
        socket.emit('error', { message: 'Failed to respond to trade' });
      }
    });

    socket.on('cancel-trade', async ({ roomId, playerId, tradeId }) => {
      try {
        const tradeProposal = tradeProposals.get(tradeId);
        if (!tradeProposal || tradeProposal.status !== 'PENDING') {
          socket.emit('error', { message: 'Trade proposal not found or already resolved!' });
          return;
        }

        if (tradeProposal.fromPlayerId !== playerId) {
          socket.emit('error', { message: 'You did not propose this trade!' });
          return;
        }

        tradeProposal.status = 'CANCELLED';
        tradeProposals.set(tradeId, tradeProposal);

        const gameState = gameRooms.get(roomId);
        if (gameState) {
          const fromPlayer = gameState.gameRoom.players.find(p => p.id === playerId);
          const toPlayer = gameState.gameRoom.players.find(p => p.id === tradeProposal.toPlayerId);
          
          if (fromPlayer && toPlayer) {
            gameState.gameMessage = `${fromPlayer.name} cancelled the trade with ${toPlayer.name}!`;
            gameRooms.set(roomId, gameState);
            io.to(roomId).emit('room-updated', gameState);
          }
        }

        // Notify both players about the cancellation
        io.to(tradeProposal.fromPlayerId).emit('trade-cancelled', { tradeProposal });
        io.to(tradeProposal.toPlayerId).emit('trade-cancelled', { tradeProposal });

        // Remove the trade proposal
        tradeProposals.delete(tradeId);

      } catch (error) {
        console.error('Error cancelling trade:', error);
        socket.emit('error', { message: 'Failed to cancel trade' });
      }
    });

    socket.on('propose-game-end', async ({ roomId, playerId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.gameRoom.hostId !== playerId) {
          socket.emit('error', { message: 'Only the host can propose to end the game!' });
          return;
        }

        if (gameState.gameRoom.status === 'FINISHED') {
          socket.emit('error', { message: 'Game is already finished!' });
          return;
        }

        // Notify all players about the end game proposal
        io.to(roomId).emit('game-end-proposed', { 
          proposedBy: playerId, 
          playerName: gameState.gameRoom.players.find(p => p.id === playerId)?.name 
        });

        gameState.gameMessage = `${gameState.gameRoom.players.find(p => p.id === playerId)?.name} proposed to end the game. Waiting for player responses...`;
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error proposing game end:', error);
        socket.emit('error', { message: 'Failed to propose game end' });
      }
    });

    socket.on('vote-game-end', async ({ roomId, playerId, agree }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        if (gameState.gameRoom.status === 'FINISHED') {
          socket.emit('error', { message: 'Game is already finished!' });
          return;
        }

        // This is a simplified version - in a real implementation,
        // you'd track individual votes and only end when majority agrees
        if (agree && gameState.gameRoom.hostId === playerId) {
          // Host can end the game immediately
          gameState.gameRoom.status = 'FINISHED';
          
          await db.gameRoom.update({
            where: { id: roomId },
            data: { status: 'FINISHED' },
          });

          // Calculate scores for all active players
          const activePlayers = gameState.gameRoom.players.filter(p => !p.isBankrupt);
          const playerScores = activePlayers.map(player => {
            const playerProperties = gameState.properties.filter(p => p.ownerId === player.id);
            const propertyValues = playerProperties.reduce((total, property) => {
              return total + (property.price || 0) + (property.houses * 50) + (property.hasHotel ? 100 : 0);
            }, 0);
            
            return {
              player,
              totalAssets: player.cash + propertyValues,
              cash: player.cash,
              propertyValues
            };
          });

          // Sort by total assets
          playerScores.sort((a, b) => b.totalAssets - a.totalAssets);
          
          const winner = playerScores[0];
          gameState.gameMessage = `🎉 Game ended by host. ${winner.player.name} wins with $${winner.totalAssets.toLocaleString()} total assets!`;
          
          // Send detailed results to all players
          io.to(roomId).emit('game-ended', { 
            winner: winner.player.name,
            scores: playerScores.map(score => ({
              name: score.player.name,
              totalAssets: score.totalAssets,
              cash: score.cash,
              propertyValues: score.propertyValues
            }))
          });
        }

        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error voting on game end:', error);
        socket.emit('error', { message: 'Failed to vote on game end' });
      }
    });

    // Chat functionality
    socket.on('send-chat-message', async ({ roomId, message }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        // Verify player is in the game
        const player = gameState.gameRoom.players.find(p => p.id === message.playerId);
        if (!player) {
          socket.emit('error', { message: 'Player not found in game!' });
          return;
        }

        // Broadcast message to all players in the room
        io.to(roomId).emit('chat-message', message);

        // Optional: Store chat messages in database if needed
        // await db.chatMessage.create({
        //   data: {
        //     gameId: roomId,
        //     playerId: message.playerId,
        //     message: message.message,
        //   },
        // });

      } catch (error) {
        console.error('Error sending chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('get-chat-history', async ({ roomId }) => {
      try {
        // For now, we'll send empty history as we're not storing messages
        // In a real implementation, you'd fetch from database
        socket.emit('chat-history', []);
      } catch (error) {
        console.error('Error getting chat history:', error);
      }
    });

    // Auction functionality
    socket.on('start-auction', async ({ roomId, playerId, propertyId }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const property = gameState.properties.find(p => p.id === propertyId);
        if (!property || property.ownerId) {
          socket.emit('error', { message: 'Property not available for auction!' });
          return;
        }

        if (gameState.gameRoom.hostId !== playerId) {
          socket.emit('error', { message: 'Only host can start auctions!' });
          return;
        }

        const auctionId = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const auction: Auction = {
          id: auctionId,
          propertyId,
          propertyName: property.name,
          startingBid: Math.floor((property.price || 100) * 0.5), // Start at 50% of property price
          currentBid: Math.floor((property.price || 100) * 0.5),
          currentWinner: null,
          startTime: new Date(),
          endTime: new Date(Date.now() + 30000), // 30 seconds auction
          participants: [],
          status: 'ACTIVE',
        };

        activeAuctions.set(auctionId, auction);

        // Notify all players about the auction
        io.to(roomId).emit('auction-started', { auction });

        gameState.gameMessage = `Auction started for ${property.name}! Starting bid: $${auction.startingBid}`;
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

        // Set auction timeout
        setTimeout(async () => {
          const currentAuction = activeAuctions.get(auctionId);
          if (currentAuction && currentAuction.status === 'ACTIVE') {
            await endAuction(roomId, auctionId, io);
          }
        }, 30000);

      } catch (error) {
        console.error('Error starting auction:', error);
        socket.emit('error', { message: 'Failed to start auction' });
      }
    });

    socket.on('place-bid', async ({ roomId, playerId, auctionId, bidAmount }) => {
      try {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const auction = activeAuctions.get(auctionId);
        if (!auction || auction.status !== 'ACTIVE') {
          socket.emit('error', { message: 'Auction not found or already ended!' });
          return;
        }

        const player = gameState.gameRoom.players.find(p => p.id === playerId);
        if (!player || player.isBankrupt) {
          socket.emit('error', { message: 'Player not found or bankrupt!' });
          return;
        }

        if (player.cash < bidAmount) {
          socket.emit('error', { message: 'Not enough money to place this bid!' });
          return;
        }

        if (bidAmount <= auction.currentBid) {
          socket.emit('error', { message: 'Bid must be higher than current bid!' });
          return;
        }

        // Update auction
        auction.currentBid = bidAmount;
        auction.currentWinner = playerId;
        if (!auction.participants.includes(playerId)) {
          auction.participants.push(playerId);
        }

        activeAuctions.set(auctionId, auction);

        // Notify all players about the bid
        io.to(roomId).emit('bid-placed', { 
          auction, 
          playerName: player.name,
          bidAmount 
        });

        gameState.gameMessage = `${player.name} bid $${bidAmount} for ${auction.propertyName}!`;
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('room-updated', gameState);

      } catch (error) {
        console.error('Error placing bid:', error);
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

async function endAuction(roomId: string, auctionId: string, io: Server) {
  try {
    const gameState = gameRooms.get(roomId);
    const auction = activeAuctions.get(auctionId);
    
    if (!gameState || !auction) return;

    auction.status = 'ENDED';
    activeAuctions.set(auctionId, auction);

    if (auction.currentWinner) {
      // Award property to winner
      const winner = gameState.gameRoom.players.find(p => p.id === auction.currentWinner);
      const property = gameState.properties.find(p => p.id === auction.propertyId);

      if (winner && property) {
        winner.cash -= auction.currentBid;
        property.ownerId = winner.id;

        await db.player.update({
          where: { id: winner.id },
          data: { cash: winner.cash },
        });

        await db.property.update({
          where: { id: property.id },
          data: { ownerId: winner.id },
        });

        await db.transaction.create({
          data: {
            type: TransactionType.BUY_PROPERTY,
            amount: auction.currentBid,
            fromPlayer: winner.id,
            description: `Won auction for ${property.name}`,
            gameId: roomId,
            playerId: winner.id,
          },
        });

        gameState.gameMessage = `🎉 ${winner.name} won the auction for ${property.name} with a bid of $${auction.currentBid}!`;
      }
    } else {
      gameState.gameMessage = `Auction for ${auction.propertyName} ended with no bids.`;
    }

    // Notify all players about auction end
    io.to(roomId).emit('auction-ended', { auction });

    gameRooms.set(roomId, gameState);
    io.to(roomId).emit('room-updated', gameState);

    // Remove auction after some time
    setTimeout(() => {
      activeAuctions.delete(auctionId);
    }, 60000);

  } catch (error) {
    console.error('Error ending auction:', error);
  }
}