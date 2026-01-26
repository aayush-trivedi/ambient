'use client'

import { Trash2 } from 'lucide-react'
import { PresenceState } from '@/lib/supabase/types'

interface RoomTileProps {
  id: string
  name: string
  participants: PresenceState[]
  onJoin: () => void
  onDelete: () => void
}

export function RoomTile({ id, name, participants, onJoin, onDelete }: RoomTileProps) {
  return (
    <div
      onClick={onJoin}
      className="aspect-square bg-stone-950 rounded-3xl border border-stone-800 hover:border-stone-700 p-5 flex flex-col justify-between cursor-pointer transition-colors group relative"
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-stone-900 transition-all"
      >
        <Trash2 className="w-4 h-4 text-stone-500 hover:text-red-400" />
      </button>

      {/* Room name */}
      <div>
        <h3 className="text-white font-medium text-lg truncate pr-8">{name}</h3>
        <p className="text-stone-500 text-sm mt-1">
          {participants.length === 0
            ? 'No one here'
            : `${participants.length} online`}
        </p>
      </div>

      {/* Participant avatars */}
      <div className="flex -space-x-2">
        {participants.slice(0, 5).map((p, i) => (
          <img
            key={p.user_id}
            src={p.user_avatar}
            alt={p.user_name}
            title={p.user_name}
            className="w-8 h-8 rounded-full border-2 border-stone-950 object-cover"
            style={{ zIndex: 5 - i }}
          />
        ))}
        {participants.length > 5 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-stone-950 bg-stone-800 flex items-center justify-center text-xs text-stone-400"
            style={{ zIndex: 0 }}
          >
            +{participants.length - 5}
          </div>
        )}
      </div>
    </div>
  )
}
