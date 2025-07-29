'use client';

import { Property, Player } from '@/types/game';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, DollarSign, Info } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  owner?: Player | null;
  currentPlayer?: Player | null;
  canBuy?: boolean;
  canBuild?: boolean;
  onBuy?: () => void;
  onBuildHouse?: () => void;
  onBuildHotel?: () => void;
  onView?: () => void;
}

export default function PropertyCard({
  property,
  owner,
  currentPlayer,
  canBuy = false,
  canBuild = false,
  onBuy,
  onBuildHouse,
  onBuildHotel,
  onView
}: PropertyCardProps) {
  const getRentDisplay = () => {
    if (!property.rent) return 'N/A';
    
    let rentText = `Base: $${property.rent}`;
    
    if (property.rentWithHouse) {
      rentText += `\nWith House: $${property.rentWithHouse}`;
    }
    
    if (property.rentWithHotel) {
      rentText += `\nWith Hotel: $${property.rentWithHotel}`;
    }
    
    return rentText;
  };

  const getColorGroupDisplay = () => {
    if (!property.colorGroup) return 'None';
    
    const colorMap: Record<string, { name: string; color: string }> = {
      'brown': { name: 'Brown', color: 'bg-amber-800' },
      'lightblue': { name: 'Light Blue', color: 'bg-sky-400' },
      'pink': { name: 'Pink', color: 'bg-pink-400' },
      'orange': { name: 'Orange', color: 'bg-orange-500' },
      'red': { name: 'Red', color: 'bg-red-600' },
      'yellow': { name: 'Yellow', color: 'bg-yellow-400' },
      'green': { name: 'Green', color: 'bg-green-600' },
      'blue': { name: 'Blue', color: 'bg-blue-800' },
    };
    
    const group = colorMap[property.colorGroup];
    return group ? (
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded ${group.color}`} />
        <span>{group.name}</span>
      </div>
    ) : property.colorGroup;
  };

  const getTypeDisplay = () => {
    switch (property.type) {
      case 'GO': return { name: 'GO', color: 'bg-green-600' };
      case 'JAIL': return { name: 'Jail', color: 'bg-gray-700' };
      case 'FREE_PARKING': return { name: 'Free Parking', color: 'bg-blue-600' };
      case 'GO_TO_JAIL': return { name: 'Go To Jail', color: 'bg-red-600' };
      case 'TAX': return { name: 'Tax', color: 'bg-yellow-600' };
      case 'CHANCE': return { name: 'Chance', color: 'bg-orange-600' };
      case 'COMMUNITY_CHEST': return { name: 'Community Chest', color: 'bg-purple-600' };
      case 'RAILROAD': return { name: 'Railroad', color: 'bg-gray-800' };
      case 'UTILITY': return { name: 'Utility', color: 'bg-indigo-600' };
      case 'PROPERTY': return { name: 'Property', color: 'bg-gray-600' };
      default: return { name: 'Unknown', color: 'bg-gray-600' };
    }
  };

  const typeInfo = getTypeDisplay();

  return (
    <Card className={`bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer ${owner ? 'ring-2 ring-opacity-50 ' + (owner.id === currentPlayer?.id ? 'ring-green-500' : 'ring-red-500') : ''}`} onClick={onView}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-white text-lg leading-tight">
            {property.name}
          </CardTitle>
          <Badge variant="secondary" className={`${typeInfo.color} text-white`}>
            {typeInfo.name}
          </Badge>
        </div>
        <CardDescription className="text-gray-400">
          Position {property.position}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {property.type === 'PROPERTY' && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Price:</span>
                <div className="text-white font-medium">${property.price?.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Color Group:</span>
                <div className="text-white">{getColorGroupDisplay()}</div>
              </div>
            </div>
            
            <div>
              <span className="text-gray-400 text-sm">Rent:</span>
              <div className="text-white text-xs whitespace-pre-line mt-1">
                {getRentDisplay()}
              </div>
            </div>
            
            {owner && (
              <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${owner.color}`} />
                  <span className="text-white text-sm">{owner.name}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {property.houses > 0 && `${property.houses} house${property.houses > 1 ? 's' : ''}`}
                  {property.hasHotel && ' 🏨'}
                </div>
              </div>
            )}
            
            {(property.houses > 0 || property.hasHotel) && (
              <div className="flex gap-1">
                {Array.from({ length: property.houses }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-green-500 rounded-sm" title="House" />
                ))}
                {property.hasHotel && (
                  <div className="w-4 h-4 bg-red-500 rounded-sm" title="Hotel" />
                )}
              </div>
            )}
          </>
        )}
        
        {property.type === 'RAILROAD' && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Price:</span>
              <div className="text-white font-medium">${property.price?.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Rent:</span>
              <div className="text-white font-medium">${property.rent?.toLocaleString()}</div>
            </div>
          </div>
        )}
        
        {property.type === 'UTILITY' && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Price:</span>
              <div className="text-white font-medium">${property.price?.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Rent:</span>
              <div className="text-white font-medium">${property.rent?.toLocaleString()}</div>
            </div>
          </div>
        )}
        
        {property.type === 'TAX' && (
          <div className="text-center">
            <div className="text-2xl text-yellow-400 mb-2">$</div>
            <div className="text-white font-medium">Pay Tax</div>
          </div>
        )}
        
        {property.type === 'CHANCE' && (
          <div className="text-center">
            <div className="text-2xl text-orange-400 mb-2">?</div>
            <div className="text-white font-medium">Chance Card</div>
          </div>
        )}
        
        {property.type === 'COMMUNITY_CHEST' && (
          <div className="text-center">
            <div className="text-2xl text-purple-400 mb-2">◊</div>
            <div className="text-white font-medium">Community Chest</div>
          </div>
        )}
        
        {canBuy && (
          <Button 
            onClick={(e) => { e.stopPropagation(); onBuy?.(); }}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Buy for ${property.price}
          </Button>
        )}
        
        {canBuild && owner && owner.id === currentPlayer?.id && property.type === 'PROPERTY' && (
          <div className="space-y-2">
            {!property.hasHotel && property.houses < 4 && (
              <Button 
                onClick={(e) => { e.stopPropagation(); onBuildHouse?.(); }}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Build House
              </Button>
            )}
            {property.houses === 4 && !property.hasHotel && (
              <Button 
                onClick={(e) => { e.stopPropagation(); onBuildHotel?.(); }}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Build Hotel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PropertyModalProps {
  property: Property;
  owner?: Player | null;
  currentPlayer?: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy?: () => void;
  onBuildHouse?: () => void;
  onBuildHotel?: () => void;
}

export function PropertyModal({
  property,
  owner,
  currentPlayer,
  isOpen,
  onClose,
  onBuy,
  onBuildHouse,
  onBuildHotel
}: PropertyModalProps) {
  const canBuy = !property.ownerId && property.price && currentPlayer?.cash >= property.price;
  const canBuild = owner && owner.id === currentPlayer?.id && property.type === 'PROPERTY';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{property.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Property details and information
          </DialogDescription>
        </DialogHeader>
        
        <PropertyCard
          property={property}
          owner={owner}
          currentPlayer={currentPlayer}
          canBuy={canBuy}
          canBuild={canBuild}
          onBuy={onBuy}
          onBuildHouse={onBuildHouse}
          onBuildHotel={onBuildHotel}
        />
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}