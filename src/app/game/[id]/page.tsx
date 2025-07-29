'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Play, Settings, DollarSign, Home, AlertTriangle, Dice1 as Dice } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import MonopolyBoard from '@/components/MonopolyBoard';
import PropertyCard, { PropertyModal } from '@/components/PropertyCard';
import TransactionHistory from '@/components/TransactionHistory';
import ChatBox from '@/components/ChatBox';
import AuctionComponent from '@/components/Auction';
import { Player, GameRoom, Property, Auction, GameState } from '@/types/game';

export default function GameRoom() {
  const params = useParams();
  const roomId = params.id as string;
  const [searchParams] = useState(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));
  const playerId = searchParams.get('playerId') || '';
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
  const [showAuction, setShowAuction] = useState(false);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socketio',
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', { roomId, playerId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('room-updated', (data: GameState) => {
      setGameState(data);
      
      const player = data.gameRoom.players.find(p => p.id === playerId);
      setCurrentPlayer(player || null);
      
      setGameStarted(data.gameRoom.status === 'PLAYING');
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    newSocket.on('auction-started', (data: { auction: Auction }) => {
      setCurrentAuction(data.auction);
      setShowAuction(true);
    });

    newSocket.on('bid-placed', (data: { auction: Auction; playerName: string; bidAmount: number }) => {
      setCurrentAuction(data.auction);
    });

    newSocket.on('auction-ended', (data: { auction: Auction }) => {
      setCurrentAuction(data.auction);
      setTimeout(() => {
        setShowAuction(false);
        setCurrentAuction(null);
      }, 5000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId, playerId]);

  const startGame = async () => {
    if (!gameState || gameState.gameRoom.hostId !== playerId) return;

    try {
      const response = await fetch('/api/game-rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      if (response.ok) {
        setShowStartDialog(false);
        if (socket) {
          socket.emit('game-started', { roomId });
        }
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const toggleReady = () => {
    if (socket && currentPlayer) {
      socket.emit('player-ready', { roomId, playerId, isReady: !currentPlayer.isReady });
    }
  };

  const rollDice = () => {
    if (socket) {
      socket.emit('roll-dice', { roomId, playerId });
    }
  };

  const buyProperty = () => {
    if (socket && currentProperty) {
      socket.emit('buy-property', { roomId, playerId, propertyId: currentProperty.id });
      setShowBuyDialog(false);
      setCurrentProperty(null);
    }
  };

  const endTurn = () => {
    if (socket) {
      socket.emit('end-turn', { roomId, playerId });
    }
  };

  const buildHouse = () => {
    if (socket && currentProperty) {
      socket.emit('build-house', { roomId, playerId, propertyId: currentProperty.id });
      setShowPropertyModal(false);
    }
  };

  const buildHotel = () => {
    if (socket && currentProperty) {
      socket.emit('build-hotel', { roomId, playerId, propertyId: currentProperty.id });
      setShowPropertyModal(false);
    }
  };

  const payBail = () => {
    if (socket) {
      socket.emit('pay-bail', { roomId, playerId });
    }
  };

  const useGetOutOfJailCard = () => {
    if (socket) {
      socket.emit('use-get-out-of-jail-card', { roomId, playerId });
    }
  };

  const startAuction = (propertyId: string) => {
    if (socket && gameState && gameState.gameRoom.hostId === playerId) {
      socket.emit('start-auction', { roomId, playerId, propertyId });
    }
  };

  const viewProperty = (property: Property) => {
    setCurrentProperty(property);
    setShowPropertyModal(true);
  };

  const canStartGame = gameState && 
    gameState.gameRoom.hostId === playerId && 
    gameState.gameRoom.players.length >= 2 && 
    gameState.gameRoom.players.every(p => p.isReady);

  const isMyTurn = gameState && currentPlayer && 
    gameState.currentPlayerTurn === currentPlayer.id && 
    !currentPlayer.isBankrupt;

  const canRollDice = isMyTurn && !gameState?.diceRolled;
  const canBuyProperty = isMyTurn && gameState?.diceRolled && currentProperty && 
    !currentProperty.ownerId && currentProperty.price && currentPlayer?.cash >= currentProperty.price;
  const canEndTurn = isMyTurn && gameState?.diceRolled && !currentPlayer?.inJail;
  const canPayBail = isMyTurn && currentPlayer?.inJail && currentPlayer?.cash >= 50;
  const canUseJailCard = isMyTurn && currentPlayer?.inJail && currentPlayer?.getOutOfJailFreeCards > 0;

  const landedProperty = gameState?.diceRolled && currentPlayer
    ? gameState.properties.find(p => p.position === currentPlayer.position)
    : null;

  useEffect(() => {
    if (landedProperty && landedProperty.type === 'PROPERTY' && !landedProperty.ownerId && landedProperty.price) {
      setCurrentProperty(landedProperty);
      setShowBuyDialog(true);
    }
  }, [landedProperty]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{gameState.gameRoom.name}</h1>
            <p className="text-gray-300">
              {gameState.gameRoom.boardSize} tiles • {gameState.gameRoom.players.length}/{gameState.gameRoom.maxPlayers} players
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant={gameState.gameRoom.status === 'WAITING' ? 'default' : 'secondary'}>
              {gameState.gameRoom.status}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 border-red-500 bg-red-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!gameStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Players ({gameState.gameRoom.players.length}/{gameState.gameRoom.maxPlayers})
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Waiting for players to get ready
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gameState.gameRoom.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${player.color}`} />
                          <div>
                            <div className="text-white font-medium">
                              {player.name}
                              {player.id === playerId && ' (You)'}
                              {player.id === gameState.gameRoom.hostId && ' 👑'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {player.isReady ? 'Ready' : 'Not ready'}
                            </div>
                          </div>
                        </div>
                        <Badge variant={player.isReady ? 'default' : 'secondary'}>
                          {player.isReady ? 'Ready' : 'Waiting'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Your Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${currentPlayer?.color}`} />
                      <div>
                        <div className="text-white font-medium">{currentPlayer?.name}</div>
                        <div className="text-sm text-gray-400">
                          {currentPlayer?.isReady ? 'Ready to play' : 'Not ready'}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={toggleReady}
                      className={`w-full ${currentPlayer?.isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {currentPlayer?.isReady ? 'Cancel Ready' : 'Ready to Play'}
                    </Button>

                    {canStartGame && (
                      <Button
                        onClick={() => setShowStartDialog(true)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Game
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Game Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Board Size:</span>
                      <span className="text-white">{gameState.gameRoom.boardSize} tiles</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Max Players:</span>
                      <span className="text-white">{gameState.gameRoom.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Starting Cash:</span>
                      <span className="text-white">$1,500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game Message */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="text-center text-white font-medium">
                  {gameState.gameMessage}
                </div>
              </CardContent>
            </Card>

            {/* Game Board */}
            <div className="flex justify-center">
              <MonopolyBoard
                boardSize={gameState.gameRoom.boardSize}
                properties={gameState.properties}
                players={gameState.gameRoom.players}
                currentPlayerTurn={gameState.currentPlayerTurn}
              />
            </div>

            {/* Game Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Player Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${currentPlayer?.color}`} />
                    {currentPlayer?.name}
                    {isMyTurn && ' (Your Turn)'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Cash:</span>
                      <span className="text-white font-medium">${currentPlayer?.cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Position:</span>
                      <span className="text-white font-medium">{currentPlayer?.position}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status:</span>
                      <div className="flex items-center gap-1">
                        {currentPlayer?.inJail && <span className="text-yellow-500">🔒 In Jail</span>}
                        {currentPlayer?.isBankrupt && <span className="text-red-500">💀 Bankrupt</span>}
                        {!currentPlayer?.inJail && !currentPlayer?.isBankrupt && (
                          <span className="text-green-500">✓ Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Actions */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gameState.diceRolled && (
                      <div className="text-center">
                        <div className="text-white mb-2">Last Roll:</div>
                        <div className="flex justify-center gap-2">
                          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold">
                            {gameState.lastDiceRoll[0]}
                          </div>
                          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold">
                            {gameState.lastDiceRoll[1]}
                          </div>
                        </div>
                        <div className="text-white mt-1">
                          Total: {gameState.lastDiceRoll[0] + gameState.lastDiceRoll[1]}
                        </div>
                      </div>
                    )}
                    
                    {currentPlayer?.inJail && (
                      <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3">
                        <div className="text-yellow-200 text-sm font-medium mb-2">
                          🔒 You are in jail! ({currentPlayer.jailTurns}/3 attempts)
                        </div>
                        <div className="space-y-2">
                          {canRollDice && (
                            <Button
                              onClick={rollDice}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <Dice className="w-4 h-4 mr-2" />
                              Roll for Doubles
                            </Button>
                          )}
                          {canPayBail && (
                            <Button
                              onClick={payBail}
                              className="w-full bg-yellow-600 hover:bg-yellow-700"
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Pay $50 Bail
                            </Button>
                          )}
                          {canUseJailCard && (
                            <Button
                              onClick={useGetOutOfJailCard}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              🎫 Use Jail Free Card
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {canRollDice && !currentPlayer?.inJail && (
                      <Button
                        onClick={rollDice}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Dice className="w-4 h-4 mr-2" />
                        Roll Dice
                      </Button>
                    )}
                    
                    {canEndTurn && (
                      <Button
                        onClick={endTurn}
                        className="w-full bg-gray-600 hover:bg-gray-700"
                      >
                        End Turn
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Players List */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameState.gameRoom.players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          player.id === gameState.currentPlayerTurn
                            ? 'bg-slate-600'
                            : 'bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${player.color}`} />
                          <span className="text-white text-sm">
                            {player.name}
                            {player.id === playerId && ' (You)'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          ${player.cash}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Start Game</DialogTitle>
              <DialogDescription>
                Are you sure you want to start the game? All players must be ready.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button onClick={() => setShowStartDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={startGame} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Start Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Buy Property</DialogTitle>
              <DialogDescription>
                {currentProperty && (
                  <>
                    Do you want to buy {currentProperty.name} for ${currentProperty.price}?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {currentProperty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <div className="text-white">${currentProperty.price}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Rent:</span>
                    <div className="text-white">${currentProperty.rent}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Color Group:</span>
                    <div className="text-white">{currentProperty.colorGroup || 'None'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Your Cash:</span>
                    <div className="text-white">${currentPlayer?.cash.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowBuyDialog(false)} variant="outline" className="flex-1">
                    Don't Buy
                  </Button>
                  {gameState?.gameRoom.hostId === playerId && (
                    <Button 
                      onClick={() => {
                        startAuction(currentProperty.id);
                        setShowBuyDialog(false);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Start Auction
                    </Button>
                  )}
                  <Button 
                    onClick={buyProperty} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!canBuyProperty}
                  >
                    Buy Property
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction History */}
      <TransactionHistory 
        roomId={roomId}
        isVisible={showTransactionHistory}
        onToggle={() => setShowTransactionHistory(!showTransactionHistory)}
      />

      {/* Chat Box */}
      <ChatBox
        roomId={roomId}
        socket={socket}
        currentPlayerId={playerId}
        isVisible={showChat}
        onToggle={() => setShowChat(!showChat)}
        players={gameState?.gameRoom.players || []}
      />

      {/* Auction */}
      {showAuction && currentAuction && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <AuctionComponent
            auction={currentAuction}
            socket={socket}
            currentPlayerId={playerId}
            roomId={roomId}
            players={gameState?.gameRoom.players || []}
            onAuctionEnd={() => {
              setTimeout(() => {
                setShowAuction(false);
                setCurrentAuction(null);
              }, 3000);
            }}
          />
        </div>
      )}
    </div>
  );
}