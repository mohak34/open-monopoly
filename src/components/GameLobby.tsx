'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Play } from 'lucide-react';

interface GameRoom {
  id: string;
  name: string;
  boardSize: number;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Array<{
    id: string;
    name: string;
    color: string;
    isReady: boolean;
  }>;
  _count: {
    players: number;
  };
  createdAt: string;
}

const playerColors = [
  'bg-red-500',
  'bg-blue-500', 
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500'
];

export default function GameLobby() {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  
  const [createForm, setCreateForm] = useState({
    roomName: '',
    boardSize: '40',
    maxPlayers: '4',
    playerName: '',
    playerColor: playerColors[0]
  });

  const [joinForm, setJoinForm] = useState({
    playerName: '',
    playerColor: playerColors[0]
  });

  useEffect(() => {
    fetchGameRooms();
  }, []);

  const fetchGameRooms = async () => {
    try {
      const response = await fetch('/api/game-rooms');
      const data = await response.json();
      setGameRooms(data);
    } catch (error) {
      console.error('Error fetching game rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGameRoom = async () => {
    if (!createForm.roomName || !createForm.playerName) return;

    try {
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch('/api/game-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.roomName,
          boardSize: parseInt(createForm.boardSize),
          maxPlayers: parseInt(createForm.maxPlayers),
          hostId: playerId
        })
      });

      if (response.ok) {
        const room = await response.json();
        
        await fetch('/api/game-rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            playerName: createForm.playerName,
            playerColor: createForm.playerColor,
            playerId
          })
        });

        window.location.href = `/game/${room.id}?playerId=${playerId}`;
      }
    } catch (error) {
      console.error('Error creating game room:', error);
    }
  };

  const joinGameRoom = async () => {
    if (!selectedRoom || !joinForm.playerName) return;

    try {
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch('/api/game-rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          playerName: joinForm.playerName,
          playerColor: joinForm.playerColor,
          playerId
        })
      });

      if (response.ok) {
        window.location.href = `/game/${selectedRoom.id}?playerId=${playerId}`;
      }
    } catch (error) {
      console.error('Error joining game room:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game rooms...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Open Monopoly</h1>
          <p className="text-gray-300">Play the classic board game online with friends</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Game Rooms</h2>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Create Game Room</DialogTitle>
                <DialogDescription>
                  Set up a new Monopoly game room
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Name</label>
                  <Input
                    value={createForm.roomName}
                    onChange={(e) => setCreateForm({...createForm, roomName: e.target.value})}
                    placeholder="Enter room name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Board Size</label>
                  <Select value={createForm.boardSize} onValueChange={(value) => setCreateForm({...createForm, boardSize: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="40">40 tiles (Classic)</SelectItem>
                      <SelectItem value="60">60 tiles (Large)</SelectItem>
                      <SelectItem value="80">80 tiles (Extra Large)</SelectItem>
                      <SelectItem value="100">100 tiles (Massive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Players</label>
                  <Select value={createForm.maxPlayers} onValueChange={(value) => setCreateForm({...createForm, maxPlayers: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="2">2 Players</SelectItem>
                      <SelectItem value="4">4 Players</SelectItem>
                      <SelectItem value="6">6 Players</SelectItem>
                      <SelectItem value="8">8 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Your Name</label>
                  <Input
                    value={createForm.playerName}
                    onChange={(e) => setCreateForm({...createForm, playerName: e.target.value})}
                    placeholder="Enter your name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Player Color</label>
                  <div className="flex gap-2">
                    {playerColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full ${color} ${createForm.playerColor === color ? 'ring-2 ring-white' : ''}`}
                        onClick={() => setCreateForm({...createForm, playerColor: color})}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={createGameRoom} className="w-full bg-purple-600 hover:bg-purple-700">
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameRooms.map((room) => (
            <Card key={room.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{room.name}</CardTitle>
                  <Badge variant={room.status === 'WAITING' ? 'default' : 'secondary'}>
                    {room.status}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  {room.boardSize} tiles • {room._count.players}/{room.maxPlayers} players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{room._count.players} players</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {room.players.slice(0, 4).map((player) => (
                      <div
                        key={player.id}
                        className={`w-6 h-6 rounded-full ${player.color}`}
                        title={player.name}
                      />
                    ))}
                    {room.players.length > 4 && (
                      <span className="text-xs text-gray-400">+{room.players.length - 4}</span>
                    )}
                  </div>

                  <Dialog open={showJoinDialog && selectedRoom?.id === room.id} onOpenChange={(open) => {
                    setShowJoinDialog(open);
                    if (open) setSelectedRoom(room);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={room.status !== 'WAITING' || room._count.players >= room.maxPlayers}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {room.status === 'WAITING' ? 'Join Room' : 'Game in Progress'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Join {room.name}</DialogTitle>
                        <DialogDescription>
                          Enter your details to join the game
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Your Name</label>
                          <Input
                            value={joinForm.playerName}
                            onChange={(e) => setJoinForm({...joinForm, playerName: e.target.value})}
                            placeholder="Enter your name"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Player Color</label>
                          <div className="flex gap-2">
                            {playerColors.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full ${color} ${joinForm.playerColor === color ? 'ring-2 ring-white' : ''}`}
                                onClick={() => setJoinForm({...joinForm, playerColor: color})}
                              />
                            ))}
                          </div>
                        </div>

                        <Button onClick={joinGameRoom} className="w-full bg-purple-600 hover:bg-purple-700">
                          Join Game
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {gameRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No game rooms available</div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Room
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}