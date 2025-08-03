'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Property } from '@/types/game';
import { useState } from 'react';
import { ArrowRightLeft, DollarSign } from 'lucide-react';

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

interface TradingModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  currentPlayer: Player;
  players: Player[];
  properties: Property[];
  onProposeTradeAction: (
    toPlayerId: string,
    offeredProperties: string[],
    offeredCash: number,
    requestedProperties: string[],
    requestedCash: number
  ) => void;
}

export default function TradingModal({ 
  isOpen, 
  onCloseAction, 
  currentPlayer, 
  players, 
  properties,
  onProposeTradeAction 
}: TradingModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [offeredProperties, setOfferedProperties] = useState<string[]>([]);
  const [requestedProperties, setRequestedProperties] = useState<string[]>([]);
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);

  const otherPlayers = players.filter(p => p.id !== currentPlayer.id && !p.isBankrupt);
  const myProperties = properties.filter(p => p.ownerId === currentPlayer.id);
  const targetPlayerProperties = selectedPlayer 
    ? properties.filter(p => p.ownerId === selectedPlayer)
    : [];

  const handleProposeTrade = () => {
    if (!selectedPlayer) return;

    onProposeTradeAction(
      selectedPlayer,
      offeredProperties,
      offeredCash,
      requestedProperties,
      requestedCash
    );
    
    resetTrade();
    onCloseAction();
  };

  const resetTrade = () => {
    setSelectedPlayer('');
    setOfferedProperties([]);
    setRequestedProperties([]);
    setOfferedCash(0);
    setRequestedCash(0);
  };

  const toggleOfferedProperty = (propertyId: string) => {
    setOfferedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const toggleRequestedProperty = (propertyId: string) => {
    setRequestedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const canProposeTrade = () => {
    return selectedPlayer && 
           (offeredProperties.length > 0 || requestedProperties.length > 0 || 
            offeredCash > 0 || requestedCash > 0) &&
           offeredCash <= currentPlayer.cash;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ArrowRightLeft className="w-6 h-6" />
            Propose Trade
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Player Selection */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle>Select Trading Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="bg-slate-600 border-slate-500">
                  <SelectValue placeholder="Choose a player to trade with" />
                </SelectTrigger>
                <SelectContent>
                  {otherPlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${player.color}`} />
                        {player.name} (${player.cash.toLocaleString()})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedPlayer && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Offer */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-400">Your Offer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Your Properties */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Properties</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {myProperties.map((property) => (
                        <div
                          key={property.id}
                          className={`p-2 rounded cursor-pointer border ${
                            offeredProperties.includes(property.id)
                              ? 'border-green-500 bg-green-900/20'
                              : 'border-slate-500 bg-slate-600'
                          }`}
                          onClick={() => toggleOfferedProperty(property.id)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{property.name}</span>
                            <span className="text-xs text-gray-400">${property.price}</span>
                          </div>
                          {(property.houses > 0 || property.hasHotel) && (
                            <div className="text-xs text-blue-400 mt-1">
                              {property.hasHotel ? '🏨 Hotel' : `🏠 ${property.houses} house${property.houses > 1 ? 's' : ''}`}
                            </div>
                          )}
                        </div>
                      ))}
                      {myProperties.length === 0 && (
                        <div className="text-gray-400 text-sm text-center py-4">
                          No properties to offer
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Your Cash */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cash Offer</h4>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <Input
                        type="number"
                        min="0"
                        max={currentPlayer.cash}
                        value={offeredCash}
                        onChange={(e) => setOfferedCash(Number(e.target.value))}
                        className="bg-slate-600 border-slate-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Available: ${currentPlayer.cash.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Request */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-400">Your Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Their Properties */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Properties</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {targetPlayerProperties.map((property) => (
                        <div
                          key={property.id}
                          className={`p-2 rounded cursor-pointer border ${
                            requestedProperties.includes(property.id)
                              ? 'border-blue-500 bg-blue-900/20'
                              : 'border-slate-500 bg-slate-600'
                          }`}
                          onClick={() => toggleRequestedProperty(property.id)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{property.name}</span>
                            <span className="text-xs text-gray-400">${property.price}</span>
                          </div>
                          {(property.houses > 0 || property.hasHotel) && (
                            <div className="text-xs text-blue-400 mt-1">
                              {property.hasHotel ? '🏨 Hotel' : `🏠 ${property.houses} house${property.houses > 1 ? 's' : ''}`}
                            </div>
                          )}
                        </div>
                      ))}
                      {targetPlayerProperties.length === 0 && (
                        <div className="text-gray-400 text-sm text-center py-4">
                          No properties available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Request Cash */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cash Request</h4>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <Input
                        type="number"
                        min="0"
                        value={requestedCash}
                        onChange={(e) => setRequestedCash(Number(e.target.value))}
                        className="bg-slate-600 border-slate-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      They have: ${players.find(p => p.id === selectedPlayer)?.cash.toLocaleString() || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trade Summary */}
          {selectedPlayer && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle>Trade Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="font-medium text-green-400">You Give</div>
                    <div className="text-sm text-gray-300 mt-1">
                      {offeredProperties.length} properties + ${offeredCash.toLocaleString()}
                    </div>
                  </div>
                  <ArrowRightLeft className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <div className="font-medium text-blue-400">You Get</div>
                    <div className="text-sm text-gray-300 mt-1">
                      {requestedProperties.length} properties + ${requestedCash.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onCloseAction}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={resetTrade}
              variant="outline"
              className="flex-1"
              disabled={!selectedPlayer}
            >
              Reset
            </Button>
            <Button
              onClick={handleProposeTrade}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!canProposeTrade()}
            >
              Propose Trade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}