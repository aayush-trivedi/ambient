'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Plus } from 'lucide-react'
import { Room } from '@/lib/supabase/types'
import { RoomTile } from '@/components/room-tile'
import { CreateRoomModal } from '@/components/create-room-modal'
import { useRoomPresence } from '@/lib/hooks/use-room-presence'
import { useTabStore } from '@/lib/stores/tab-store'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { addTab } = useTabStore()

  const roomIds = rooms.map((r) => r.id)
  const presence = useRoomPresence(roomIds)

  const fetchRooms = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setRooms(data)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchRooms().then(() => setLoading(false))
      }
    })
  }, [fetchRooms])

  const createRoom = async (name: string) => {
    if (!user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (data && !error) {
      setRooms((prev) => [data, ...prev])
    }
  }

  const deleteRoom = async (roomId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('rooms').delete().eq('id', roomId)

    if (!error) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    }
  }

  const joinRoom = (room: Room) => {
    addTab({
      id: `room-${room.id}`,
      title: room.name,
      type: 'room',
      roomId: room.id,
    })
    router.push(`/room/${room.id}`)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white">Rooms</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-7 h-7 flex items-center justify-center text-white rounded-full border border-transparent hover:border-stone-700 transition-colors duration-150"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Rooms grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-500 mb-4">No rooms yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-stone-400 hover:text-white transition-colors"
            >
              Create your first room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomTile
                key={room.id}
                id={room.id}
                name={room.name}
                participants={presence[room.id] || []}
                onJoin={() => joinRoom(room)}
                onDelete={() => deleteRoom(room.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create room modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createRoom}
      />
    </div>
  )
}
