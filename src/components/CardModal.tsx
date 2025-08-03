'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/lib/cards';

interface CardModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  card: Card | null;
  onExecuteAction: () => void;
}

export default function CardModal({ isOpen, onCloseAction, card, onExecuteAction }: CardModalProps) {
  if (!card) return null;

  const getCardIcon = () => {
    switch (card.type) {
      case 'CHANCE':
        return '🎲';
      case 'COMMUNITY_CHEST':
        return '📦';
      default:
        return '🎴';
    }
  };

  const getCardColor = () => {
    switch (card.type) {
      case 'CHANCE':
        return 'from-orange-600 to-red-600';
      case 'COMMUNITY_CHEST':
        return 'from-blue-600 to-purple-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{getCardIcon()}</span>
            {card.type === 'CHANCE' ? 'Chance' : 'Community Chest'}
          </DialogTitle>
        </DialogHeader>
        
        <div className={`bg-gradient-to-br ${getCardColor()} rounded-lg p-6 text-center`}>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
            <p className="text-white/90 text-sm leading-relaxed">{card.description}</p>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => {
                onExecuteAction();
                onCloseAction();
              }}
              className="bg-white text-black hover:bg-gray-200 font-semibold px-6 py-2"
            >
              Apply Card Effect
            </Button>
            
            <div className="text-xs text-white/70">
              Click to execute the card's effect
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}