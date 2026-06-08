import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  clientId?: string;
  timestamp?: number;
}

interface ClientInfo {
  ws: WebSocket;
  clientId: string;
  connectedAt: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientInfo> = new Map();
  private messageHandlers: Map<string, (message: WebSocketMessage, clientId: string) => void> = new Map();

  constructor() {}

  attachToServer(server: http.Server): void {
    this.wss = new WebSocketServer({ server });
    console.log('WebSocket server attached to HTTP server');

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws,
        clientId,
        connectedAt: Date.now(),
      });

      console.log(`Client connected: ${clientId}, total: ${this.clients.size}`);

      this.sendToClient(clientId, {
        type: 'connected',
        data: { clientId },
        timestamp: Date.now(),
      });

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString()) as WebSocketMessage;
          this.handleMessage(parsed, clientId);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}, total: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
  }

  start(port: number): void {
    this.wss = new WebSocketServer({ port });
    console.log(`WebSocket server started on port ${port}`);

    this.wss.on('connection', (ws) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws,
        clientId,
        connectedAt: Date.now(),
      });

      console.log(`Client connected: ${clientId}, total: ${this.clients.size}`);

      this.sendToClient(clientId, {
        type: 'connected',
        data: { clientId },
        timestamp: Date.now(),
      });

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString()) as WebSocketMessage;
          this.handleMessage(parsed, clientId);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}, total: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });
  }

  private handleMessage(message: WebSocketMessage, clientId: string): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message, clientId);
    }
  }

  onMessage(type: string, handler: (message: WebSocketMessage, clientId: string) => void): void {
    this.messageHandlers.set(type, handler);
  }

  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now(),
      });
      client.ws.send(messageStr);
      return true;
    }
    return false;
  }

  sendToClients(clientIds: string[], message: WebSocketMessage): void {
    clientIds.forEach((clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  close(): void {
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
      console.log('WebSocket server closed');
    }
  }
}

const wsManager = new WebSocketManager();

export default wsManager;
export { WebSocketManager };
