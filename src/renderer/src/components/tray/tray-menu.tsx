import React, { useState, useEffect } from 'react'
import { Monitor, Circle, Mic, MicOff, LogOut, Settings, Hash, User, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function TrayMenu(): React.JSX.Element {
  const [isMuted, setIsMuted] = useState(false)
  const [status, setStatus] = useState<'online' | 'away' | 'invisible' | 'offline'>('online')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setProfile(data)
          // setStatus based on actual data if available, but for now default to online
          setStatus(data.status === 'invisible' ? 'invisible' : data.status || 'online')
        }
      }
      setLoading(false)
    }

    fetchUser()

    if (window.api && window.api.on) {
      const cleanup = window.api.on('status-updated', (newStatus: string) => {
        setStatus(newStatus as any)
      })
      return cleanup
    }
  }, [])

  const handleAction = (action: string, payload?: any) => {
    if (window.api && window.api.trayAction) {
      window.api.trayAction(action, payload)
    }
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    handleAction('toggle-mute', newMuted)
  }

  const changeStatus = (newStatus: 'online' | 'away' | 'invisible' | 'offline') => {
    setStatus(newStatus)
    handleAction('status-change', newStatus)
  }

  return (
    <div className="w-full h-full bg-[#08090d] border border-white/10 text-white flex flex-col p-2 select-none shadow-xl overflow-hidden rounded-none">
      {/* Header Profile Area */}
      <div className="flex items-center gap-3 p-3 mb-2 border-b border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => handleAction('open')}>
        <div className="relative">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 object-cover shadow-lg" />
          ) : (
            <div className="w-10 h-10 bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
              {profile?.username?.[0]?.toUpperCase() || 'V'}
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#08090d] ${status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-500' : status === 'invisible' ? 'bg-zinc-500' : 'bg-rose-500'}`} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm line-clamp-1">{profile?.full_name?.split(' ')[0] || profile?.username || 'VIRE User'}</span>
          <span className="text-xs text-white/50">{loading ? 'Loading...' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-1">
        {/* Quick Actions */}
        <div className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 py-1 mt-1">Actions</div>
        
        <button 
          onClick={() => handleAction('open')}
          className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left"
        >
          <Monitor size={16} className="text-indigo-400" />
          <span>Open VIRE</span>
        </button>
        
        <button 
          onClick={() => handleAction('navigate', '/dashboard')}
          className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left"
        >
          <Hash size={16} className="text-emerald-400" />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => handleAction('navigate', '/dashboard/settings')}
          className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left"
        >
          <Settings size={16} className="text-zinc-400" />
          <span>Settings</span>
        </button>
        
        <button 
          onClick={toggleMute}
          className="flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left"
        >
          <div className="flex items-center gap-3">
            {isMuted ? <MicOff size={16} className="text-rose-400" /> : <Mic size={16} className="text-emerald-400" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </div>
        </button>

        <button 
          onClick={() => handleAction('check-updates')}
          className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left"
        >
          <RefreshCw size={16} className="text-blue-400" />
          <span>Check for Updates</span>
        </button>

        {/* Status Settings */}
        <div className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 py-1 mt-2 border-t border-white/5 pt-3">Status</div>
        
        <button onClick={() => changeStatus('online')} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left">
          <Circle size={12} className="text-emerald-500 fill-emerald-500" />
          <span>Online</span>
          {status === 'online' && <span className="ml-auto text-xs text-white/50">✓</span>}
        </button>
        <button onClick={() => changeStatus('away')} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left">
          <Circle size={12} className="text-amber-500 fill-amber-500" />
          <span>Away</span>
          {status === 'away' && <span className="ml-auto text-xs text-white/50">✓</span>}
        </button>
        <button onClick={() => changeStatus('invisible')} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left">
          <Circle size={12} className="text-zinc-500 fill-zinc-500" />
          <span>Invisible</span>
          {status === 'invisible' && <span className="ml-auto text-xs text-white/50">✓</span>}
        </button>
        <button onClick={() => changeStatus('offline')} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-sm w-full text-left">
          <Circle size={12} className="text-rose-500 fill-rose-500" />
          <span>Offline</span>
          {status === 'offline' && <span className="ml-auto text-xs text-white/50">✓</span>}
        </button>
      </div>

      <div className="mt-auto border-t border-white/5 pt-1">
        <button 
          onClick={() => handleAction('quit')}
          className="flex items-center gap-3 px-3 py-2 hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-sm w-full text-left mt-1"
        >
          <LogOut size={16} />
          <span>Quit VIRE</span>
        </button>
      </div>
    </div>
  )
}
