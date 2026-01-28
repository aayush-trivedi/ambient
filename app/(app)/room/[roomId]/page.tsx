'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check, Users } from 'lucide-react'
import { VideoGrid } from '@/components/video-grid'
import { AmbientPeer, ConnectionState } from '@/lib/peer'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, User } from '@supabase/supabase-js'
import { PresenceState, Room } from '@/lib/supabase/types'
import { dedupeParticipants } from '@/lib/utils'
import { useTabStore } from '@/lib/stores/tab-store'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { addTab, updateTabTitle, tabs } = useTabStore()

  const [user, setUser] = useState<User | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [state, setState] = useState<ConnectionState>('disconnected')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [copied, setCopied] = useState(false)
  const [participants, setParticipants] = useState<PresenceState[]>([])
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const peerRef = useRef<AmbientPeer | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Get user and room info on mount
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Fetch room details
    supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRoom(data)
          // Add/update tab with room name
          const existingTab = tabs.find((t) => t.roomId === roomId)
          if (existingTab) {
            updateTabTitle(existingTab.id, data.name)
          } else {
            addTab({
              id: `room-${roomId}`,
              title: data.name,
              type: 'room',
              roomId: roomId,
            })
          }
        }
      })
  }, [roomId, addTab, updateTabTitle, tabs])

  // Set up presence channel
  useEffect(() => {
    if (!roomId || !user) return

    const supabase = createClient()
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const allParticipants = dedupeParticipants(Object.values(state).flat())
        setParticipants(allParticipants)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || 'Anonymous',
            user_avatar: user.user_metadata?.avatar_url || '',
          })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, user])

  const handleStateChange = useCallback((newState: ConnectionState) => {
    setState(newState)
  }, [])

  const handleLocalStream = useCallback((stream: MediaStream) => {
    setLocalStream(stream)
  }, [])

  const handleRemoteStream = useCallback((stream: MediaStream | null) => {
    setRemoteStream(stream)
  }, [])

  const handleError = useCallback((err: Error) => {
    console.error('Peer error:', err)
  }, [])

  // Set up WebRTC peer connection
  useEffect(() => {
    if (!roomId || !user) return

    const isHost = !window.location.hash.includes('join')
    const partnerPeerId = isHost ? `${roomId}-guest` : `${roomId}-host`
    const myPeerId = isHost ? `${roomId}-host` : `${roomId}-guest`

    const peer = new AmbientPeer({
      peerId: myPeerId,
      partnerPeerId,
      onStateChange: handleStateChange,
      onLocalStream: handleLocalStream,
      onRemoteStream: handleRemoteStream,
      onError: handleError,
    })

    peerRef.current = peer
    peer.connect()

    return () => {
      peer.destroy()
      peerRef.current = null
    }
  }, [roomId, user, handleStateChange, handleLocalStream, handleRemoteStream, handleError])

  const copyLink = async () => {
    const link = `${window.location.origin}/room/${roomId}#join`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEditingName = () => {
    if (room) {
      setEditingName(room.name)
      setIsEditingName(true)
      setTimeout(() => nameInputRef.current?.focus(), 0)
    }
  }

  const saveRoomName = async () => {
    if (!editingName.trim() || !room) {
      setIsEditingName(false)
      return
    }

    const newName = editingName.trim()
    if (newName === room.name) {
      setIsEditingName(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('rooms')
      .update({ name: newName })
      .eq('id', roomId)

    if (!error) {
      setRoom({ ...room, name: newName })
      const existingTab = tabs.find((t) => t.roomId === roomId)
      if (existingTab) {
        updateTabTitle(existingTab.id, newName)
      }
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRoomName()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
    }
  }

  const isAlone = participants.length <= 1

  return (
    <div className="relative w-full h-full bg-black">
      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        state={state}
        partnerName="them"
      />

      {/* Centered room name when alone */}
      {isAlone && room && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={saveRoomName}
              onKeyDown={handleNameKeyDown}
              className="text-4xl font-normal text-white bg-transparent text-center outline-none pointer-events-auto"
              style={{ minWidth: '200px' }}
            />
          ) : (
            <h1
              onClick={startEditingName}
              className="text-4xl font-normal text-white cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto"
            >
              {room.name}
            </h1>
          )}
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        {/* Participants */}
        <div className="flex items-center gap-2 px-4 py-2 bg-stone-950 rounded-3xl border border-stone-800">
          {participants.length > 0 ? (
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((p, i) => (
                <img
                  key={`${p.user_id}-${i}`}
                  src={p.user_avatar}
                  alt={p.user_name}
                  className="w-6 h-6 rounded-full border-2 border-stone-950 object-cover"
                />
              ))}
            </div>
          ) : (
            <Users className="w-4 h-4 text-stone-400" />
          )}
          <span className="text-sm text-stone-400">{participants.length}</span>
        </div>

        {/* Copy link */}
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 bg-stone-950 hover:border-stone-700 rounded-3xl border border-stone-800 text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy link</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
