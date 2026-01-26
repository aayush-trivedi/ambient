'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Plus, LogOut } from 'lucide-react'
import { Room } from '@/lib/supabase/types'
import { RoomTile } from '@/components/room-tile'
import { CreateRoomModal } from '@/components/create-room-modal'
import { useRoomPresence } from '@/lib/hooks/use-room-presence'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

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
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        fetchRooms().then(() => setLoading(false))
      }
    })
  }, [router, fetchRooms])

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

  const joinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Hey, {firstName}</h1>
          <p className="text-stone-500 mt-1">Your rooms</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-950 hover:border-stone-700 rounded-2xl border border-stone-800 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New room</span>
          </button>

          <button
            onClick={signOut}
            className="p-2 rounded-2xl hover:bg-stone-950 transition-colors"
          >
            <LogOut className="w-5 h-5 text-stone-500" />
          </button>
        </div>
      </div>

      {/* Rooms grid */}
      <div className="max-w-4xl mx-auto">
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-500 mb-4">No rooms yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-950 hover:border-stone-700 rounded-2xl border border-stone-800 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create your first room</span>
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
                onJoin={() => joinRoom(room.id)}
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
