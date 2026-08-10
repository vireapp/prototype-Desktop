import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { RoomClientV2 } from './room-client-v2'
import { DuoRoomClient } from '@/components/duo/duo-room-client'
import { getDuoRoom } from '@/components/duo/actions'
import { RoomSkeleton } from '@/components/dashboard/skeleton'

export function SingleRoomPage(): React.JSX.Element {
  const { id } = useParams()
  const [room, setRoom] = useState<Record<string, unknown> | null>(null)
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [isDuoRoom, setIsDuoRoom] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!id) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate(`/login?next=/room/${id}`)
        return
      }
      setUser(user)

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

      setRoom(data)

      // Check if this is a Duo Room
      const duoData = await getDuoRoom(data.id as string)
      setIsDuoRoom(!!duoData)

      setLoading(false)
    }

    fetchData()
  }, [id, navigate, supabase])


  if (loading) {
    return <RoomSkeleton />
  }

  if (isDuoRoom) {
    return <DuoRoomClient room={room as Record<string, unknown>} user={user as Record<string, unknown>} />
  }

  return (
    <RoomClientV2 room={room as Record<string, unknown>} user={user as Record<string, unknown>} />
  )
}
