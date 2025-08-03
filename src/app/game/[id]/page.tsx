'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Play, DollarSign, Dice1 as Dice, Building, Home, ArrowRightLeft } from 'lucide-react';
import { useGameSocket } from '@/hooks/useGameSocket';
import MonopolyBoard from '@/components/MonopolyBoard';
import CardModal from '@/components/CardModal';
import PropertyManagementModal from '@/components/PropertyManagementModal';
import TradingModal from '@/components/TradingModal';
import TransactionHistory from '@/components/TransactionHistory';
import ChatBox from '@/components/ChatBox';
import Auction from '@/components/Auction';
import TradeProposalModal from '@/components/TradeProposalModal';
import { Toaster } from '@/components/ui/toaster';
import { getRandomCard, findNearestRailroad, findNearestUtility } from '@/lib/cards';
import type { Card as GameCard } from '@/lib/cards';

export default function GameRoom() {
  const params = useParams();
  const roomId = params.id as string;
  const [playerId, setPlayerId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showPropertyManagement, setShowPropertyManagement] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const playerIdFromUrl = searchParams.get('playerId') || '';
      setPlayerId(playerIdFromUrl);
    }
  }, []);

  const {
    gameState,
    isConnected,
    error,
    currentPlayer,
    isMyTurn,
    canRollDice,
    canEndTurn,
    currentTradeProposal,
    clearTradeProposal,
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
  } = useGameSocket(roomId, playerId);

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
      }
    } catch (error) {
      console.warn('Error starting game:', error);
    }
  };

  const toggleReady = () => {
    if (currentPlayer) {
      setPlayerReady(!currentPlayer.isReady);
    }
  };

  const handleBuyProperty = () => {
    const landedProperty = gameState?.diceRolled && currentPlayer
      ? gameState.properties.find(p => p.position === currentPlayer.position)
      : null;
    
    if (landedProperty) {
      buyProperty(landedProperty.id);
      setShowBuyDialog(false);
    }
  };

  const handleTileAction = () => {
    if (!currentPlayer || !gameState?.diceRolled) return;

    const landedProperty = gameState.properties.find(p => p.position === currentPlayer.position);
    
    if (landedProperty) {
      if (landedProperty.type === 'CHANCE') {
        const card = getRandomCard('CHANCE');
        setCurrentCard(card);
        setShowCardModal(true);
      } else if (landedProperty.type === 'COMMUNITY_CHEST') {
        const card = getRandomCard('COMMUNITY_CHEST');
        setCurrentCard(card);
        setShowCardModal(true);
      } else if (landedProperty.type === 'TAX') {
        const taxValue = landedProperty.name.includes('Income') ? 200 : 75;
        setTaxAmount(taxValue);
        setShowTaxDialog(true);
      }
    }
  };

  const executeCardAction = () => {
    if (!currentCard || !currentPlayer) return;

    const action = currentCard.action;
    
    switch (action.type) {
      case 'MOVE_TO':
        if (action.position !== undefined) {
        }
        break;
      case 'MOVE_BACK':
        if (action.value) {
        }
        break;
      case 'COLLECT':
        if (action.value) {
        }
        break;
      case 'PAY':
        if (action.value) {
        }
        break;
      case 'JAIL':
        break;
      case 'GET_OUT_OF_JAIL':
        break;
      case 'STREET_REPAIRS':
        if (action.perHouse && action.perHotel) {
          const myProperties = gameState?.properties.filter(p => p.ownerId === playerId) || [];
          const totalHouses = myProperties.reduce((sum, p) => sum + p.houses, 0);
          const totalHotels = myProperties.filter(p => p.hasHotel).length;
          const repairCost = (totalHouses * action.perHouse) + (totalHotels * action.perHotel);
        }
        break;
      case 'PROPERTY_TAX':
        if (action.value) {
          const otherPlayers = gameState?.gameRoom.players.filter(p => p.id !== playerId) || [];
          const totalTax = otherPlayers.length * Math.abs(action.value);
        }
        break;
    }
  };

  const payTax = () => {
    setShowTaxDialog(false);
  };

  const handleAcceptTrade = (tradeId: string) => {
    respondToTrade(tradeId, true);
    clearTradeProposal();
  };

  const handleRejectTrade = (tradeId: string) => {
    respondToTrade(tradeId, false);
    clearTradeProposal();
  };

  const handleCounterTrade = (tradeId: string) => {
    // For now, just close the modal and open the trading modal
    clearTradeProposal();
    setShowTradingModal(true);
  };

  const canStartGame = gameState && 
    gameState.gameRoom.hostId === playerId && 
    gameState.gameRoom.players.length >= 2 && 
    gameState.gameRoom.players.every(p => p.isReady);

  const gameStarted = gameState?.gameRoom.status === 'PLAYING';

  const landedProperty = gameState?.diceRolled && currentPlayer
    ? gameState.properties.find(p => p.position === currentPlayer.position)
    : null;

  const canBuyProperty = isMyTurn && gameState?.diceRolled && landedProperty && 
    !landedProperty.ownerId && landedProperty.price && (currentPlayer?.cash || 0) >= landedProperty.price;

  const canPayBail = isMyTurn && currentPlayer?.inJail && (currentPlayer?.cash || 0) >= 50;
  const canUseJailCard = isMyTurn && currentPlayer?.inJail && (currentPlayer?.getOutOfJailFreeCards || 0) > 0;

  useEffect(() => {
    if (landedProperty && landedProperty.type === 'PROPERTY' && !landedProperty.ownerId && landedProperty.price) {
      setShowBuyDialog(true);
    }
  }, [landedProperty]);

  if (!isClient || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Loading game room...</div>
          {isClient && !roomId && <div className="text-red-400">Error: No room ID provided</div>}
          {isClient && !playerId && <div className="text-red-400">Error: No player ID provided</div>}
          {isClient && roomId && playerId && !isConnected && (
            <div className="text-yellow-400">Connecting to server...</div>
          )}
        </div>
      </div>
    );
  }

  if (!currentPlayer && gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md">
          <div className="text-white text-xl mb-4">Player not found in room</div>
          <div className="text-gray-400 mb-6">
            You may not be properly joined to this game room.
            <br />
            Please return to the lobby and rejoin the room properly.
          </div>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium"
            >
              Return to Lobby
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
            >
              Refresh Page
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Room ID: {roomId}<br />
            Player ID: {playerId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex flex-col">
      <Toaster />
      <div className="max-w-7xl mx-auto flex-1 flex flex-col">
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
          <div className="h-[calc(100vh-8rem)] flex gap-2">
            {/* Left Stats Panel - Extreme Left */}
            <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
              {/* Game Status - Reduced */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-2">
                  <div className="text-center text-white font-medium text-xs">
                    {gameState.gameMessage}
                  </div>
                </CardContent>
              </Card>

              {/* Current Player Info - Reduced */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${currentPlayer?.color}`} />
                    {currentPlayer?.name}
                    {isMyTurn && <Badge className="bg-green-600 text-xs">Your Turn</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 text-xs">Cash</span>
                      <div className="text-white font-bold text-sm">${(currentPlayer?.cash || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Position</span>
                      <div className="text-white font-bold text-sm">{currentPlayer?.position || 0}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Status</span>
                    <div className="flex items-center gap-1">
                      {currentPlayer?.inJail && <Badge variant="secondary" className="bg-yellow-600 text-xs">🔒 Jail</Badge>}
                      {currentPlayer?.isBankrupt && <Badge variant="destructive" className="text-xs">💀</Badge>}
                      {!currentPlayer?.inJail && !currentPlayer?.isBankrupt && (
                        <Badge className="bg-green-600 text-xs">✓</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Jail Cards</span>
                    <div className="text-white font-medium text-xs">{currentPlayer?.getOutOfJailFreeCards || 0}</div>
                  </div>
                </CardContent>
              </Card>

              {/* All Players - Reduced */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">All Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameState.gameRoom.players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          player.id === gameState.currentPlayerTurn
                            ? 'bg-blue-600/20 border border-blue-500'
                            : 'bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${player.color}`} />
                          <div>
                            <div className="text-white font-medium text-xs">
                              {player.name}
                              {player.id === playerId && ' (You)'}
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              Pos: {player.position}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium text-xs">
                            ${player.cash.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {player.inJail && <span className="text-yellow-500">🔒</span>}
                            {player.isBankrupt && <span className="text-red-500">💀</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Property Management - Reduced */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">My Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {gameState.properties
                      .filter(prop => prop.ownerId === playerId)
                      .slice(0, 3)
                      .map((property) => (
                        <div
                          key={property.id}
                          className="flex items-center justify-between p-1 bg-slate-700 rounded text-xs"
                        >
                          <div>
                            <div className="text-white font-medium">{property.name}</div>
                            <div className="text-gray-400 text-[10px]">
                              {property.houses > 0 && `🏠${property.houses}`}
                              {property.hasHotel && `🏨`}
                              {property.isMortgaged && ' (M)'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-xs">${property.rent}</div>
                          </div>
                        </div>
                      ))}
                    {gameState.properties.filter(prop => prop.ownerId === playerId).length > 3 && (
                      <div className="text-gray-400 text-xs text-center">
                        +{gameState.properties.filter(prop => prop.ownerId === playerId).length - 3} more
                      </div>
                    )}
                    {gameState.properties.filter(prop => prop.ownerId === playerId).length === 0 && (
                      <div className="text-gray-400 text-xs text-center py-2">
                        No properties
                      </div>
                    )}
                  </div>
                  
                  {gameState.properties.filter(prop => prop.ownerId === playerId).length > 0 && (
                    <Button
                      onClick={() => setShowPropertyManagement(true)}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs"
                      size="sm"
                    >
                      <Building className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions - Reduced */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <Button
                      onClick={handleTileAction}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                      size="sm"
                      disabled={!isMyTurn || !gameState?.diceRolled}
                    >
                      Check Tile
                    </Button>
                    
                    <Button
                      onClick={() => setShowTradingModal(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-xs"
                      size="sm"
                      disabled={!isMyTurn}
                    >
                      <ArrowRightLeft className="w-3 h-3 mr-1" />
                      Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Chat & History - Reduced */}
              <div className="flex gap-1">
                <Button
                  onClick={() => setShowChat(!showChat)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
                  size="sm"
                >
                  💬
                </Button>
                <Button
                  onClick={() => setShowTransactionHistory(!showTransactionHistory)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs"
                  size="sm"
                >
                  📊
                </Button>
              </div>
            </div>

            {/* Right Board Area */}
            <div className="flex-1 flex items-center justify-center bg-slate-800/30 rounded-lg p-2">
              <MonopolyBoard
                properties={gameState.properties}
                players={gameState.gameRoom.players}
                currentPlayerTurn={gameState.currentPlayerTurn}
                gameState={gameState}
                currentPlayer={currentPlayer}
                canRollDice={canRollDice}
                canEndTurn={canEndTurn}
                canPayBail={canPayBail}
                canUseJailCard={canUseJailCard}
                rollDice={rollDice}
                endTurn={endTurn}
                payBail={payBail}
                useGetOutOfJailCard={useGetOutOfJailCard}
                onTileClick={() => {}}
              />
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
                {landedProperty && (
                  <>
                    Do you want to buy {landedProperty.name} for ${landedProperty.price}?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {landedProperty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <div className="text-white">${landedProperty.price}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Rent:</span>
                    <div className="text-white">${landedProperty.rent}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Color Group:</span>
                    <div className="text-white">{landedProperty.colorGroup || 'None'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Your Cash:</span>
                    <div className="text-white">${(currentPlayer?.cash || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowBuyDialog(false)} variant="outline" className="flex-1">
                    Don't Buy
                  </Button>
                  {gameState?.gameRoom.hostId === playerId && (
                    <Button 
                      onClick={() => {
                        startAuction(landedProperty.id);
                        setShowBuyDialog(false);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Start Auction
                    </Button>
                  )}
                  <Button 
                    onClick={handleBuyProperty} 
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

        <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Tax Payment Required</DialogTitle>
              <DialogDescription>
                You must pay ${taxAmount} in taxes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">${taxAmount}</div>
                <div className="text-gray-400">Tax Amount</div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Cash:</span>
                <span className="text-white">${(currentPlayer?.cash || 0).toLocaleString()}</span>
              </div>
              <Button 
                onClick={payTax} 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={(currentPlayer?.cash || 0) < taxAmount}
              >
                Pay Tax
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <CardModal
          isOpen={showCardModal}
          onCloseAction={() => setShowCardModal(false)}
          card={currentCard}
          onExecuteAction={executeCardAction}
        />

        <PropertyManagementModal
          isOpen={showPropertyManagement}
          onCloseAction={() => setShowPropertyManagement(false)}
          properties={gameState?.properties.filter(p => p.ownerId === playerId) || []}
          playerCash={currentPlayer?.cash || 0}
          onBuildHouseAction={(propertyId) => buildHouse(propertyId)}
          onBuildHotelAction={(propertyId) => buildHotel(propertyId)}
          onSellHouseAction={(propertyId) => {
            // Implement sell house logic
          }}
          onMortgageAction={(propertyId) => {
            // Implement mortgage logic
          }}
        />

        <TradingModal
          isOpen={showTradingModal}
          onCloseAction={() => setShowTradingModal(false)}
          currentPlayer={currentPlayer!}
          players={gameState?.gameRoom.players || []}
          properties={gameState?.properties || []}
          onProposeTradeAction={(toPlayerId, offeredProperties, offeredCash, requestedProperties, requestedCash) => {
            proposeTrade(toPlayerId, offeredProperties, offeredCash, requestedProperties, requestedCash);
          }}
        />

        {/* Add chat and transaction history with correct props */}
        <ChatBox
          roomId={roomId}
          socket={null}
          currentPlayerId={playerId}
          isVisible={showChat}
          onToggle={() => setShowChat(!showChat)}
          players={gameState?.gameRoom.players || []}
        />

        <TransactionHistory
          roomId={roomId}
          isVisible={showTransactionHistory}
          onToggle={() => setShowTransactionHistory(!showTransactionHistory)}
        />

        <TradeProposalModal
          isOpen={!!currentTradeProposal}
          onCloseAction={clearTradeProposal}
          tradeProposal={currentTradeProposal}
          fromPlayer={currentTradeProposal ? gameState?.gameRoom.players.find(p => p.id === currentTradeProposal.fromPlayerId) || null : null}
          toPlayer={currentPlayer || null}
          properties={gameState?.properties || []}
          onAcceptTradeAction={handleAcceptTrade}
          onRejectTradeAction={handleRejectTrade}
          onCounterTradeAction={handleCounterTrade}
        />
      </div>
    </div>
  );
}