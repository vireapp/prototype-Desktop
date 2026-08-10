/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react'
import { motion } from 'framer-motion'
import { TicTacToe } from './tic-tac-toe'
import { RockPaperScissors } from './rock-paper-scissors'
import { WordRace } from './word-race'
import { cn } from '@/lib/utils'
import {
  Gamepad2,
  Grid3X3,
  Hand,
  BrainCircuit,
  Trophy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  HelpCircle,
  Users,
  Palette,
  Keyboard,
  Sparkles,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Globe
} from 'lucide-react'
import { ExternalGameFrame } from './external-game-frame'

const WEB_GAMES = [
  // --- Action & IO (Stable) ---
  {
    id: 'diep-io',
    title: 'Diep.io',
    description: 'Classic tank shooter. Upgrade and destroy.',
    url: 'https://diep.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-xl">
        🔫
      </div>
    ),
    category: 'Action & IO',
    players: 'Shooter',
    gradient: 'from-blue-600/20 to-indigo-600/20',
    border: 'group-hover:border-blue-500/50',
    glow: 'group-hover:shadow-blue-500/20'
  },

  {
    id: 'florr-io',
    title: 'Florr.io',
    description: 'Battle flowers in this unique garden shooter.',
    url: 'https://florr.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-xl">
        🌸
      </div>
    ),
    category: 'Action & IO',
    players: 'IO',
    gradient: 'from-pink-500/20 to-rose-500/20',
    border: 'group-hover:border-pink-500/50',
    glow: 'group-hover:shadow-pink-500/20'
  },
  {
    id: 'bonk-io',
    title: 'Bonk.io',
    description: 'Physics-based multiplayer game.',
    url: 'https://bonk.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-xl">
        ⚽
      </div>
    ),
    category: 'Action & IO',
    players: 'Physics',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    border: 'group-hover:border-amber-500/50',
    glow: 'group-hover:shadow-amber-500/20'
  },
  {
    id: 'krunker',
    title: 'Krunker',
    description: 'Classic pixelated competitive FPS.',
    url: 'https://krunker.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-orange-600 border-2 border-white flex items-center justify-center text-xl">
        🔫
      </div>
    ),
    category: 'Action & IO',
    players: 'FPS',
    gradient: 'from-orange-600/20 to-red-600/20',
    border: 'group-hover:border-orange-500/50',
    glow: 'group-hover:shadow-orange-500/20'
  },
  {
    id: 'shell-shockers',
    title: 'Shell Shockers',
    description: "The world's top egg-based shooter.",
    url: 'https://shellshock.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center text-xl">
        🥚
      </div>
    ),
    category: 'Action & IO',
    players: 'FPS',
    gradient: 'from-yellow-400/20 to-orange-400/20',
    border: 'group-hover:border-yellow-500/50',
    glow: 'group-hover:shadow-yellow-500/20'
  },
  {
    id: 'smash-karts',
    title: 'Smash Karts',
    description: '3D multiplayer kart battle game.',
    url: 'https://smashkarts.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-xl">
        🏎️
      </div>
    ),
    category: 'Action & IO',
    players: 'Racing',
    gradient: 'from-blue-600/20 to-indigo-600/20',
    border: 'group-hover:border-blue-500/50',
    glow: 'group-hover:shadow-blue-500/20'
  },

  // --- Social & Strategy ---
  {
    id: 'betrayal',
    title: 'Betrayal.io',
    description: 'Social deduction game. Find the betrayer!',
    url: 'https://betrayal.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-xl">
        🕵️
      </div>
    ),
    category: 'Social & Strategy',
    players: 'Social',
    gradient: 'from-red-600/20 to-orange-600/20',
    border: 'group-hover:border-red-500/50',
    glow: 'group-hover:shadow-red-500/20'
  },
  {
    id: 'gartic-io',
    title: 'Gartic.io',
    description: 'Draw, guess, and win!',
    url: 'https://gartic.io',
    icon: <Palette className="w-8 h-8 text-blue-400" />,
    category: 'Social & Strategy',
    players: 'Drawing',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'group-hover:border-blue-500/50',
    glow: 'group-hover:shadow-blue-500/20'
  },
  {
    id: 'skribbl',
    title: 'Skribbl.io',
    description: 'Draw and guess words with your friends!',
    url: 'https://skribbl.io',
    icon: <Palette className="w-8 h-8 text-pink-400" />,
    category: 'Social & Strategy',
    players: 'Drawing',
    gradient: 'from-pink-500/20 to-rose-500/20',
    border: 'group-hover:border-pink-500/50',
    glow: 'group-hover:shadow-pink-500/20'
  },
  {
    id: 'jigsaw-puzzles',
    title: 'Jigsaw Puzzles',
    description: 'Collaborative multiplayer jigsaw puzzles.',
    url: 'https://jigsawpuzzles.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-xl">
        🧩
      </div>
    ),
    category: 'Social & Strategy',
    players: 'Co-op',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'group-hover:border-amber-500/50',
    glow: 'group-hover:shadow-amber-500/20'
  },

  {
    id: 'city-guesser',
    title: 'City Guesser',
    description: 'Guess the location from walking videos.',
    url: 'https://virtualvacation.us/guess',
    icon: (
      <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-xl">
        🌍
      </div>
    ),
    category: 'Social & Strategy',
    players: 'Geo',
    gradient: 'from-blue-400/20 to-cyan-400/20',
    border: 'group-hover:border-blue-500/50',
    glow: 'group-hover:shadow-blue-500/20'
  },

  // --- IO Classics ---
  {
    id: 'slither-io',
    title: 'Slither.io',
    description: "Eat to grow. Don't run into others!",
    url: 'http://slither.io',
    // WARN: Slither is HTTP often, might block on HTTPS.
    // Better URL: "https://slither.io" (check if they have SSL now? yes usually).
    // Actually, let's use a proxy site or standard https if available.
    // Safe bet: "https://slither.io"
    icon: (
      <div className="w-8 h-8 rounded-full bg-lime-500 border-2 border-white flex items-center justify-center text-xl">
        🐍
      </div>
    ),
    category: 'Action & IO',
    players: 'IO',
    gradient: 'from-lime-500/20 to-green-500/20',
    border: 'group-hover:border-lime-500/50',
    glow: 'group-hover:shadow-lime-500/20'
  },
  {
    id: 'paper-io-2',
    title: 'Paper.io 2',
    description: 'Conquer territory. Watch your tail.',
    url: 'https://paper-io.com',
    icon: (
      <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-xl">
        📄
      </div>
    ),
    category: 'Action & IO',
    players: 'IO',
    gradient: 'from-indigo-500/20 to-blue-500/20',
    border: 'group-hover:border-indigo-500/50',
    glow: 'group-hover:shadow-indigo-500/20'
  },
  {
    id: 'digdig-io',
    title: 'Digdig.io',
    description: 'Dig to grow larger and fight enemies.',
    url: 'https://digdig.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-stone-500 border-2 border-white flex items-center justify-center text-xl">
        ⛏️
      </div>
    ),
    category: 'Action & IO',
    players: 'IO',
    gradient: 'from-stone-500/20 to-zinc-500/20',
    border: 'group-hover:border-stone-500/50',
    glow: 'group-hover:shadow-stone-500/20'
  },
  {
    id: 'stabfish-io',
    title: 'Stabfish.io',
    description: 'Be a deadly marine beast.',
    url: 'https://stabfish.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-xl">
        🦈
      </div>
    ),
    category: 'Action & IO',
    players: 'IO',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    border: 'group-hover:border-cyan-500/50',
    glow: 'group-hover:shadow-cyan-500/20'
  },

  // --- Relax & Chill ---
  {
    id: 'slow-roads',
    title: 'Slow Roads',
    description: 'Endless driving in procedurally generated scenery.',
    url: 'https://slowroads.io',
    icon: (
      <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-xl">
        🚗
      </div>
    ),
    category: 'Relax & Chill',
    players: 'Solo',
    gradient: 'from-teal-500/20 to-emerald-500/20',
    border: 'group-hover:border-teal-500/50',
    glow: 'group-hover:shadow-teal-500/20'
  },
  {
    id: 'memory-match',
    title: 'Human Benchmark',
    description: 'Test your visual memory.',
    url: 'https://humanbenchmark.com/tests/memory',
    icon: <BrainCircuit className="w-8 h-8 text-yellow-400" />,
    category: 'Relax & Chill',
    players: 'Solo',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    border: 'group-hover:border-yellow-500/50',
    glow: 'group-hover:shadow-yellow-500/20'
  }
]

