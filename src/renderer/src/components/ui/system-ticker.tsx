'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion } from 'framer-motion'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useState } from 'react'

const SYSTEM_LOGS = [
  'ESTABLISHING SECURE CONNECTION...',
  'NODE_SYNC: 99.9%',
  'ENCRYPTION: AES-256-GCM ACTIVE',
  'USER_JOINED: TOKYO_NODE_04',
  'AUDIO_STREAM: OPTIMIZED',
  'VIDEO_UPLINK: STABLE',
  'LATENCY: 12ms',
  'SYSTEM_INTEGRITY: 100%',
  'MODULE_LOAD: CHAT_V2.1',
  'RENDERER: WEBGL_2.0'
]

export function SystemTicker() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-green-500/20 py-2 px-4 overflow-hidden pointer-events-none select-none">
      <div className="flex items-center gap-8 whitespace-nowrap animate-ticker">
        {/* Duplicate logs for seamless loop */}
        {[...SYSTEM_LOGS, ...SYSTEM_LOGS, ...SYSTEM_LOGS].map((log, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-mono">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500/80">{log}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
      `}</style>
    </div>
  )
}
