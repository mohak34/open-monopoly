export interface Card {
  id: string;
  type: 'CHANCE' | 'COMMUNITY_CHEST';
  title: string;
  description: string;
  action: {
    type: 'MOVE' | 'PAY' | 'COLLECT' | 'JAIL' | 'GET_OUT_OF_JAIL' | 'MOVE_TO' | 'MOVE_BACK' | 'PROPERTY_TAX' | 'STREET_REPAIRS';
    value?: number;
    position?: number;
    perHouse?: number;
    perHotel?: number;
  };
}

export const CHANCE_CARDS: Card[] = [
  {
    id: 'chance_1',
    type: 'CHANCE',
    title: 'Advance to GO',
    description: 'Advance to GO (Collect $200)',
    action: { type: 'MOVE_TO', position: 0 }
  },
  {
    id: 'chance_2',
    type: 'CHANCE',
    title: 'Advance to Illinois Avenue',
    description: 'Advance to Illinois Avenue. If you pass GO, collect $200',
    action: { type: 'MOVE_TO', position: 24 }
  },
  {
    id: 'chance_3',
    type: 'CHANCE',
    title: 'Advance to St. Charles Place',
    description: 'Advance to St. Charles Place. If you pass GO, collect $200',
    action: { type: 'MOVE_TO', position: 11 }
  },
  {
    id: 'chance_4',
    type: 'CHANCE',
    title: 'Advance to Nearest Railroad',
    description: 'Advance to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay Wonder twice the rental to which they are otherwise entitled',
    action: { type: 'MOVE', value: 0 }
  },
  {
    id: 'chance_5',
    type: 'CHANCE',
    title: 'Advance to Nearest Utility',
    description: 'Advance to nearest Utility. If unowned, you may buy it from the Bank. If owned, throw dice and pay owner a total ten times amount thrown',
    action: { type: 'MOVE', value: 0 }
  },
  {
    id: 'chance_6',
    type: 'CHANCE',
    title: 'Bank Dividend',
    description: 'Bank pays you dividend of $50',
    action: { type: 'COLLECT', value: 50 }
  },
  {
    id: 'chance_7',
    type: 'CHANCE',
    title: 'Get Out of Jail Free',
    description: 'Get Out of Jail Free',
    action: { type: 'GET_OUT_OF_JAIL' }
  },
  {
    id: 'chance_8',
    type: 'CHANCE',
    title: 'Go Back 3 Spaces',
    description: 'Go Back 3 Spaces',
    action: { type: 'MOVE_BACK', value: 3 }
  },
  {
    id: 'chance_9',
    type: 'CHANCE',
    title: 'Go to Jail',
    description: 'Go to Jail. Go directly to Jail, do not pass GO, do not collect $200',
    action: { type: 'JAIL' }
  },
  {
    id: 'chance_10',
    type: 'CHANCE',
    title: 'Property Repairs',
    description: 'Make general repairs on all your property. For each house pay $25. For each hotel pay $100',
    action: { type: 'STREET_REPAIRS', perHouse: 25, perHotel: 100 }
  },
  {
    id: 'chance_11',
    type: 'CHANCE',
    title: 'Speeding Fine',
    description: 'Speeding fine $15',
    action: { type: 'PAY', value: 15 }
  },
  {
    id: 'chance_12',
    type: 'CHANCE',
    title: 'Advance to Reading Railroad',
    description: 'Take a trip to Reading Railroad. If you pass GO, collect $200',
    action: { type: 'MOVE_TO', position: 5 }
  },
  {
    id: 'chance_13',
    type: 'CHANCE',
    title: 'Advance to Boardwalk',
    description: 'Advance to Boardwalk',
    action: { type: 'MOVE_TO', position: 39 }
  },
  {
    id: 'chance_14',
    type: 'CHANCE',
    title: 'Property Tax',
    description: 'You have been elected Chairman of the Board. Pay each player $50',
    action: { type: 'PROPERTY_TAX', value: 50 }
  },
  {
    id: 'chance_15',
    type: 'CHANCE',
    title: 'Building Loan Matures',
    description: 'Your building loan matures. Collect $150',
    action: { type: 'COLLECT', value: 150 }
  },
  {
    id: 'chance_16',
    type: 'CHANCE',
    title: 'Crossword Competition',
    description: 'You have won a crossword competition. Collect $100',
    action: { type: 'COLLECT', value: 100 }
  }
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  {
    id: 'community_1',
    type: 'COMMUNITY_CHEST',
    title: 'Advance to GO',
    description: 'Advance to GO (Collect $200)',
    action: { type: 'MOVE_TO', position: 0 }
  },
  {
    id: 'community_2',
    type: 'COMMUNITY_CHEST',
    title: 'Bank Error',
    description: 'Bank error in your favor. Collect $200',
    action: { type: 'COLLECT', value: 200 }
  },
  {
    id: 'community_3',
    type: 'COMMUNITY_CHEST',
    title: 'Doctor Fee',
    description: 'Doctor fee. Pay $50',
    action: { type: 'PAY', value: 50 }
  },
  {
    id: 'community_4',
    type: 'COMMUNITY_CHEST',
    title: 'Stock Sale',
    description: 'From sale of stock you get $50',
    action: { type: 'COLLECT', value: 50 }
  },
  {
    id: 'community_5',
    type: 'COMMUNITY_CHEST',
    title: 'Get Out of Jail Free',
    description: 'Get Out of Jail Free',
    action: { type: 'GET_OUT_OF_JAIL' }
  },
  {
    id: 'community_6',
    type: 'COMMUNITY_CHEST',
    title: 'Go to Jail',
    description: 'Go to Jail. Go directly to jail, do not pass GO, do not collect $200',
    action: { type: 'JAIL' }
  },
  {
    id: 'community_7',
    type: 'COMMUNITY_CHEST',
    title: 'Holiday Fund',
    description: 'Holiday fund matures. Receive $100',
    action: { type: 'COLLECT', value: 100 }
  },
  {
    id: 'community_8',
    type: 'COMMUNITY_CHEST',
    title: 'Income Tax Refund',
    description: 'Income tax refund. Collect $20',
    action: { type: 'COLLECT', value: 20 }
  },
  {
    id: 'community_9',
    type: 'COMMUNITY_CHEST',
    title: 'Birthday Money',
    description: 'It is your birthday. Collect $10 from every player',
    action: { type: 'PROPERTY_TAX', value: -10 }
  },
  {
    id: 'community_10',
    type: 'COMMUNITY_CHEST',
    title: 'Life Insurance',
    description: 'Life insurance matures. Collect $100',
    action: { type: 'COLLECT', value: 100 }
  },
  {
    id: 'community_11',
    type: 'COMMUNITY_CHEST',
    title: 'Hospital Bills',
    description: 'Pay hospital fees of $100',
    action: { type: 'PAY', value: 100 }
  },
  {
    id: 'community_12',
    type: 'COMMUNITY_CHEST',
    title: 'School Fees',
    description: 'Pay school fees of $50',
    action: { type: 'PAY', value: 50 }
  },
  {
    id: 'community_13',
    type: 'COMMUNITY_CHEST',
    title: 'Consultancy Fee',
    description: 'Receive $25 consultancy fee',
    action: { type: 'COLLECT', value: 25 }
  },
  {
    id: 'community_14',
    type: 'COMMUNITY_CHEST',
    title: 'Street Repairs',
    description: 'You are assessed for street repair. $40 per house. $115 per hotel',
    action: { type: 'STREET_REPAIRS', perHouse: 40, perHotel: 115 }
  },
  {
    id: 'community_15',
    type: 'COMMUNITY_CHEST',
    title: 'Beauty Contest',
    description: 'You have won second prize in a beauty contest. Collect $10',
    action: { type: 'COLLECT', value: 10 }
  },
  {
    id: 'community_16',
    type: 'COMMUNITY_CHEST',
    title: 'Inheritance',
    description: 'You inherit $100',
    action: { type: 'COLLECT', value: 100 }
  }
];

export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomCard(type: 'CHANCE' | 'COMMUNITY_CHEST'): Card {
  const cards = type === 'CHANCE' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
  const randomIndex = Math.floor(Math.random() * cards.length);
  return cards[randomIndex];
}

export function findNearestRailroad(currentPosition: number): number {
  const railroads = [5, 15, 25, 35]; // Reading, Pennsylvania, B&O, Short Line
  
  for (const railroad of railroads) {
    if (railroad > currentPosition) {
      return railroad;
    }
  }
  return railroads[0]; // Wrap around to Reading Railroad
}

export function findNearestUtility(currentPosition: number): number {
  const utilities = [12, 28]; // Electric Company, Water Works
  
  for (const utility of utilities) {
    if (utility > currentPosition) {
      return utility;
    }
  }
  return utilities[0]; // Wrap around to Electric Company
}