export type GameType =
  | 'tic-tac-toe'
  | 'rock-paper-scissors'
  | 'word-race'
  | 'diep-io'
  | 'florr-io'
  | 'bonk-io'
  | 'krunker'
  | 'shell-shockers'
  | 'smash-karts'
  | 'gartic-io'
  | 'skribbl'
  | 'betrayal'
  | 'slither-io'
  | 'paper-io-2'
  | 'digdig-io'
  | 'stabfish-io'
  | 'jigsaw-puzzles'
  | 'city-guesser'
  | 'slow-roads'
  | 'memory-match'

export function GameCenter({
  roomId,
  user,
  activeGame,
  onGameChangeAction
}: {
  roomId: string
  user: any
  activeGame: GameType | null
  onGameChangeAction: (game: GameType | null) => void
}) {
  const activeWebGame = WEB_GAMES.find((g) => g.id === activeGame)

  // If a game is active, render it
  if (activeGame) {
    if (activeWebGame) {
      return (
        <ExternalGameFrame
          roomId={roomId}
          user={user}
          gameUrl={activeWebGame.url}
          gameName={activeWebGame.title}
          gameId={activeWebGame.id}
          onBackAction={() => onGameChangeAction(null)}
        />
      )
    }
    return (
      <div className="h-full w-full relative pb-24 md:pb-0">
        {activeGame === 'tic-tac-toe' && (
          <TicTacToe roomId={roomId} user={user} onBackAction={() => onGameChangeAction(null)} />
        )}
        {activeGame === 'rock-paper-scissors' && (
          <RockPaperScissors
            roomId={roomId}
            user={user}
            onBackAction={() => onGameChangeAction(null)}
          />
        )}
        {activeGame === 'word-race' && (
          <WordRace roomId={roomId} user={user} onBackAction={() => onGameChangeAction(null)} />
        )}
      </div>
    )
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent">
      {/* Increased bottom padding to avoid mobile dock overlap */}
      <div className="max-w-7xl mx-auto w-full pb-32 md:pb-8 space-y-8 md:space-y-12">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 p-8 md:p-12 overflow-hidden shadow-2xl"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/5 blur-[128px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 blur-[128px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <div className="p-4 rounded-3xl bg-background/10 border border-white/10 ring-1 ring-white/10 shadow-2xl backdrop-blur-sm">
              <Gamepad2 className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                Arcade Center
              </h2>
              <p className="text-lg md:text-xl text-white/80 font-medium max-w-lg mx-auto leading-relaxed">
                Dive into real-time multiplayer battles, strategy duels, and casual fun.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
          {/* Dynamic Categories */}
          {Object.entries(
            WEB_GAMES.reduce(
              (acc, game) => {
                const cat = game.category || 'Other'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(game)
                return acc
              },
              {} as Record<string, typeof WEB_GAMES>
            )
          ).map(([category, games]) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-6">
                <span className="p-1 rounded-md bg-muted border border-border">
                  {category.includes('Action') ? (
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                  ) : category.includes('Strategy') ? (
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                  ) : category.includes('Social') ? (
                    <Users className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 text-muted-foreground" />
                  )}
                </span>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {category}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    title={game.title}
                    description={game.description}
                    icon={game.icon}
                    players={game.players}
                    onClick={() => onGameChangeAction(game.id as GameType)}
                    gradient={game.gradient}
                    border={game.border}
                    glow={game.glow}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Classics (Built-in) */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <Trophy className="w-4 h-4 text-emerald-400" />
              </span>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                Classics (Built-in)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GameCard
                title="Tic Tac Toe"
                description="The classic strategy game. Simple yet competitive."
                icon={<Grid3X3 className="w-8 h-8 text-cyan-400" />}
                players="2 Players"
                onClick={() => onGameChangeAction('tic-tac-toe')}
                gradient="from-cyan-500/20 to-teal-500/20"
                border="group-hover:border-cyan-500/50"
                glow="group-hover:shadow-cyan-500/20"
              />
              <GameCard
                title="Rock Paper Scissors"
                description="Quick luck & psychology duel. Best of 3."
                icon={<Hand className="w-8 h-8 text-orange-400" />}
                players="2 Players"
                onClick={() => onGameChangeAction('rock-paper-scissors')}
                gradient="from-orange-500/20 to-amber-500/20"
                border="group-hover:border-orange-500/50"
                glow="group-hover:shadow-orange-500/20"
              />
              <GameCard
                title="Word Race"
                description="Type fast to win! Competitive typing race."
                icon={<Keyboard className="w-8 h-8 text-blue-400" />}
                players="Multiplayer"
                onClick={() => onGameChangeAction('word-race')}
                gradient="from-blue-500/20 to-cyan-500/20"
                border="group-hover:border-blue-500/50"
                glow="group-hover:shadow-blue-500/20"
              />
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  )
}

function GameCard({
  title,
  description,
  icon,
  players,
  onClick,
  gradient,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  border,
  glow
}: {
  title: string
  description: string
  icon: React.ReactNode
  players: string
  onClick: () => void
  gradient: string
  border: string
  glow: string
}) {
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl p-px text-left w-full h-full',
        'transition-all duration-500 hover:shadow-2xl hover:-translate-y-1',
        glow
      )}
    >
      {/* Background Gradient & Border */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-100 transition-opacity duration-500',
          gradient
        )}
      />

      {/* Glass Content Container */}
      <div className="relative h-full bg-card/90 backdrop-blur-md rounded-[23px] p-6 border border-border transition-colors duration-500 group-hover:bg-accent/50 group-hover:border-accent flex flex-col gap-6">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="p-3.5 rounded-2xl bg-muted border border-border ring-1 ring-border group-hover:scale-110 group-hover:bg-background transition-all duration-500 ease-out shadow-lg">
            {icon}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-muted border border-border ring-1 ring-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground group-hover:bg-background transition-colors">
            {players}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h3 className="font-bold text-2xl text-card-foreground group-hover:text-primary transition-all tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed font-medium group-hover:text-foreground transition-colors">
            {description}
          </p>
        </div>

        {/* Hover Sparkle */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Sparkles className="w-4 h-4 text-primary/50" />
        </div>
      </div>
    </motion.button>
  )
}
