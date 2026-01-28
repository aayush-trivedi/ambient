'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Search, Plus } from 'lucide-react'
import { Room } from '@/lib/supabase/types'
import { RoomTile } from '@/components/room-tile'
import { useRoomPresence } from '@/lib/hooks/use-room-presence'
import { useTabStore } from '@/lib/stores/tab-store'

const ADJECTIVES = ['Quiet', 'Sunny', 'Cozy', 'Swift', 'Bright', 'Calm', 'Warm', 'Cool', 'Soft', 'Wild']
const NOUNS = ['Harbor', 'Meadow', 'Corner', 'Canyon', 'Garden', 'Stream', 'Valley', 'Ridge', 'Grove', 'Cove']

function generateRoomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj} ${noun}`
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { addTab } = useTabStore()

  const roomIds = rooms.map((r) => r.id)
  const presence = useRoomPresence(roomIds)

  // Filter rooms by search query
  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  const createAndJoinRoom = async () => {
    if (!user) return

    const name = generateRoomName()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (data && !error) {
      setRooms((prev) => [data, ...prev])
      addTab({
        id: `room-${data.id}`,
        title: data.name,
        type: 'room',
        roomId: data.id,
      })
      router.push(`/room/${data.id}`)
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
    <div className="h-full relative">
      {/* Rooms area - scrollable */}
      <div className="h-full overflow-y-auto p-6 pb-24">
        <div className={`w-[95%] max-w-2xl mx-auto ${rooms.length === 0 ? 'h-full' : ''}`}>
          {rooms.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center -mt-24">
              <button
                onClick={createAndJoinRoom}
                className="w-12 h-12 rounded-xl border border-stone-800 hover:border-stone-700 flex items-center justify-center transition-colors mb-4"
              >
                <Plus className="h-5 w-5 text-stone-400" />
              </button>
              <p className="text-[10px] text-stone-400 tracking-wide">
                CREATE YOUR FIRST ROOM
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500">No rooms found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
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
      </div>

      {/* Search input - bottom, like chat input */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-2xl z-50">
        <div className="bg-stone-950 border border-stone-800 rounded-[30px] flex items-center py-4 px-5">
          <Search className="h-4 w-4 text-stone-500 flex-shrink-0" />
          <div className="flex-1 relative ml-3">
            {searchQuery === '' && (
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <span className="text-stone-500">Search&nbsp;</span>
                <span className="text-stone-300">Rooms</span>
              </div>
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
        </div>
      </div>

    </div>
  )
}
