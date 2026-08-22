'use client'

import { useState, useEffect } from 'react'
import { ShopSkeleton } from '@/components/dashboard/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Image,
  Palette,
  BarChart3,
  Sparkles,
  Crown,
  Star,
  Lock,
  Check,
  ChevronRight,
  Gem,
  Zap,
  Aperture,
  Volume2,
  Package,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInventoryStore } from '@/stores/use-inventory'

type ShopCategory = 'all' | 'banners' | 'themes' | 'progress' | 'effects' | 'badges' | 'frames' | 'sounds'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  category: ShopCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: React.ElementType
  preview?: string
  owned?: boolean
  featured?: boolean
}

const CATEGORIES: { id: ShopCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Items', icon: ShoppingBag },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'frames', label: 'Avatar Frames', icon: Aperture },
  { id: 'themes', label: 'Room Themes', icon: Palette },
  { id: 'progress', label: 'Progress Bars', icon: BarChart3 },
  { id: 'effects', label: 'Effects', icon: Sparkles },
  { id: 'badges', label: 'Badges', icon: Crown },
  { id: 'sounds', label: 'Sound Packs', icon: Volume2 }
]

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'banner-aurora',
    name: 'Aurora Borealis',
    description: 'A stunning animated northern lights banner for your profile',
    price: 500,
    category: 'banners',
    rarity: 'epic',
    icon: Image,
    featured: true
  },
  {
    id: 'banner-neon-city',
    name: 'Neon Cityscape',
    description: 'Cyberpunk city skyline with glowing neon reflections',
    price: 350,
    category: 'banners',
    rarity: 'rare',
    icon: Image
  },
  {
    id: 'banner-ocean',
    name: 'Deep Ocean',
    description: 'Calm deep ocean waves with bioluminescent particles',
    price: 200,
    category: 'banners',
    rarity: 'common',
    icon: Image
  },
  {
    id: 'theme-midnight',
    name: 'Midnight Lounge',
    description: 'Dark ambient room theme with soft purple highlights',
    price: 750,
    category: 'themes',
    rarity: 'epic',
    icon: Palette,
    featured: true
  },
  {
    id: 'theme-forest',
    name: 'Enchanted Forest',
    description: 'Nature-inspired room with floating particle effects',
    price: 400,
    category: 'themes',
    rarity: 'rare',
    icon: Palette
  },
  {
    id: 'theme-retro',
    name: 'Retro Arcade',
    description: 'Pixel art inspired room theme with 8-bit aesthetics',
    price: 300,
    category: 'themes',
    rarity: 'rare',
    icon: Palette
  },
  {
    id: 'progress-flame',
    name: 'Flame Trail',
    description: 'Your XP bar leaves a trail of animated flames',
    price: 600,
    category: 'progress',
    rarity: 'epic',
    icon: BarChart3
  },
  {
    id: 'progress-rainbow',
    name: 'Rainbow Shift',
    description: 'Smoothly shifting rainbow gradient progress bar',
    price: 250,
    category: 'progress',
    rarity: 'rare',
    icon: BarChart3
  },
  {
    id: 'progress-electric',
    name: 'Electric Pulse',
    description: 'Pulsing electric blue progress bar with spark effects',
    price: 150,
    category: 'progress',
    rarity: 'common',
    icon: BarChart3
  },
  {
    id: 'effect-confetti',
    name: 'Confetti Burst',
    description: 'Confetti celebration when you level up or achieve something',
    price: 200,
    category: 'effects',
    rarity: 'common',
    icon: Sparkles
  },
  {
    id: 'effect-particles',
    name: 'Stellar Particles',
    description: 'Floating star particles around your avatar',
    price: 450,
    category: 'effects',
    rarity: 'rare',
    icon: Sparkles
  },
  {
    id: 'effect-aura',
    name: 'Cosmic Aura',
    description: 'A legendary glowing cosmic aura around your profile',
    price: 1200,
    category: 'effects',
    rarity: 'legendary',
    icon: Sparkles,
    featured: true
  },
  {
    id: 'badge-diamond',
    name: 'Diamond Supporter',
    description: 'Exclusive diamond badge showing your premium status',
    price: 1000,
    category: 'badges',
    rarity: 'legendary',
    icon: Crown
  },
  {
    id: 'badge-og',
    name: 'OG Member',
    description: 'Early supporter badge with holographic effect',
    price: 800,
    category: 'badges',
    rarity: 'epic',
    icon: Crown
  },
  {
    id: 'badge-creator',
    name: 'Room Creator',
    description: 'Special badge for active room creators',
    price: 300,
    category: 'badges',
    rarity: 'rare',
    icon: Crown
  },
  {
    id: 'frame-neon',
    name: 'Neon Hexagon',
    description: 'A glowing cyberpunk frame for your profile picture',
    price: 400,
    category: 'frames',
    rarity: 'epic',
    icon: Aperture,
    featured: true
  },
  {
    id: 'frame-gold',
    name: 'Golden Ring',
    description: 'Show your wealth with this solid gold profile border',
    price: 800,
    category: 'frames',
    rarity: 'legendary',
    icon: Aperture
  },
  {
    id: 'frame-glitch',
    name: 'Glitch Border',
    description: 'An unstable, shifting digital border',
    price: 250,
    category: 'frames',
    rarity: 'rare',
    icon: Aperture
  },
  {
    id: 'sound-mech',
    name: 'Mecha Pack',
    description: 'Heavy mechanical thuds when joining and leaving rooms',
    price: 500,
    category: 'sounds',
    rarity: 'epic',
    icon: Volume2
  },
  {
    id: 'sound-ethereal',
    name: 'Ethereal Chimes',
    description: 'Soft angelic chimes for a peaceful chat experience',
    price: 350,
    category: 'sounds',
    rarity: 'common',
    icon: Volume2
  }
]

