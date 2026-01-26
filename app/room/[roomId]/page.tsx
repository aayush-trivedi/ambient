'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, Users, ArrowLeft } from 'lucide-react'
import { VideoGrid } from '@/components/video-grid'
import { AmbientPeer, ConnectionState } from '@/lib/peer'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, User } from '@supabase/supabase-js'
import { PresenceState } from '@/lib/supabase/types'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [user, setUser] = useState<User | null>(null)
  const [state, setState] = useState<ConnectionState>('disconnected')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [copied, setCopied] = useState(false)
  const [participants, setParticipants] = useState<PresenceState[]>([])

  const peerRef = useRef<AmbientPeer | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Get user on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

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
        const allParticipants = Object.values(state).flat()
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

  const goBack = () => {
    router.push('/dashboard')
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        state={state}
        partnerName="them"
      />

      {/* Top bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 bg-stone-950 hover:border-stone-700 rounded-3xl border border-stone-800 text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Participants */}
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-950 rounded-3xl border border-stone-800">
            {participants.length > 0 ? (
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((p) => (
                  <img
                    key={p.user_id}
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
    </div>
  )
}
