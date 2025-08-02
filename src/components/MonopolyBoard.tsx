'use client';

import { Property } from '@/types/game';

  // World cities data for monopoly board positions
  const WORLD_CITIES_DATA: Record<number, { 
    name: string; 
    type: string; 
    colorGroup?: string; 
    country?: string; 
    city?: null; 
  }> = {
  // Corner squares
  0: { name: 'GO', type: 'special', city: null },
  10: { name: 'JAIL', type: 'special', city: null },
  20: { name: 'FREE PARKING', type: 'special', city: null },
  30: { name: 'GO TO JAIL', type: 'special', city: null },
  
  // Brown group (Mediterranean/Baltic)
  1: { name: 'Mumbai', type: 'property', colorGroup: 'brown', country: 'India' },
  3: { name: 'Cairo', type: 'property', colorGroup: 'brown', country: 'Egypt' },
  
  // Light Blue group (Oriental/Vermont/Connecticut)
  6: { name: 'Bangkok', type: 'property', colorGroup: 'lightblue', country: 'Thailand' },
  8: { name: 'Singapore', type: 'property', colorGroup: 'lightblue', country: 'Singapore' },
  9: { name: 'Manila', type: 'property', colorGroup: 'lightblue', country: 'Philippines' },
  
  // Pink group (St. Charles/States/Virginia)
  11: { name: 'Sydney', type: 'property', colorGroup: 'pink', country: 'Australia' },
  13: { name: 'Auckland', type: 'property', colorGroup: 'pink', country: 'New Zealand' },
  14: { name: 'Melbourne', type: 'property', colorGroup: 'pink', country: 'Australia' },
  
  // Orange group (St. James/Tennessee/New York)
  16: { name: 'Tokyo', type: 'property', colorGroup: 'orange', country: 'Japan' },
  18: { name: 'Seoul', type: 'property', colorGroup: 'orange', country: 'South Korea' },
  19: { name: 'Hong Kong', type: 'property', colorGroup: 'orange', country: 'Hong Kong' },
  
  // Red group (Kentucky/Indiana/Illinois)
  21: { name: 'London', type: 'property', colorGroup: 'red', country: 'UK' },
  23: { name: 'Paris', type: 'property', colorGroup: 'red', country: 'France' },
  24: { name: 'Berlin', type: 'property', colorGroup: 'red', country: 'Germany' },
  
  // Yellow group (Atlantic/Ventnor/Marvin)
  26: { name: 'Dubai', type: 'property', colorGroup: 'yellow', country: 'UAE' },
  27: { name: 'Istanbul', type: 'property', colorGroup: 'yellow', country: 'Turkey' },
  29: { name: 'Moscow', type: 'property', colorGroup: 'yellow', country: 'Russia' },
  
  // Green group (Pacific/North Carolina/Pennsylvania)
  31: { name: 'New York', type: 'property', colorGroup: 'green', country: 'USA' },
  32: { name: 'Los Angeles', type: 'property', colorGroup: 'green', country: 'USA' },
  34: { name: 'Toronto', type: 'property', colorGroup: 'green', country: 'Canada' },
  
  // Blue group (Park Place/Boardwalk)
  37: { name: 'Zurich', type: 'property', colorGroup: 'blue', country: 'Switzerland' },
  39: { name: 'Monaco', type: 'property', colorGroup: 'blue', country: 'Monaco' },
  
  // Railroads
  5: { name: 'International Airport', type: 'railroad', city: null },
  15: { name: 'Train Station', type: 'railroad', city: null },
  25: { name: 'Subway System', type: 'railroad', city: null },
  35: { name: 'High-Speed Rail', type: 'railroad', city: null },
  
  // Utilities
  12: { name: 'Global Electric', type: 'utility', city: null },
  28: { name: 'World Water Works', type: 'utility', city: null },
  
  // Tax squares
  4: { name: 'Income Tax', type: 'tax', city: null },
  38: { name: 'Luxury Tax', type: 'tax', city: null },
  
  // Chance/Community Chest
  2: { name: 'Community Chest', type: 'chance', city: null },
  7: { name: 'Chance', type: 'chance', city: null },
  17: { name: 'Community Chest', type: 'chance', city: null },
  22: { name: 'Chance', type: 'chance', city: null },
  33: { name: 'Community Chest', type: 'chance', city: null },
  36: { name: 'Chance', type: 'chance', city: null },
};

interface MonopolyBoardProps {
  boardSize: number;
  properties: Property[];
  players: Array<{
    id: string;
    name: string;
    color: string;
    position: number;
    inJail: boolean;
    isBankrupt: boolean;
  }>;
  currentPlayerTurn: string;
  onTileClick?: (property: Property | null) => void;
}

