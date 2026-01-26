'use client'

import { useEffect, useRef } from 'react'

interface LocalVideoProps {
  stream: MediaStream | null
}

export function LocalVideo({ stream }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream) return null

  return (
    <div className="absolute bottom-6 right-6 w-48 aspect-video bg-stone-950 rounded-3xl border border-stone-800 overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
    </div>
  )
}
