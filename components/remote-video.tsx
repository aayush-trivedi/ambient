'use client'

import { useEffect, useRef } from 'react'
import { User } from 'lucide-react'
import { ConnectionState } from '@/lib/peer'

interface RemoteVideoProps {
  stream: MediaStream | null
  state: ConnectionState
  partnerName: string
}

export function RemoteVideo({ stream, state, partnerName }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (state !== 'connected' || !stream) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6">
        <div className="w-32 h-32 bg-stone-950 rounded-full border border-stone-800 flex items-center justify-center">
          <User className="w-16 h-16 text-stone-700" />
        </div>
        <p className="text-stone-500 text-lg">
          {state === 'waiting'
            ? `Waiting for ${partnerName}...`
            : state === 'connecting'
            ? 'Connecting...'
            : 'Disconnected'}
        </p>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  )
}