interface TileProps {
  property: Property | null;
  position: number;
  players: Array<{
    id: string;
    name: string;
    color: string;
    position: number;
    inJail: boolean;
    isBankrupt: boolean;
  }>;
  isCorner?: boolean;
  side?: string;
  index?: number;
  onClick?: () => void;
}

function Tile({ property, position, players, isCorner = false, onClick }: TileProps) {
  const tilePlayers = players.filter(p => p.position === position);
  
  const getTileColor = () => {
    if (!property) return 'bg-gray-600';
    
    switch (property.type) {
      case 'GO': return 'bg-green-600';
      case 'JAIL': return 'bg-gray-700';
      case 'FREE_PARKING': return 'bg-blue-600';
      case 'GO_TO_JAIL': return 'bg-red-600';
      case 'TAX': return 'bg-yellow-600';
      case 'CHANCE': return 'bg-orange-600';
      case 'COMMUNITY_CHEST': return 'bg-purple-600';
      case 'RAILROAD': return 'bg-gray-800';
      case 'UTILITY': return 'bg-indigo-600';
      case 'PROPERTY':
        if (property.colorGroup) {
          const colorMap: Record<string, string> = {
            'brown': 'bg-amber-800',
            'lightblue': 'bg-sky-400',
            'pink': 'bg-pink-400',
            'orange': 'bg-orange-500',
            'red': 'bg-red-600',
            'yellow': 'bg-yellow-400',
            'green': 'bg-green-600',
            'blue': 'bg-blue-800',
          };
          return colorMap[property.colorGroup] || 'bg-gray-600';
        }
        return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getCityData = (position: number) => {
    return WORLD_CITIES_DATA[position as keyof typeof WORLD_CITIES_DATA] || null;
  };

  const getTileContent = () => {
    const cityData = getCityData(position);
    
    if (cityData) {
      // For special squares
      if (cityData.type === 'special') {
        if (position === 0) return 'GO';
        if (position === 10) return 'JAIL';
        if (position === 20) return 'FREE\nPARKING';
        if (position === 30) return 'GO TO\nJAIL';
      }
      
      // For properties, show city name
      if (cityData.type === 'property') {
        return cityData.name;
      }
      
      // For railroads, utilities, etc.
      return cityData.name;
    }
    
    // Fallback to original logic
    if (!property) return '';
    
    if (property.type === 'GO') return 'GO';
    if (property.type === 'JAIL') return 'JAIL';
    if (property.type === 'FREE_PARKING') return 'FREE\nPARKING';
    if (property.type === 'GO_TO_JAIL') return 'GO TO\nJAIL';
    if (property.type === 'TAX') return 'TAX';
    if (property.type === 'CHANCE') return 'CHANCE';
    if (property.type === 'COMMUNITY_CHEST') return 'COMMUNITY\nCHEST';
    
    return property.name;
  };

  return (
    <div
      className={`
        relative border border-gray-800 flex flex-col items-center justify-center 
        text-xs font-medium text-white text-center p-1 cursor-pointer
        transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${getTileColor()}
        ${isCorner ? 'w-16 h-16' : 'w-12 h-12'}
      `}
      onClick={onClick}
    >
      <div className="text-[8px] leading-tight whitespace-pre-line">
        {getTileContent()}
      </div>
      
      {/* Show country for international cities */}
      {(() => {
        const cityData = getCityData(position);
        return cityData?.country && cityData.type === 'property' && (
          <div className="absolute bottom-3 left-0 right-0 text-[6px] text-gray-300 px-1">
            {cityData.country}
          </div>
        );
      })()}
      
      {property?.price && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-[6px]">
          ${property.price}
        </div>
      )}
      
      {property?.ownerId && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-white border border-gray-800" />
      )}
      
      {property && property.houses && property.houses > 0 && (
        <div className="absolute top-1 left-1 text-[6px]">
          🏠{property.houses}
        </div>
      )}
      
      {property?.hasHotel && (
        <div className="absolute top-1 left-1 text-[6px]">
          🏨
        </div>
      )}
      
      <div className="absolute bottom-0 right-0 flex gap-0.5">
        {tilePlayers.slice(0, 3).map((player) => (
          <div
            key={player.id}
            className={`w-2 h-2 rounded-full ${player.color} border border-gray-800`}
            title={player.name}
          />
        ))}
        {tilePlayers.length > 3 && (
          <div className="w-2 h-2 rounded-full bg-gray-400 border border-gray-800 text-[4px] flex items-center justify-center">
            +{tilePlayers.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonopolyBoard({ boardSize, properties, players, currentPlayerTurn, onTileClick }: MonopolyBoardProps) {
  const propertyMap = new Map(properties.map(p => [p.position, p]));
  
  const createBoardLayout = (): Array<{
    position: number;
    property: Property | null;
    isCorner: boolean;
    side: string;
    index: number;
  }> => {
    const tiles: Array<{
      position: number;
      property: Property | null;
      isCorner: boolean;
      side: string;
      index: number;
    }> = [];
    const sideLength = Math.floor(boardSize / 4);
    
    // Top row (left to right)
    for (let i = 0; i < sideLength; i++) {
      const position = i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 0,
        side: 'top',
        index: i,
      });
    }
    
    // Right column (top to bottom)
    for (let i = 1; i < sideLength; i++) {
      const position = sideLength + i - 1;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === sideLength - 1,
        side: 'right',
        index: i,
      });
    }
    
    // Bottom row (right to left)
    for (let i = sideLength - 2; i >= 0; i--) {
      const position = 2 * sideLength + i - 1;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 0,
        side: 'bottom',
        index: sideLength - 1 - i,
      });
    }
    
    // Left column (bottom to top)
    for (let i = sideLength - 2; i > 0; i--) {
      const position = 3 * sideLength + i - 1;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: false,
        side: 'left',
        index: sideLength - 1 - i,
      });
    }
    
    return tiles;
  };

  const boardTiles = createBoardLayout();
  const sideLength = Math.floor(boardSize / 4);
  
  const handleTileClick = (property: Property | null) => {
    if (onTileClick) {
      onTileClick(property);
    }
  };

  const getTileSize = (isCorner: boolean) => {
    return isCorner ? 'w-16 h-16' : 'w-12 h-12';
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="bg-green-800 p-2 rounded-lg shadow-2xl border-4 border-amber-800 max-w-full max-h-full">
        <div className="relative">
          {/* Board grid - using CSS Grid for better layout */}
          <div 
            className="grid gap-0 bg-green-700 p-2 rounded"
            style={{
              gridTemplateColumns: `repeat(${sideLength}, 1fr)`,
              gridTemplateRows: `repeat(${sideLength}, 1fr)`,
              width: `min(90vw, 90vh, ${sideLength * 4}rem)`,
              height: `min(90vw, 90vh, ${sideLength * 4}rem)`,
            }}
          >
          {/* Top row */}
          {boardTiles.filter(tile => tile.side === 'top').map((tile) => (
            <div 
              key={`top-${tile.position}`} 
              className="flex items-center justify-center"
              style={{ gridRow: 1, gridColumn: tile.index + 1 }}
            >
              <Tile
                property={tile.property}
                position={tile.position}
                players={players}
                isCorner={tile.isCorner}
                onClick={() => handleTileClick(tile.property)}
              />
            </div>
          ))}
          
          {/* Right column */}
          {boardTiles.filter(tile => tile.side === 'right').map((tile) => (
            <div 
              key={`right-${tile.position}`} 
              className="flex items-center justify-center"
              style={{ gridRow: tile.index + 1, gridColumn: sideLength }}
            >
              <Tile
                property={tile.property}
                position={tile.position}
                players={players}
                isCorner={tile.isCorner}
                onClick={() => handleTileClick(tile.property)}
              />
            </div>
          ))}
          
          {/* Bottom row */}
          {boardTiles.filter(tile => tile.side === 'bottom').map((tile) => (
            <div 
              key={`bottom-${tile.position}`} 
              className="flex items-center justify-center"
              style={{ gridRow: sideLength, gridColumn: sideLength - tile.index }}
            >
              <Tile
                property={tile.property}
                position={tile.position}
                players={players}
                isCorner={tile.isCorner}
                onClick={() => handleTileClick(tile.property)}
              />
            </div>
          ))}
          
          {/* Left column */}
          {boardTiles.filter(tile => tile.side === 'left').map((tile) => (
            <div 
              key={`left-${tile.position}`} 
              className="flex items-center justify-center"
              style={{ gridRow: sideLength - tile.index, gridColumn: 1 }}
            >
              <Tile
                property={tile.property}
                position={tile.position}
                players={players}
                isCorner={tile.isCorner}
                onClick={() => handleTileClick(tile.property)}
              />
            </div>
          ))}
          
          {/* Center area */}
          <div 
            className="bg-green-600 rounded-lg p-4 flex items-center justify-center text-white"
            style={{
              gridRow: `2 / ${sideLength}`,
              gridColumn: `2 / ${sideLength}`,
            }}
          >
            <div className="text-center">
              <div className="text-lg font-bold mb-2">MONOPOLY</div>
              <div className="text-xs opacity-75">Current Turn: {players.find(p => p.id === currentPlayerTurn)?.name || 'Unknown'}</div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Player indicators */}
        <div className="absolute -top-8 left-0 right-0 flex justify-center gap-2 flex-wrap">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                player.id === currentPlayerTurn
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${player.color}`} />
              <span>{player.name}</span>
              {player.inJail && <span>🔒</span>}
              {player.isBankrupt && <span>💀</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}