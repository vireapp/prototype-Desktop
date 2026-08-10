import { Gamepad2, Mic, Settings, UserPlus } from 'lucide-react'

export function LiveActivity() {
  const activities = [
    {
      id: 1,
      type: 'game',
      user: 'Sarah',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      action: 'started playing',
      target: 'Valorant',
      time: 'Just now',
      icon: <Gamepad2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 2,
      type: 'voice',
      user: 'Mike & 3 others',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      action: 'are live in',
      target: '#gaming-lounge',
      time: '5m ago',
      icon: <Mic className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
      color: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 3,
      type: 'friend',
      user: 'AlexHunt',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      action: 'accepted your',
      target: 'friend request',
      time: '1h ago',
      icon: <UserPlus className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />,
      color: 'bg-pink-500/10 border-pink-500/20'
    }
  ]

  return (
    <div className="flex flex-col h-[320px] bg-card border border-border rounded-3xl p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          Live Activity
        </h2>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
        {activities.map((activity) => (
          <div key={activity.id} className="group flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border">
            <div className="relative">
              <img src={activity.avatar} className="w-10 h-10 rounded-full bg-muted border border-border" alt={activity.user} />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-card backdrop-blur-md ${activity.color}`}>
                {activity.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1 leading-relaxed">
                <span className="font-bold text-foreground">{activity.user}</span> {activity.action} <span className="font-bold text-foreground">{activity.target}</span>
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
            {activity.type === 'voice' && (
              <button className="px-4 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                Join
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
