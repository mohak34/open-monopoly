'use client';

import { Property } from '@/types/game';

  // Standard Monopoly board positions (40 tiles)
  const WORLD_CITIES_DATA: Record<number, { 
    name: string; 
    type: string; 
    colorGroup?: string; 
    country?: string; 
    city?: null; 
  }> = {
  0: { name: 'GO', type: 'special', city: null },
  1: { name: 'Mediterranean Avenue', type: 'property', colorGroup: 'brown' },
  2: { name: 'Community Chest', type: 'chance', city: null },
  3: { name: 'Baltic Avenue', type: 'property', colorGroup: 'brown' },
  4: { name: 'Income Tax', type: 'tax', city: null },
  5: { name: 'Reading Railroad', type: 'railroad', city: null },
  6: { name: 'Oriental Avenue', type: 'property', colorGroup: 'lightblue' },
  7: { name: 'Chance', type: 'chance', city: null },
  8: { name: 'Vermont Avenue', type: 'property', colorGroup: 'lightblue' },
  9: { name: 'Connecticut Avenue', type: 'property', colorGroup: 'lightblue' },
  10:{ name: 'JAIL', type: 'special', city: null },
  11:{ name: 'St. Charles Place', type: 'property', colorGroup: 'pink' },
  12:{ name: 'Electric Company', type: 'utility', city: null },
  13:{ name: 'States Avenue', type: 'property', colorGroup: 'pink' },
  14:{ name: 'Virginia Avenue', type: 'property', colorGroup: 'pink' },
  15:{ name: 'Pennsylvania Railroad', type: 'railroad', city: null },
  16:{ name: 'St. James Place', type: 'property', colorGroup: 'orange' },
  17:{ name: 'Community Chest', type: 'chance', city: null },
  18:{ name: 'Tennessee Avenue', type: 'property', colorGroup: 'orange' },
  19:{ name: 'New York Avenue', type: 'property', colorGroup: 'orange' },
  20:{ name: 'FREE PARKING', type: 'special', city: null },
  21:{ name: 'Kentucky Avenue', type: 'property', colorGroup: 'red' },
  22:{ name: 'Chance', type: 'chance', city: null },
  23:{ name: 'Indiana Avenue', type: 'property', colorGroup: 'red' },
  24:{ name: 'Illinois Avenue', type: 'property', colorGroup: 'red' },
  25:{ name: 'B. & O. Railroad', type: 'railroad', city: null },
  26:{ name: 'Atlantic Avenue', type: 'property', colorGroup: 'yellow' },
  27:{ name: 'Ventnor Avenue', type: 'property', colorGroup: 'yellow' },
  28:{ name: 'Water Works', type: 'utility', city: null },
  29:{ name: 'Marvin Gardens', type: 'property', colorGroup: 'yellow' },
  30:{ name: 'GO TO JAIL', type: 'special', city: null },
  31:{ name: 'Pacific Avenue', type: 'property', colorGroup: 'green' },
  32:{ name: 'North Carolina Avenue', type: 'property', colorGroup: 'green' },
  33:{ name: 'Community Chest', type: 'chance', city: null },
  34:{ name: 'Pennsylvania Avenue', type: 'property', colorGroup: 'green' },
  35:{ name: 'Short Line', type: 'railroad', city: null },
  36:{ name: 'Chance', type: 'chance', city: null },
  37:{ name: 'Park Place', type: 'property', colorGroup: 'blue' },
  38:{ name: 'Luxury Tax', type: 'tax', city: null },
  39:{ name: 'Boardwalk', type: 'property', colorGroup: 'blue' },
 };
interface MonopolyBoardProps {
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
            'brown': 'bg-amber-700',
            'lightblue': 'bg-sky-400',
            'pink': 'bg-pink-500',
            'orange': 'bg-orange-500',
            'red': 'bg-red-500',
            'yellow': 'bg-yellow-400',
            'green': 'bg-green-500',
            'blue': 'bg-blue-600',
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
         relative border border-gray-800 flex flex-col items-center justify-center w-full h-full         text-xs font-medium text-white text-center p-0 cursor-pointer
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

export default function MonopolyBoard({ properties, players, currentPlayerTurn, onTileClick }: MonopolyBoardProps) {
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
    // Bottom row (left to right) - positions 0-10
    for (let i = 0; i <= 10; i++) {
      const position = i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 0 || i === 10,
        side: 'bottom',
        index: i,
      });
    }
    
    // Right column (bottom to top) - positions 11-19  
    for (let i = 1; i <= 9; i++) {
      const position = 10 + i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 9,
        side: 'right',
        index: i,
      });
    }
    
    // Top row (right to left) - positions 20-30
    for (let i = 0; i <= 10; i++) {
      const position = 30 - i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 0 || i === 10,
        side: 'top',
        index: i,
      });
    }
    
    // Left column (top to bottom) - positions 31-39
    for (let i = 1; i <= 9; i++) {
      const position = 40 - i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: false,
        side: 'left',
        index: i,
      });
    }
    
    return tiles;
  };

  const boardTiles = createBoardLayout();
  
  const handleTileClick = (property: Property | null) => {
    if (onTileClick) {
      onTileClick(property);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="bg-green-800 rounded-lg shadow-2xl border-4 border-amber-800 relative">
        <div className="relative">
          {/* Board grid - using CSS Grid for better layout */}
          <div 
            className="grid bg-green-700 rounded border-4 border-amber-800"
            style={{
              gridTemplateColumns: `repeat(11, 1fr)`,
              gridTemplateRows: `repeat(11, 1fr)`,
              width: `min(80vw, 80vh)`,
              height: `min(80vw, 80vh)`,
            }}
          >
            {/* Bottom row - GO to JAIL */}
            {boardTiles.filter(tile => tile.side === 'bottom').map((tile) => (
              <div 
                key={`bottom-${tile.position}`} 
                className="flex items-center justify-center w-full h-full"
                style={{ gridRow: 11, gridColumn: tile.index + 1 }}
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
            
            {/* Right column - after JAIL */}
            {boardTiles.filter(tile => tile.side === 'right').map((tile) => (
              <div 
                key={`right-${tile.position}`} 
                className="flex items-center justify-center w-full h-full"
                style={{ gridRow: 11 - tile.index, gridColumn: 11 }}
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
            
            {/* Top row - FREE PARKING to GO TO JAIL */}
            {boardTiles.filter(tile => tile.side === 'top').map((tile) => (
              <div 
                key={`top-${tile.position}`} 
                className="flex items-center justify-center w-full h-full"
                style={{ gridRow: 1, gridColumn: 11 - tile.index }}
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
            
            {/* Left column - before FREE PARKING */}
            {boardTiles.filter(tile => tile.side === 'left').map((tile) => (
              <div 
                key={`left-${tile.position}`} 
                className="flex items-center justify-center w-full h-full"
                style={{ gridRow: tile.index + 1, gridColumn: 1 }}
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
                gridRow: `2 / 11`,
                gridColumn: `2 / 11`,
              }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">MONOPOLY</div>
                <div className="text-sm opacity-75">Current Turn</div>
                <div className="text-lg font-semibold">{players.find(p => p.id === currentPlayerTurn)?.name || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player indicators */}
        <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2 flex-wrap pointer-events-none">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
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