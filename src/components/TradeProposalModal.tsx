'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@/types/game';
import { ArrowRightLeft, DollarSign, Check, X } from 'lucide-react';

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

interface TradeProposalModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  tradeProposal: TradeProposal | null;
  fromPlayer: Player | null;
  toPlayer: Player | null;
  properties: Property[];
  onAcceptTradeAction: (tradeId: string) => void;
  onRejectTradeAction: (tradeId: string) => void;
  onCounterTradeAction: (tradeId: string) => void;
}

export default function TradeProposalModal({
  isOpen,
  onCloseAction,
  tradeProposal,
  fromPlayer,
  toPlayer,
  properties,
  onAcceptTradeAction,
  onRejectTradeAction,
  onCounterTradeAction
}: TradeProposalModalProps) {
  if (!tradeProposal || !fromPlayer || !toPlayer) {
    return null;
  }

  const offeredProperties = properties.filter(p => 
    tradeProposal.offeredProperties.includes(p.id)
  );
  
  const requestedProperties = properties.filter(p => 
    tradeProposal.requestedProperties.includes(p.id)
  );

  const handleAccept = () => {
    onAcceptTradeAction(tradeProposal.id);
    onCloseAction();
  };

  const handleReject = () => {
    onRejectTradeAction(tradeProposal.id);
    onCloseAction();
  };

  const handleCounter = () => {
    onCounterTradeAction(tradeProposal.id);
    onCloseAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ArrowRightLeft className="w-6 h-6" />
            Trade Proposal from {fromPlayer.name}
          </DialogTitle>
          <div className="text-gray-400 text-sm">
            {fromPlayer.name} wants to trade with you!
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* What they're offering */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400">
                  {fromPlayer.name} Offers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Their Properties */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Properties</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {offeredProperties.map((property) => (
                      <div
                        key={property.id}
                        className="p-2 rounded border border-green-500 bg-green-900/20"
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
                    {offeredProperties.length === 0 && (
                      <div className="text-gray-400 text-sm text-center py-4">
                        No properties offered
                      </div>
                    )}
                  </div>
                </div>

                {/* Their Cash */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Cash Offered</h4>
                  <div className="flex items-center gap-2 p-2 bg-green-900/20 rounded border border-green-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-green-400 font-bold">
                      ${tradeProposal.offeredCash.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What they're requesting */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-400">
                  {fromPlayer.name} Wants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Your Properties */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Your Properties</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {requestedProperties.map((property) => (
                      <div
                        key={property.id}
                        className="p-2 rounded border border-blue-500 bg-blue-900/20"
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
                    {requestedProperties.length === 0 && (
                      <div className="text-gray-400 text-sm text-center py-4">
                        No properties requested
                      </div>
                    )}
                  </div>
                </div>

                {/* Your Cash */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Your Cash Requested</h4>
                  <div className="flex items-center gap-2 p-2 bg-blue-900/20 rounded border border-blue-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-blue-400 font-bold">
                      ${tradeProposal.requestedCash.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    You have: ${toPlayer.cash.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trade Summary */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader className="pb-3">
              <CardTitle>Trade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="font-medium text-green-400">You Give</div>
                  <div className="text-sm text-gray-300 mt-1">
                    {requestedProperties.length} properties + ${tradeProposal.requestedCash.toLocaleString()}
                  </div>
                </div>
                <ArrowRightLeft className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <div className="font-medium text-blue-400">You Get</div>
                  <div className="text-sm text-gray-300 mt-1">
                    {offeredProperties.length} properties + ${tradeProposal.offeredCash.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1 border-red-500 text-red-400 hover:bg-red-900/20"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleCounter}
              variant="outline"
              className="flex-1 border-yellow-500 text-yellow-400 hover:bg-yellow-900/20"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Counter Offer
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={toPlayer.cash < tradeProposal.requestedCash}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept Trade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}