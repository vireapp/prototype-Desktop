import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { getDuoRoom } from '@/components/duo/actions'
import { RoomSkeleton, DuoRoomSkeleton } from '@/components/dashboard/skeleton'
import { useRoom } from '@/lib/room-context'

export function SingleRoomPage(): React.JSX.Element | null {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const supabase = createClient()
  const isOptimisticDuo = location.state?.isDuo || false
  const [loading, setLoading] = useState(true)
  const { startRoom, isActive, roomId } = useRoom()
  const hasJoined = useRef(false)

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!id || hasJoined.current) return

      // If this room is already active in global state, just stop loading
      if (isActive && roomId === id) {
        setLoading(false)
        hasJoined.current = true
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate(`/login?next=/room/${id}`)
        return
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

      let query = supabase.from('rooms').select('*')
      if (isUuid) {
        query = query.eq('id', id)
      } else {
        query = query.eq('name', decodeURIComponent(id))
      }

      const { data, error } = await query.limit(1).single()

      if (error || !data) {
        navigate('/dashboard/rooms')
        return
      }

      // Check if this is a Duo Room
      const duoData = await getDuoRoom(data.id as string)
      
      startRoom(data.id, data, user, !!duoData)
      hasJoined.current = true
      setLoading(false)
    }

    fetchData()
  }, [id, navigate, supabase, isActive, roomId, startRoom])

  if (loading) {
    return isOptimisticDuo ? <DuoRoomSkeleton /> : <RoomSkeleton />
  }

  // The actual rendering is now handled by GlobalRoomOverlay
  // We just return null here since the route wrapper will provide the empty background
  return null
}
