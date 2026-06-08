import { WebSocketMessage, ConnectionStatus } from '../types'

export type MessageHandler = (message: WebSocketMessage) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private reconnectDelay: number = 2000
  private handlers: Map<string, MessageHandler[]> = new Map()
  private status: ConnectionStatus = {
    connected: false,
    lastMessageTime: null,
    error: null
  }
  private statusListeners: Array<(status: ConnectionStatus) => void> = []

  constructor(url: string = 'ws://localhost:3000') {
    this.url = url
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to', this.url)
          this.reconnectAttempts = 0
          this.updateStatus({ connected: true, error: null })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.status.lastMessageTime = Date.now()
            this.handleMessage(message)
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error)
          this.updateStatus({ connected: false, error: 'Connection error' })
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('[WebSocket] Connection closed')
          this.updateStatus({ connected: false, error: null })
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached')
      this.updateStatus({ connected: false, error: 'Max reconnect attempts reached' })
      return
    }

    this.reconnectAttempts++
    console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`)
    
    setTimeout(() => {
      this.connect().catch(() => {
        console.error('[WebSocket] Reconnect failed')
      })
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  public send(type: string, data: any = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message: not connected')
      return
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(message))
  }

  public on(type: string, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  public off(type: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(type)
    if (!handlers) return

    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message)
        } catch (error) {
          console.error(`[WebSocket] Error in handler for "${message.type}":`, error)
        }
      }
    }

    const allHandlers = this.handlers.get('*')
    if (allHandlers) {
      for (const handler of allHandlers) {
        try {
          handler(message)
        } catch (error) {
          console.error('[WebSocket] Error in wildcard handler:', error)
        }
      }
    }
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status }
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.push(listener)
  }

  public offStatusChange(listener: (status: ConnectionStatus) => void): void {
    const index = this.statusListeners.indexOf(listener)
    if (index > -1) {
      this.statusListeners.splice(index, 1)
    }
  }

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates }
    for (const listener of this.statusListeners) {
      try {
        listener({ ...this.status })
      } catch (error) {
        console.error('[WebSocket] Error in status listener:', error)
      }
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = 0
    this.updateStatus({ connected: false, error: null })
  }

  public isConnected(): boolean {
    return this.status.connected
  }

  public setUrl(url: string): void {
    this.url = url
    if (this.isConnected()) {
      this.disconnect()
      this.connect().catch(console.error)
    }
  }
}
