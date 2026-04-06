export interface SightCoreConfig {
  url: string
  protocols?: string[]
  reconnectIntervalMs?: number
  autoReconnect?: boolean
}

export type SightCoreMessage = {
  topic: string
  payload: any
  timestamp: number
}

export class SightCoreWebSocket {
  private socket?: WebSocket
  private url: string
  private protocols?: string[]
  private reconnectInterval: number
  private autoReconnect: boolean
  private manuallyClosed = false

  constructor(config: SightCoreConfig) {
    this.url = config.url
    this.protocols = config.protocols
    this.reconnectInterval = config.reconnectIntervalMs ?? 5000
    this.autoReconnect = config.autoReconnect ?? true
  }

  connect(
    onMessage: (msg: SightCoreMessage) => void,
    onOpen?: () => void,
    onClose?: () => void,
    onError?: (err: Event) => void
  ): void {
    this.manuallyClosed = false
    this.socket = this.protocols
      ? new WebSocket(this.url, this.protocols)
      : new WebSocket(this.url)

    this.socket.onopen = () => {
      onOpen?.()
    }

    this.socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data) as SightCoreMessage
        onMessage(msg)
      } catch (err) {
        console.warn("[SightCoreWebSocket] Invalid message:", event.data)
      }
    }

    this.socket.onclose = () => {
      onClose?.()
      if (this.autoReconnect && !this.manuallyClosed) {
        setTimeout(() => this.connect(onMessage, onOpen, onClose, onError), this.reconnectInterval)
      }
    }

    this.socket.onerror = event => {
      onError?.(event)
      this.socket?.close()
    }
  }

  send(topic: string, payload: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ topic, payload, timestamp: Date.now() })
      this.socket.send(msg)
    } else {
      console.warn("[SightCoreWebSocket] Attempted to send on closed socket:", { topic, payload })
    }
  }

  disconnect(): void {
    this.manuallyClosed = true
    this.socket?.close()
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}
