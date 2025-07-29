'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, Home, AlertTriangle, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fromPlayer?: string;
  toPlayer?: string;
  description: string;
  createdAt: string;
  playerName?: string;
}

interface TransactionHistoryProps {
  roomId: string;
  isVisible: boolean;
  onToggle: () => void;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'BUY_PROPERTY':
      return <Home className="w-4 h-4" />;
    case 'PAY_RENT':
    case 'RECEIVE_RENT':
      return <DollarSign className="w-4 h-4" />;
    case 'PAY_TAX':
    case 'COLLECT_GO':
      return <TrendingUp className="w-4 h-4" />;
    case 'BUILD_HOUSE':
    case 'BUILD_HOTEL':
      return <Home className="w-4 h-4" />;
    case 'BANKRUPTCY':
      return <AlertTriangle className="w-4 h-4" />;
    case 'JAIL_FINE':
    case 'CHANCE_CARD':
    case 'COMMUNITY_CHEST_CARD':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'BUY_PROPERTY':
    case 'BUILD_HOUSE':
    case 'BUILD_HOTEL':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'PAY_RENT':
    case 'PAY_TAX':
    case 'JAIL_FINE':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'RECEIVE_RENT':
    case 'COLLECT_GO':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'BANKRUPTCY':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'CHANCE_CARD':
    case 'COMMUNITY_CHEST_CARD':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const formatTransactionType = (type: string) => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export default function TransactionHistory({ roomId, isVisible, onToggle }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isVisible && roomId) {
      fetchTransactions();
    }
  }, [isVisible, roomId]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return '';
    return amount > 0 ? `+$${amount}` : `-$${Math.abs(amount)}`;
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
        className="fixed bottom-4 right-4 z-50 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
      >
        <Clock className="w-4 h-4 mr-2" />
        Show History
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96">
      <Card className="bg-slate-800 border-slate-700 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Transaction History
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
            Recent game events and transactions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-64 px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`p-3 rounded-lg border ${getTransactionColor(transaction.type)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatTransactionType(transaction.type)}
                            </Badge>
                            <span className="text-xs opacity-75">
                              {formatTime(transaction.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1 truncate">
                            {transaction.description}
                          </p>
                          {transaction.playerName && (
                            <p className="text-xs opacity-75">
                              Player: {transaction.playerName}
                            </p>
                          )}
                          {transaction.fromPlayer && transaction.toPlayer && (
                            <p className="text-xs opacity-75">
                              From: {transaction.fromPlayer} → To: {transaction.toPlayer}
                            </p>
                          )}
                        </div>
                      </div>
                      {transaction.amount !== 0 && (
                        <div className="flex-shrink-0 text-right">
                          <span className={`text-sm font-semibold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatAmount(transaction.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}