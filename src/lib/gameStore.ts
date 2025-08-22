import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { GameState, Player, Property, GameRoom } from "@/types/game"

interface GameStore {
  // Game state
  gameState: GameState | null
  currentRoomId: string | null
  isConnected: boolean
  isLoading: boolean

  // Actions
  setGameState: (gameState: GameState | null) => void
  setCurrentRoomId: (roomId: string | null) => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void

  // Game actions
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  updateProperty: (propertyId: string, updates: Partial<Property>) => void
  addTransaction: (transaction: any) => void
  rollDice: (diceRoll: [number, number]) => void
  endTurn: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      gameState: null,
      currentRoomId: null,
      isConnected: false,
      isLoading: false,

      // Basic setters
      setGameState: (gameState) => set({ gameState }),
      setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),
      setConnected: (connected) => set({ isConnected: connected }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Game actions
      updatePlayer: (playerId, updates) => {
        const { gameState } = get()
        if (!gameState) return

        const updatedPlayers = gameState.gameRoom.players.map(player =>
          player.id === playerId ? { ...player, ...updates } : player
        )

        set({
          gameState: {
            ...gameState,
            gameRoom: {
              ...gameState.gameRoom,
              players: updatedPlayers
            }
          }
        })
      },

      updateProperty: (propertyId, updates) => {
        const { gameState } = get()
        if (!gameState) return

        const updatedProperties = gameState.properties.map(property =>
          property.id === propertyId ? { ...property, ...updates } : property
        )

        set({
          gameState: {
            ...gameState,
            properties: updatedProperties
          }
        })
      },

      addTransaction: (transaction) => {
        // This would typically be handled by the socket connection
        // For now, we'll just log it
        console.log('Transaction added:', transaction)
      },

      rollDice: (diceRoll) => {
        const { gameState } = get()
        if (!gameState) return

        set({
          gameState: {
            ...gameState,
            diceRolled: true,
            lastDiceRoll: diceRoll
          }
        })
      },

      endTurn: () => {
        const { gameState } = get()
        if (!gameState) return

        const activePlayers = gameState.gameRoom.players.filter(p => !p.isBankrupt)
        const currentIndex = activePlayers.findIndex(p => p.id === gameState.currentPlayerTurn)
        const nextIndex = (currentIndex + 1) % activePlayers.length
        const nextPlayer = activePlayers[nextIndex]

        set({
          gameState: {
            ...gameState,
            currentPlayerTurn: nextPlayer.id,
            diceRolled: false
          }
        })
      },

      resetGame: () => set({
        gameState: null,
        currentRoomId: null,
        isConnected: false,
        isLoading: false
      })
    }),
    {
      name: 'game-store'
    }
  )
)