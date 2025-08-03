'use client';

import { Property } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Dice1 as Dice, DollarSign } from 'lucide-react';

  // Standard Monopoly board positions (40 tiles) with country flags
  const WORLD_CITIES_DATA: Record<number, { 
    name: string; 
    type: string; 
    colorGroup?: string; 
    country?: string; 
    city?: null; 
    flag?: string;
  }> = {
  0: { name: 'GO', type: 'special', city: null },
  1: { name: 'Mediterranean Avenue', type: 'property', colorGroup: 'brown', flag: '🇪🇸' },
  2: { name: 'Community Chest', type: 'chance', city: null },
  3: { name: 'Baltic Avenue', type: 'property', colorGroup: 'brown', flag: '🇱🇹' },
  4: { name: 'Income Tax', type: 'tax', city: null },
  5: { name: 'Reading Railroad', type: 'railroad', city: null, flag: '🚂' },
  6: { name: 'Oriental Avenue', type: 'property', colorGroup: 'lightblue', flag: '🇨🇳' },
  7: { name: 'Chance', type: 'chance', city: null },
  8: { name: 'Vermont Avenue', type: 'property', colorGroup: 'lightblue', flag: '🇺🇸' },
  9: { name: 'Connecticut Avenue', type: 'property', colorGroup: 'lightblue', flag: '🇺🇸' },
  10:{ name: 'JAIL', type: 'special', city: null },
  11:{ name: 'St. Charles Place', type: 'property', colorGroup: 'pink', flag: '🇫🇷' },
  12:{ name: 'Electric Company', type: 'utility', city: null, flag: '⚡' },
  13:{ name: 'States Avenue', type: 'property', colorGroup: 'pink', flag: '🇺🇸' },
  14:{ name: 'Virginia Avenue', type: 'property', colorGroup: 'pink', flag: '🇺🇸' },
  15:{ name: 'Pennsylvania Railroad', type: 'railroad', city: null, flag: '🚂' },
  16:{ name: 'St. James Place', type: 'property', colorGroup: 'orange', flag: '🇬🇧' },
  17:{ name: 'Community Chest', type: 'chance', city: null },
  18:{ name: 'Tennessee Avenue', type: 'property', colorGroup: 'orange', flag: '🇺🇸' },
  19:{ name: 'New York Avenue', type: 'property', colorGroup: 'orange', flag: '🇺🇸' },
  20:{ name: 'FREE PARKING', type: 'special', city: null },
  21:{ name: 'Kentucky Avenue', type: 'property', colorGroup: 'red', flag: '🇺🇸' },
  22:{ name: 'Chance', type: 'chance', city: null },
  23:{ name: 'Indiana Avenue', type: 'property', colorGroup: 'red', flag: '🇺🇸' },
  24:{ name: 'Illinois Avenue', type: 'property', colorGroup: 'red', flag: '🇺🇸' },
  25:{ name: 'B. & O. Railroad', type: 'railroad', city: null, flag: '🚂' },
  26:{ name: 'Atlantic Avenue', type: 'property', colorGroup: 'yellow', flag: '🇺🇸' },
  27:{ name: 'Ventnor Avenue', type: 'property', colorGroup: 'yellow', flag: '🇺🇸' },
  28:{ name: 'Water Works', type: 'utility', city: null, flag: '💧' },
  29:{ name: 'Marvin Gardens', type: 'property', colorGroup: 'yellow', flag: '🇺🇸' },
  30:{ name: 'GO TO JAIL', type: 'special', city: null },
  31:{ name: 'Pacific Avenue', type: 'property', colorGroup: 'green', flag: '🇺🇸' },
  32:{ name: 'North Carolina Avenue', type: 'property', colorGroup: 'green', flag: '🇺🇸' },
  33:{ name: 'Community Chest', type: 'chance', city: null },
  34:{ name: 'Pennsylvania Avenue', type: 'property', colorGroup: 'green', flag: '🇺🇸' },
  35:{ name: 'Short Line', type: 'railroad', city: null, flag: '🚂' },
  36:{ name: 'Chance', type: 'chance', city: null },
  37:{ name: 'Park Place', type: 'property', colorGroup: 'blue', flag: '🇬🇧' },
  38:{ name: 'Luxury Tax', type: 'tax', city: null },
  39:{ name: 'Boardwalk', type: 'property', colorGroup: 'blue', flag: '🇺🇸' },
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
    cash: number;
    jailTurns: number;
  }>;
  currentPlayerTurn: string;
  gameState?: any;
  currentPlayer?: any;
  canRollDice?: boolean;
  canEndTurn?: boolean;
  canPayBail?: boolean;
  canUseJailCard?: boolean;
  rollDice?: () => void;
  endTurn?: () => void;
  payBail?: () => void;
  useGetOutOfJailCard?: () => void;
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
    if (!property) return 'bg-gray-800';
    
    switch (property.type) {
      case 'GO': return 'bg-gray-800';
      case 'JAIL': return 'bg-gray-900';
      case 'FREE_PARKING': return 'bg-gray-800';
      case 'GO_TO_JAIL': return 'bg-gray-900';
      case 'TAX': return 'bg-gray-700';
      case 'CHANCE': return 'bg-gray-700';
      case 'COMMUNITY_CHEST': return 'bg-gray-700';
      case 'RAILROAD': return 'bg-gray-900';
      case 'UTILITY': return 'bg-gray-800';
      case 'PROPERTY':
        // All properties will have the same dark color for now
        return 'bg-gray-700';
      default: return 'bg-gray-800';
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
         relative border border-gray-800 flex flex-col items-center justify-center w-full h-full text-xs font-bold text-white text-center p-0 cursor-pointer
        ${getTileColor()}
        ${isCorner ? 'w-20 h-20' : 'w-16 h-16'}
      `}
      onClick={onClick}
    >
      <div className="text-[10px] leading-tight whitespace-pre-line font-bold">
        {getTileContent()}
      </div>
      
      {/* Show country flags for properties */}
      {(() => {
        const cityData = getCityData(position);
        return cityData?.flag && (
          <div className="absolute top-1 right-1 text-xs">
            {cityData.flag}
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

export default function MonopolyBoard({ 
  properties, 
  players, 
  currentPlayerTurn, 
  gameState,
  currentPlayer,
  canRollDice,
  canEndTurn,
  canPayBail,
  canUseJailCard,
  rollDice,
  endTurn,
  payBail,
  useGetOutOfJailCard,
  onTileClick 
}: MonopolyBoardProps) {
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
    
    // Top row (left to right) - positions 0-10 (starting from top-left corner)
    for (let i = 0; i <= 10; i++) {
      const position = i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 0 || i === 10,
        side: 'top',
        index: i,
      });
    }
    
    // Right column (top to bottom) - positions 11-19  
    for (let i = 1; i <= 9; i++) {
      const position = 10 + i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: false,
        side: 'right',
        index: i,
      });
    }
    
    // Bottom row (right to left) - positions 20-30
    for (let i = 0; i <= 10; i++) {
      const position = 20 + i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: i === 0 || i === 10,
        side: 'bottom',
        index: 10 - i, // Reverse for right-to-left ordering
      });
    }
    
    // Left column (bottom to top) - positions 31-39
    for (let i = 1; i <= 9; i++) {
      const position = 30 + i;
      tiles.push({
        position,
        property: propertyMap.get(position) || null,
        isCorner: false,
        side: 'left',
        index: 10 - i, // Reverse for bottom-to-top ordering
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
              width: `min(90vw, 90vh)`,
              height: `min(90vw, 90vh)`,
            }}
          >
            {/* Top row - starting from top-left */}
            {boardTiles.filter(tile => tile.side === 'top').map((tile) => (
              <div 
                key={`top-${tile.position}`} 
                className="flex items-center justify-center w-full h-full"
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
            
            {/* Right column - after top-right corner */}
            {boardTiles.filter(tile => tile.side === 'right').map((tile) => (
              <div 
                key={`right-${tile.position}`} 
                className="flex items-center justify-center w-full h-full"
                style={{ gridRow: tile.index + 1, gridColumn: 11 }}
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
            
            {/* Bottom row - from bottom-right to bottom-left */}
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
            
            {/* Left column - from bottom-left to top-left */}
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
            
            {/* Center area with game controls */}
            <div 
              className="bg-green-600 rounded-lg p-4 flex flex-col items-center justify-center text-white"
              style={{
                gridRow: `2 / 11`,
                gridColumn: `2 / 11`,
              }}
            >
              <div className="text-center space-y-3">
                <div className="text-xl font-bold mb-2">Current Turn</div>
                <div className="text-lg font-semibold">{players.find(p => p.id === currentPlayerTurn)?.name || 'Unknown'}</div>
                
                {gameState?.diceRolled && (
                  <div className="bg-green-700 p-3 rounded-lg">
                    <div className="text-white mb-2 text-sm">Last Roll:</div>
                    <div className="flex justify-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-black font-bold text-lg shadow-lg">
                        {gameState.lastDiceRoll[0]}
                      </div>
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-black font-bold text-lg shadow-lg">
                        {gameState.lastDiceRoll[1]}
                      </div>
                    </div>
                    <div className="text-white font-bold">
                      Total: {gameState.lastDiceRoll[0] + gameState.lastDiceRoll[1]}
                    </div>
                  </div>
                )}
                
                {currentPlayer?.inJail && (
                  <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3">
                    <div className="text-yellow-200 text-sm font-medium mb-3">
                      🔒 You are in jail! ({currentPlayer.jailTurns}/3 attempts)
                    </div>
                    <div className="space-y-2">
                      {canRollDice && rollDice && (
                        <Button
                          onClick={rollDice}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <Dice className="w-4 h-4 mr-2" />
                          Roll for Doubles
                        </Button>
                      )}
                      {canPayBail && payBail && (
                        <Button
                          onClick={payBail}
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                          size="sm"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pay $50 Bail
                        </Button>
                      )}
                      {canUseJailCard && useGetOutOfJailCard && (
                        <Button
                          onClick={useGetOutOfJailCard}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          🎫 Use Jail Free Card
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {canRollDice && !currentPlayer?.inJail && rollDice && (
                  <Button
                    onClick={rollDice}
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-6 py-3"
                    size="default"
                  >
                    <Dice className="w-5 h-5 mr-2" />
                    Roll Dice
                  </Button>
                )}
                
                {canEndTurn && endTurn && (
                  <Button
                    onClick={endTurn}
                    className="bg-gray-600 hover:bg-gray-700 text-lg px-6 py-3"
                    size="default"
                  >
                    End Turn
                  </Button>
                )}
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