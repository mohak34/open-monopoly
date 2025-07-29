'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  message: string;
  timestamp: string;
}

interface ChatBoxProps {
  roomId: string;
  socket: Socket | null;
  currentPlayerId: string;
  isVisible: boolean;
  onToggle: () => void;
  players: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function ChatBox({ roomId, socket, currentPlayerId, isVisible, onToggle, players }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !isVisible) return;

    // Listen for chat messages
    socket.on('chat-message', (data: ChatMessage) => {
      setMessages(prev => [...prev, data]);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data: { playerId: string, playerName: string }) => {
      if (data.playerId !== currentPlayerId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Request recent messages when chat is opened
    socket.emit('get-chat-history', { roomId });

    // Listen for chat history
    socket.on('chat-history', (data: ChatMessage[]) => {
      setMessages(data);
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-typing');
      socket.off('chat-history');
    };
  }, [socket, isVisible, roomId, currentPlayerId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !isVisible) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: currentPlayerId,
      playerName: players.find(p => p.id === currentPlayerId)?.name || 'Unknown',
      playerColor: players.find(p => p.id === currentPlayerId)?.color || 'bg-gray-500',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    socket.emit('send-chat-message', {
      roomId,
      message: message,
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Chat
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 h-96">
      <Card className="bg-slate-800 border-slate-700 shadow-xl h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat
            </CardTitle>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-slate-700"
            >
              ×
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Chat with other players
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          {/* Online players */}
          <div className="px-4 py-2 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Online ({players.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    player.id === currentPlayerId
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-600 text-gray-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${player.color}`} />
                  <span className="truncate max-w-16">{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      msg.playerId === currentPlayerId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.playerId !== currentPlayerId && (
                      <div className={`w-6 h-6 rounded-full ${msg.playerColor} flex-shrink-0 mt-1`} />
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        msg.playerId === currentPlayerId
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {msg.playerId !== currentPlayerId && (
                        <div className="text-xs font-medium mb-1 opacity-90">
                          {msg.playerName}
                        </div>
                      )}
                      <div className="text-sm break-words">{msg.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                    <span className="ml-2">Someone is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                disabled={!socket}
              />
              <Button
                onClick={sendMessage}
                disabled={!socket || !newMessage.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}