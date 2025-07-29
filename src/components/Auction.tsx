'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Timer, Gavel, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { Player, Auction } from '@/types/game';

interface AuctionProps {
  auction: Auction | null;
  socket: Socket | null;
  currentPlayerId: string;
  roomId: string;
  players: Player[];
  onAuctionEnd?: () => void;
}

export default function Auction({ auction, socket, currentPlayerId, roomId, players, onAuctionEnd }: AuctionProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [pendingBid, setPendingBid] = useState(0);

  useEffect(() => {
    if (!auction || auction.status !== 'ACTIVE') return;

    const calculateTimeLeft = () => {
      const endTime = new Date(auction.endTime).getTime();
      const now = Date.now();
      const left = Math.max(0, endTime - now);
      setTimeLeft(left);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  useEffect(() => {
    if (!socket) return;

    const handleBidPlaced = (data: { auction: Auction; playerName: string; bidAmount: number }) => {
      // Update auction state when someone places a bid
      if (auction && data.auction.id === auction.id) {
        // Force re-render by updating state
        setBidAmount('');
      }
    };

    const handleAuctionEnded = (data: { auction: Auction }) => {
      if (onAuctionEnd) {
        onAuctionEnd();
      }
    };

    socket.on('bid-placed', handleBidPlaced);
    socket.on('auction-ended', handleAuctionEnded);

    return () => {
      socket.off('bid-placed', handleBidPlaced);
      socket.off('auction-ended', handleAuctionEnded);
    };
  }, [socket, auction, onAuctionEnd]);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getMinBid = () => {
    if (!auction) return 0;
    return auction.currentBid + 1;
  };

  const getCurrentPlayer = () => {
    return players.find(p => p.id === currentPlayerId);
  };

  const getCurrentWinner = () => {
    if (!auction || !auction.currentWinner) return null;
    return players.find(p => p.id === auction.currentWinner);
  };

  const handlePlaceBid = () => {
    if (!socket || !auction || !bidAmount) return;

    const bid = parseInt(bidAmount);
    if (isNaN(bid) || bid < getMinBid()) return;

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.cash < bid) return;

    setPendingBid(bid);
    setShowBidConfirm(true);
  };

  const confirmBid = () => {
    if (!socket || !auction || !pendingBid) return;

    setIsPlacingBid(true);
    socket.emit('place-bid', {
      roomId: roomId, // This should be passed as a prop
      playerId: currentPlayerId,
      auctionId: auction.id,
      bidAmount: pendingBid,
    });

    setShowBidConfirm(false);
    setPendingBid(0);
    setIsPlacingBid(false);
  };

  const canPlaceBid = () => {
    if (!auction || auction.status !== 'ACTIVE') return false;
    
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isBankrupt) return false;

    const bid = parseInt(bidAmount);
    if (isNaN(bid) || bid < getMinBid()) return false;

    return currentPlayer.cash >= bid;
  };

  if (!auction) {
    return null;
  }

  const currentPlayer = getCurrentPlayer();
  const currentWinner = getCurrentWinner();
  const progressPercentage = auction.status === 'ACTIVE' ? (timeLeft / 30000) * 100 : 0;

  return (
    <>
      <Dialog open={showBidConfirm} onOpenChange={setShowBidConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Bid</DialogTitle>
            <DialogDescription>
              Are you sure you want to bid {formatCurrency(pendingBid)} for {auction.propertyName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Your Cash:</span>
                <div className="text-white">{formatCurrency(currentPlayer?.cash || 0)}</div>
              </div>
              <div>
                <span className="text-gray-400">Bid Amount:</span>
                <div className="text-white">{formatCurrency(pendingBid)}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowBidConfirm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmBid} className="flex-1 bg-green-600 hover:bg-green-700">
                Place Bid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-slate-800 border-slate-700 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Property Auction
            </CardTitle>
            <Badge variant={auction.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {auction.status}
            </Badge>
          </div>
          <CardDescription className="text-gray-400">
            Bidding for {auction.propertyName}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Timer */}
          {auction.status === 'ACTIVE' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  Time Remaining
                </span>
                <span className={`font-mono ${timeLeft < 10000 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {/* Current Bid Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Starting Bid:</span>
              <div className="text-white font-medium">{formatCurrency(auction.startingBid)}</div>
            </div>
            <div>
              <span className="text-gray-400">Current Bid:</span>
              <div className="text-white font-medium">{formatCurrency(auction.currentBid)}</div>
            </div>
          </div>

          {/* Current Winner */}
          {currentWinner && (
            <div className="flex items-center gap-2 p-3 bg-slate-700 rounded-lg">
              <div className={`w-4 h-4 rounded-full ${currentWinner.color}`} />
              <span className="text-white text-sm">
                Current winner: {currentWinner.name}
              </span>
            </div>
          )}

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              Participants ({auction.participants.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {auction.participants.map((participantId) => {
                const player = players.find(p => p.id === participantId);
                return player ? (
                  <div
                    key={participantId}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      participantId === currentPlayerId
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-600 text-gray-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${player.color}`} />
                    <span>{player.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Bid Controls */}
          {auction.status === 'ACTIVE' && currentPlayer && !currentPlayer.isBankrupt && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Min bid: ${formatCurrency(getMinBid())}`}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  min={getMinBid()}
                  max={currentPlayer.cash}
                />
                <Button
                  onClick={handlePlaceBid}
                  disabled={!canPlaceBid() || isPlacingBid}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPlacingBid ? 'Placing...' : 'Bid'}
                </Button>
              </div>
              
              {bidAmount && (
                <div className="text-xs text-gray-400">
                  Min bid: {formatCurrency(getMinBid())} | 
                  Your cash: {formatCurrency(currentPlayer.cash)}
                </div>
              )}
            </div>
          )}

          {/* Auction Ended */}
          {auction.status === 'ENDED' && (
            <div className={`p-3 rounded-lg ${
              currentWinner?.id === currentPlayerId
                ? 'bg-green-900 border border-green-600'
                : 'bg-slate-700'
            }`}>
              <div className="text-sm text-center">
                {currentWinner ? (
                  <>
                    <div className="font-medium text-white mb-1">
                      {currentWinner.id === currentPlayerId ? '🎉 You won!' : `${currentWinner.name} won!`}
                    </div>
                    <div className="text-gray-300">
                      Final bid: {formatCurrency(auction.currentBid)}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-300">Auction ended with no bids</div>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {currentPlayer?.isBankrupt && (
            <div className="flex items-center gap-2 p-3 bg-red-900 border border-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-200 text-sm">You are bankrupt and cannot participate in auctions</span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}