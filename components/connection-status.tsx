'use client'

import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { ConnectionState } from '@/lib/peer'

interface ConnectionStatusProps {
  state: ConnectionState
  partnerName: string
}

export function ConnectionStatus({ state, partnerName }: ConnectionStatusProps) {
  const getStatusContent = () => {
    switch (state) {
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Disconnected',
        }
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Connecting...',
        }
      case 'waiting':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: `Waiting for ${partnerName}...`,
        }
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'Connected',
        }
    }
  }

  const { icon, text } = getStatusContent()

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-stone-950 rounded-3xl border border-stone-800">
      {icon}
      <span className="text-sm text-stone-400">{text}</span>
    </div>
  )
}
