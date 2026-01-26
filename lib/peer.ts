import Peer, { MediaConnection } from 'peerjs'

export type ConnectionState = 'disconnected' | 'connecting' | 'waiting' | 'connected'

export interface AmbientPeerOptions {
  peerId: string
  partnerPeerId: string
  onStateChange: (state: ConnectionState) => void
  onLocalStream: (stream: MediaStream) => void
  onRemoteStream: (stream: MediaStream | null) => void
  onError: (error: Error) => void
}

export class AmbientPeer {
  private peer: Peer | null = null
  private localStream: MediaStream | null = null
  private currentCall: MediaConnection | null = null
  private options: AmbientPeerOptions
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private destroyed = false

  constructor(options: AmbientPeerOptions) {
    this.options = options
  }

  async connect(): Promise<void> {
    if (this.destroyed) return

    this.options.onStateChange('connecting')

    try {
      // Get local media first
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      this.options.onLocalStream(this.localStream)

      // Create peer connection
      this.peer = new Peer(this.options.peerId, {
        debug: 0,
      })

      this.peer.on('open', () => {
        if (this.destroyed) return
        this.options.onStateChange('waiting')
        this.reconnectAttempts = 0
        // Try to call partner
        this.callPartner()
      })

      this.peer.on('call', (call) => {
        if (this.destroyed) return
        this.handleIncomingCall(call)
      })

      this.peer.on('disconnected', () => {
        if (this.destroyed) return
        this.options.onStateChange('disconnected')
        // Try to reconnect the peer
        this.peer?.reconnect()
      })

      this.peer.on('close', () => {
        if (this.destroyed) return
        this.options.onStateChange('disconnected')
        // Peer was destroyed, need to fully reconnect
        this.reconnectFull()
      })

      this.peer.on('error', (err) => {
        if (this.destroyed) return

        // Peer unavailable is expected when partner isn't online yet
        if (err.type === 'peer-unavailable') {
          this.options.onStateChange('waiting')
          this.scheduleReconnect()
          return
        }

        // ID taken means we need to reconnect with a fresh connection
        if (err.type === 'unavailable-id') {
          this.scheduleReconnect()
          return
        }

        this.options.onError(err)
        this.scheduleReconnect()
      })

    } catch (err) {
      this.options.onError(err as Error)
      this.options.onStateChange('disconnected')
    }
  }

  private callPartner(): void {
    if (!this.peer || !this.localStream || this.destroyed) return

    // Check if peer is disconnected - need to reconnect first
    if (this.peer.disconnected) {
      this.peer.reconnect()
      return
    }

    try {
      const call = this.peer.call(this.options.partnerPeerId, this.localStream)
      if (call) {
        this.setupCall(call)
      }
    } catch {
      // Partner not available yet, wait for incoming call
      this.options.onStateChange('waiting')
    }
  }

  private handleIncomingCall(call: MediaConnection): void {
    if (!this.localStream || this.destroyed) return

    // Answer with our stream
    call.answer(this.localStream)
    this.setupCall(call)
  }

  private setupCall(call: MediaConnection): void {
    // Close existing call if any
    if (this.currentCall) {
      this.currentCall.close()
    }

    this.currentCall = call

    call.on('stream', (remoteStream) => {
      if (this.destroyed) return
      this.options.onStateChange('connected')
      this.options.onRemoteStream(remoteStream)
    })

    call.on('close', () => {
      if (this.destroyed) return
      this.options.onRemoteStream(null)
      this.options.onStateChange('waiting')
      this.scheduleReconnect()
    })

    call.on('error', () => {
      if (this.destroyed) return
      this.options.onRemoteStream(null)
      this.options.onStateChange('waiting')
      this.scheduleReconnect()
    })
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimeout) return

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      if (!this.destroyed) {
        this.callPartner()
      }
    }, delay)
  }

  private reconnectFull(): void {
    if (this.destroyed) return

    // Clean up old peer
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }

    // Recreate peer connection (keep the media stream)
    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000)

    setTimeout(() => {
      if (this.destroyed || !this.localStream) return

      this.options.onStateChange('connecting')

      this.peer = new Peer(this.options.peerId, { debug: 0 })

      this.peer.on('open', () => {
        if (this.destroyed) return
        this.options.onStateChange('waiting')
        this.reconnectAttempts = 0
        this.callPartner()
      })

      this.peer.on('call', (call) => {
        if (this.destroyed) return
        this.handleIncomingCall(call)
      })

      this.peer.on('disconnected', () => {
        if (this.destroyed) return
        this.options.onStateChange('disconnected')
        this.peer?.reconnect()
      })

      this.peer.on('close', () => {
        if (this.destroyed) return
        this.options.onStateChange('disconnected')
        this.reconnectFull()
      })

      this.peer.on('error', (err) => {
        if (this.destroyed) return
        if (err.type === 'peer-unavailable') {
          this.options.onStateChange('waiting')
          this.scheduleReconnect()
          return
        }
        if (err.type === 'unavailable-id') {
          this.reconnectFull()
          return
        }
        this.options.onError(err)
        this.scheduleReconnect()
      })
    }, delay)
  }

  destroy(): void {
    this.destroyed = true

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.currentCall) {
      this.currentCall.close()
      this.currentCall = null
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }
  }
}
