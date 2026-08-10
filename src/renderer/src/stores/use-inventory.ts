import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface InventoryState {
  coins: number
  ownedItems: string[]
  equippedItems: Record<string, string | null>
  lastDailyClaim: string | null
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  buyItem: (itemId: string, price: number) => boolean
  equipItem: (category: string, itemId: string) => void
  claimDaily: () => void
  canClaimDaily: () => boolean
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      coins: 1250, // Starting balance
      ownedItems: ['banner-ocean'], // Start with one initial item
      equippedItems: {
        banners: 'banner-ocean',
        themes: null,
        progress: null,
        effects: null,
        badges: null,
        frames: null,
        sounds: null
      },
      lastDailyClaim: null,

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      
      spendCoins: (amount) => {
        const { coins } = get()
        if (coins >= amount) {
          set({ coins: coins - amount })
          return true
        }
        return false
      },

      buyItem: (itemId, price) => {
        const { ownedItems, spendCoins } = get()
        if (ownedItems.includes(itemId)) return false // Already owned
        
        if (spendCoins(price)) {
          set((state) => ({
            ownedItems: [...state.ownedItems, itemId]
          }))
          return true
        }
        return false
      },

      equipItem: (category, itemId) => {
        set((state) => ({
          equippedItems: { ...state.equippedItems, [category]: itemId }
        }))
      },

      canClaimDaily: () => {
        const { lastDailyClaim } = get()
        if (!lastDailyClaim) return true
        
        const lastClaimDate = new Date(lastDailyClaim)
        const today = new Date()
        
        return (
          lastClaimDate.getDate() !== today.getDate() ||
          lastClaimDate.getMonth() !== today.getMonth() ||
          lastClaimDate.getFullYear() !== today.getFullYear()
        )
      },

      claimDaily: () => {
        const { canClaimDaily } = get()
        if (canClaimDaily()) {
          set((state) => ({
            coins: state.coins + 200, // Grant 200 daily coins
            lastDailyClaim: new Date().toISOString()
          }))
        }
      }
    }),
    {
      name: 'inventory-storage'
    }
  )
)
