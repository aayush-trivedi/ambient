'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { PresenceState } from '@/lib/supabase/types'

export function useRoomPresence(roomIds: string[]) {
  const [presence, setPresence] = useState<Record<string, PresenceState[]>>({})

  useEffect(() => {
    if (roomIds.length === 0) return

    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    roomIds.forEach((roomId) => {
      const channel = supabase.channel(`room:${roomId}`, {
        config: { presence: { key: roomId } },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceState>()
          const participants = Object.values(state).flat()
          setPresence((prev) => ({ ...prev, [roomId]: participants }))
        })
        .subscribe()

      channels.push(channel)
    })

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [roomIds.join(',')])

  return presence
}
