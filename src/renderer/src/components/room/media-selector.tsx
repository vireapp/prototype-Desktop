'use client'

import { motion } from 'framer-motion'
import { Play, Tv, PlaySquare, PlayCircle } from 'lucide-react'

export type MediaService = 'youtube' | 'netflix' | 'prime' | 'jiohotstar' | 'mxplayer' | 'hianime' | 'crunchyroll'

interface MediaSelectorProps {
  onSelect: (service: MediaService, initialUrl?: string) => void
}

export function MediaSelector({ onSelect }: MediaSelectorProps) {
  const apps = [
    {
      id: 'youtube',
      name: 'YouTube',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg',
      color: 'hover:border-red-500/50 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]',
    },
    {
      id: 'netflix',
      name: 'Netflix',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
      color: 'hover:border-red-600/50 hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.3)]',
    },
    {
      id: 'prime',
      name: 'Prime Video',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png',
      color: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    },
    {
      id: 'jiohotstar',
      name: 'JioHotstar',
      logo: 'https://img1.hotstarext.com/image/upload/f_auto,q_90,w_256/v1656431456/web-images/logo-d-plus.svg',
      color: 'hover:border-blue-700/50 hover:shadow-[0_0_30px_-5px_rgba(29,78,216,0.3)]',
    },
    {
      id: 'crunchyroll',
      name: 'Crunchyroll',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.png',
      color: 'hover:border-orange-500/50 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]',
    },
    {
      id: 'mxplayer',
      name: 'MX Player',
      Icon: PlayCircle,
      color: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    },
    {
      id: 'hianime',
      name: 'HiAnime',
      Icon: PlaySquare,
      color: 'hover:border-pink-500/50 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]',
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 w-full max-w-6xl mx-auto selection:bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-semibold text-white/90 tracking-tight mb-3">
          Select an app
        </h2>
        <p className="text-white/40 text-sm md:text-base font-medium tracking-wide">
          Watch together in perfect sync
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full px-4"
      >
        {apps.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(app.id as MediaService)}
            className={`cursor-pointer group relative flex flex-col items-center justify-center gap-6 rounded-2xl bg-[#111111]/80 backdrop-blur-2xl border border-white/5 p-8 transition-all duration-300 ${app.color}`}
          >
            <div className="h-14 w-full flex items-center justify-center">
              {app.Icon ? (
                <div className="flex items-center gap-2 text-xl font-bold text-white/80 group-hover:text-white transition-colors">
                  <app.Icon className="w-8 h-8 opacity-80 group-hover:opacity-100" />
                  {app.name}
                </div>
              ) : app.textLogo ? (
                <div className="flex items-center gap-2 text-xl font-bold text-white/80 group-hover:text-white transition-colors">
                  <Play className="w-6 h-6 fill-current" />
                  {app.textLogo}
                </div>
              ) : (
                <img 
                  src={app.logo} 
                  alt={app.name} 
                  className="max-h-full max-w-[120px] object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-sm filter grayscale group-hover:grayscale-0"
                />
              )}
            </div>
            
            <div className="absolute bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <span className="text-xs font-medium text-white/60 tracking-wider uppercase">
                Launch
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
