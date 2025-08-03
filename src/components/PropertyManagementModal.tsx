'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/game';
import { Home, Building, DollarSign } from 'lucide-react';

interface PropertyManagementModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  properties: Property[];
  playerCash: number;
  onBuildHouseAction: (propertyId: string) => void;
  onBuildHotelAction: (propertyId: string) => void;
  onSellHouseAction: (propertyId: string) => void;
  onMortgageAction: (propertyId: string) => void;
}

export default function PropertyManagementModal({ 
  isOpen, 
  onCloseAction, 
  properties, 
  playerCash,
  onBuildHouseAction,
  onBuildHotelAction,
  onSellHouseAction,
  onMortgageAction
}: PropertyManagementModalProps) {
  
  const getColorGroupProperties = (colorGroup: string) => {
    return properties.filter(p => p.colorGroup === colorGroup && p.type === 'PROPERTY');
  };

  const ownsAllInColorGroup = (colorGroup: string) => {
    const groupProperties = getColorGroupProperties(colorGroup);
    return groupProperties.length > 0 && groupProperties.every(p => p.ownerId);
  };

  const canBuildHouse = (property: Property) => {
    if (!property.colorGroup || property.hasHotel || property.houses >= 4) return false;
    if (!ownsAllInColorGroup(property.colorGroup)) return false;
    
    const housePrice = property.housePrice || 50;
    return playerCash >= housePrice;
  };

  const canBuildHotel = (property: Property) => {
    if (!property.colorGroup || property.hasHotel || property.houses < 4) return false;
    if (!ownsAllInColorGroup(property.colorGroup)) return false;
    
    const hotelPrice = property.hotelPrice || property.housePrice || 50;
    return playerCash >= hotelPrice;
  };

  const canSellHouse = (property: Property) => {
    return property.houses > 0;
  };

  const canMortgage = (property: Property) => {
    return !property.isMortgaged && property.houses === 0 && !property.hasHotel;
  };

  const getRentWithImprovements = (property: Property) => {
    if (property.hasHotel) {
      return property.rentWithHotel || (property.rent || 0) * 10;
    }
    if (property.houses > 0) {
      return property.rentWithHouse || (property.rent || 0) * (property.houses + 1);
    }
    return property.rent || 0;
  };

  const groupedProperties = properties.reduce((groups, property) => {
    if (property.type !== 'PROPERTY' || !property.colorGroup) return groups;
    
    if (!groups[property.colorGroup]) {
      groups[property.colorGroup] = [];
    }
    groups[property.colorGroup].push(property);
    return groups;
  }, {} as Record<string, Property[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building className="w-6 h-6" />
            Property Management
          </DialogTitle>
          <div className="text-gray-400 text-sm">
            Current Cash: <span className="text-green-400 font-semibold">${playerCash.toLocaleString()}</span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {Object.entries(groupedProperties).map(([colorGroup, groupProperties]) => (
            <Card key={colorGroup} className="bg-slate-700 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{colorGroup} Properties</span>
                  {ownsAllInColorGroup(colorGroup) && (
                    <Badge className="bg-green-600">Monopoly</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {groupProperties.map((property) => (
                    <div key={property.id} className="bg-slate-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{property.name}</h4>
                          <div className="text-sm text-gray-300">
                            Current Rent: ${getRentWithImprovements(property)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {property.houses > 0 && (
                              <span className="text-green-400 text-sm flex items-center gap-1">
                                <Home className="w-3 h-3" />
                                {property.houses} house{property.houses > 1 ? 's' : ''}
                              </span>
                            )}
                            {property.hasHotel && (
                              <span className="text-blue-400 text-sm flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                Hotel
                              </span>
                            )}
                            {property.isMortgaged && (
                              <Badge variant="secondary">Mortgaged</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div>Purchase: ${property.price}</div>
                          {property.housePrice && (
                            <div>House: ${property.housePrice}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {canBuildHouse(property) && (
                          <Button
                            onClick={() => onBuildHouseAction(property.id)}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                            size="sm"
                          >
                            <Home className="w-3 h-3 mr-1" />
                            Build House (${property.housePrice || 50})
                          </Button>
                        )}
                        
                        {canBuildHotel(property) && (
                          <Button
                            onClick={() => onBuildHotelAction(property.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                            size="sm"
                          >
                            <Building className="w-3 h-3 mr-1" />
                            Build Hotel (${property.hotelPrice || property.housePrice || 50})
                          </Button>
                        )}
                        
                        {canSellHouse(property) && (
                          <Button
                            onClick={() => onSellHouseAction(property.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                            size="sm"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Sell House (${Math.floor((property.housePrice || 50) / 2)})
                          </Button>
                        )}
                        
                        {canMortgage(property) && (
                          <Button
                            onClick={() => onMortgageAction(property.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-xs"
                            size="sm"
                          >
                            Mortgage (${Math.floor((property.price || 0) / 2)})
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {Object.keys(groupedProperties).length === 0 && (
            <div className="text-center text-gray-400 py-8">
              You don't own any properties yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}