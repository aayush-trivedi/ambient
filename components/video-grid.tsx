'use client'

import { ConnectionState } from '@/lib/peer'
import { LocalVideo } from './local-video'
import { RemoteVideo } from './remote-video'

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  state: ConnectionState
  partnerName: string
}

export function VideoGrid({
  localStream,
  remoteStream,
  state,
  partnerName,
}: VideoGridProps) {
  return (
    <>
      {/* Main remote video */}
      <div className="absolute inset-0">
        <RemoteVideo
          stream={remoteStream}
          state={state}
          partnerName={partnerName}
        />
      </div>

      {/* Self preview */}
      <LocalVideo stream={localStream} />
    </>
  )
}
