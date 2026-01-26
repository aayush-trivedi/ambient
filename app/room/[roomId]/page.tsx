'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check, Users } from 'lucide-react'
import { VideoGrid } from '@/components/video-grid'
import { AmbientPeer, ConnectionState } from '@/lib/peer'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string

  const [state, setState] = useState<ConnectionState>('disconnected')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [copied, setCopied] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)

  const peerRef = useRef<AmbientPeer | null>(null)
  const myIdRef = useRef<string>(`user-${Math.random().toString(36).slice(2, 8)}`)

  const handleStateChange = useCallback((newState: ConnectionState) => {
    setState(newState)
    setParticipantCount(newState === 'connected' ? 2 : 1)
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

  useEffect(() => {
    if (!roomId) return

    const peerId = `${roomId}-${myIdRef.current}`
    // For simplicity, try to connect to a generic partner ID
    // The first person becomes "host", second becomes "guest"
    const isHost = !window.location.hash.includes('join')
    const partnerPeerId = isHost
      ? `${roomId}-guest`
      : `${roomId}-host`

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
  }, [roomId, handleStateChange, handleLocalStream, handleRemoteStream, handleError])

  const copyLink = async () => {
    const link = `${window.location.origin}/room/${roomId}#join`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <VideoGrid
        localStream={localStream}
        remoteStream={remoteStream}
        state={state}
        partnerName="them"
      />

      {/* Top bar with room info */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-stone-950 rounded-3xl border border-stone-800">
          <Users className="w-4 h-4 text-stone-400" />
          <span className="text-sm text-stone-400">{participantCount}</span>
        </div>

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