const RARITY_STYLES = {
  common: {
    border: 'border-zinc-500/20',
    bg: 'bg-zinc-500/5',
    text: 'text-zinc-400',
    label: 'Common'
  },
  rare: {
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    text: 'text-blue-400',
    label: 'Rare'
  },
  epic: {
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    text: 'text-purple-400',
    label: 'Epic'
  },
  legendary: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    label: 'Legendary'
  }
}


export function ShopPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all')
  const [viewMode, setViewMode] = useState<'shop' | 'inventory'>('shop')
  const { coins: userCoins, canClaimDaily, claimDaily, ownedItems } = useInventoryStore()
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <ShopSkeleton />
  }

  const handleClaim = () => {
    claimDaily()
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const itemsWithOwnership = SHOP_ITEMS.map((item) => ({
    ...item,
    owned: ownedItems.includes(item.id)
  }))

  const filteredItems =
    activeCategory === 'all'
      ? itemsWithOwnership
      : itemsWithOwnership.filter((item) => item.category === activeCategory)

  const featuredItems = itemsWithOwnership.filter((item) => item.featured)

  return (
    <div className="space-y-6 p-6 pt-10 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-primary" strokeWidth={1.5} />
            Shop
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your profile, rooms, and experience
          </p>
        </div>

        {/* View Toggle & Coin Balance */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => setViewMode('shop')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                viewMode === 'shop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Shop
            </button>
            <button
              onClick={() => setViewMode('inventory')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                viewMode === 'inventory' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Package className="w-3.5 h-3.5" />
              Inventory
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/15">
            <Gem className="w-4 h-4 text-amber-400" strokeWidth={2} />
            <span className="text-sm font-semibold text-amber-400 tabular-nums">
              {userCoins.toLocaleString()}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-amber-400/50 font-medium">
              coins
            </span>
          </div>
        </div>
      </motion.div>

      {/* Mobile Toggle */}
      <div className="flex sm:hidden bg-muted p-1 rounded-xl mt-[-10px] mb-4">
        <button
          onClick={() => setViewMode('shop')}
          className={cn(
            'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5',
            viewMode === 'shop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Shop
        </button>
        <button
           onClick={() => setViewMode('inventory')}
           className={cn(
             'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5',
             viewMode === 'inventory' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
           )}
        >
          <Package className="w-3.5 h-3.5" />
          Inventory
        </button>
      </div>

      {viewMode === 'inventory' ? (
        <InventoryView items={itemsWithOwnership as any} />
      ) : (
        <>
          {/* Daily Reward Banner */}
          <AnimatePresence>
            {canClaimDaily() && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="overflow-hidden mb-2"
              >
                <div className="relative rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl relative shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 absolute animate-ping top-0 right-0 opacity-50" />
                      <Gem className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Daily Reward Available!</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Claim your daily 200 coins to buy premium items.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClaim}
                    className="relative overflow-hidden group px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] shrink-0"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-1.5 z-10">
                      Claim 200 <Gem className="w-3 h-3" />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Featured Section */}
          {activeCategory === 'all' && featuredItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" strokeWidth={2} />
                <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                  Featured
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {featuredItems.map((item) => (
                  <FeaturedCard key={item.id} item={item} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1"
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/15'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {cat.label}
                </button>
              )
            })}
          </motion.div>

          {/* Items Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, i) => (
                <ShopItemCard key={item.id} item={item} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <ShoppingBag
                className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3"
                strokeWidth={1}
              />
              <p className="text-muted-foreground text-sm">No items in this category yet</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FeaturedCard({
  item
}: {
  item: ShopItem
}): React.JSX.Element {
  const { coins: userCoins, buyItem } = useInventoryStore()
  const isOwned = item.owned
  const canAfford = userCoins >= item.price
  
  const handleBuy = () => {
    if (!isOwned && canAfford) {
      buyItem(item.id, item.price)
    }
  }

  const rarity = RARITY_STYLES[item.rarity]
  const Icon = item.icon

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5 bg-card border transition-all hover:shadow-lg group cursor-pointer',
        isOwned ? 'border-primary/30' : rarity.border
      )}
    >
      {/* Rarity glow */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-30',
          rarity.bg
        )}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2 rounded-lg', rarity.bg)}>
            <Icon className={cn('w-5 h-5', rarity.text)} strokeWidth={1.5} />
          </div>
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
              rarity.bg,
              rarity.text
            )}
          >
            {rarity.label}
          </span>
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-1">{item.name}</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Gem className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
            <span className="text-sm font-bold text-foreground tabular-nums">{item.price}</span>
          </div>
          {isOwned ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
              <Check className="w-3 h-3" strokeWidth={2} />
              Owned
            </span>
          ) : (
            <button
              onClick={handleBuy}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                canAfford
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {canAfford ? (
                <>
                  <Zap className="w-3 h-3" strokeWidth={2} />
                  Buy
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  Need more
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ShopItemCard({
  item,
  index
}: {
  item: ShopItem
  index: number
}): React.JSX.Element {
  const { coins: userCoins, buyItem } = useInventoryStore()
  const isOwned = item.owned
  const canAfford = userCoins >= item.price
  const rarity = RARITY_STYLES[item.rarity]
  const Icon = item.icon

  const handleBuy = () => {
    if (!isOwned && canAfford) {
      buyItem(item.id, item.price)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        'relative rounded-xl p-4 bg-card border transition-all hover:shadow-md group cursor-pointer',
        isOwned ? 'border-primary/20 bg-primary/[0.02]' : rarity.border
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg shrink-0', isOwned ? 'bg-primary/10' : rarity.bg)}>
          <Icon
            className={cn('w-4 h-4', isOwned ? 'text-primary' : rarity.text)}
            strokeWidth={1.5}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-foreground text-sm truncate">{item.name}</h3>
            <span
              className={cn(
                'text-[8px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full shrink-0',
                rarity.bg,
                rarity.text
              )}
            >
              {rarity.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
            {item.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <Gem className="w-3 h-3 text-amber-400" strokeWidth={2} />
          <span className="text-xs font-semibold text-foreground tabular-nums">{item.price}</span>
        </div>

        {isOwned ? (
          <span className="flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md">
            <Check className="w-3 h-3" strokeWidth={2} />
            Owned
          </span>
        ) : (
          <button
            onClick={handleBuy}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
              canAfford
                ? 'bg-primary/10 text-primary hover:bg-primary/15 border border-primary/15'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {canAfford ? 'Purchase' : 'Locked'}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function InventoryView({ items }: { items: (ShopItem & { owned: boolean })[] }): React.JSX.Element {
  const { equippedItems, equipItem } = useInventoryStore()
  
  const ownedItems = items.filter(i => i.owned)

  if (ownedItems.length === 0) {
    return (
      <div className="text-center py-20 animate-in fade-in duration-500">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
        <h3 className="text-lg font-medium text-foreground mb-1">Your inventory is empty</h3>
        <p className="text-muted-foreground text-sm">Head back to the shop to buy some cool items!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {CATEGORIES.filter(c => c.id !== 'all').map(category => {
        const categoryItems = ownedItems.filter(i => i.category === category.id)
        if (categoryItems.length === 0) return null

        const Icon = category.icon
        const equippedItemId = equippedItems[category.id]

        return (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{category.label}</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryItems.map(item => {
                const isEquipped = equippedItemId === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => equipItem(category.id, item.id)}
                    className={cn(
                      'relative p-4 rounded-xl border text-left transition-all hover:border-primary/40 focus:outline-none flex flex-col',
                      isEquipped ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'bg-card border-border hover:bg-muted/50'
                    )}
                  >
                    {isEquipped && (
                      <div className="absolute top-3 right-3 shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <item.icon className={cn('w-6 h-6 mb-3 shrink-0', isEquipped ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.5} />
                    <h3 className={cn('font-semibold text-sm mb-1 line-clamp-1', isEquipped ? 'text-primary' : 'text-foreground')}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
