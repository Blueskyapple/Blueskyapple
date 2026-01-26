/**
 * Gateway server for BlueBot
 * Provides WebSocket and HTTP interfaces for channels and clients
 */

import { WebSocketServer, WebSocket } from 'ws';
import express, { Express, Request, Response } from 'express';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import {
  GatewayConfig,
  GatewayMessage,
  Message,
  ChannelType,
} from '../core/types.js';
import { eventBus } from '../core/events.js';
import { SessionManager } from '../core/session.js';
import { Agent } from '../core/agent.js';

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  sessionId?: string;
  channelType: ChannelType;
  authenticated: boolean;
}

export class Gateway {
  private app: Express;
  private server: http.Server;
  private wss: WebSocketServer;
  private config: GatewayConfig;
  private clients: Map<string, ConnectedClient> = new Map();
  private sessionManager: SessionManager;
  private agent: Agent;

  constructor(
    config: GatewayConfig,
    sessionManager: SessionManager,
    agent: Agent
  ) {
    this.config = config;
    this.sessionManager = sessionManager;
    this.agent = agent;

    // Initialize Express app
    this.app = express();
    this.app.use(express.json());

    if (config.cors) {
      this.app.use((_req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
      });
    }

    // Create HTTP server
    this.server = http.createServer(this.app);

    // Initialize WebSocket server
    this.wss = new WebSocketServer({ server: this.server });

    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        version: '1.0.0',
        sessions: this.sessionManager.count,
        clients: this.clients.size,
      });
    });

    // Chat endpoint (REST API)
    this.app.post('/chat', async (req: Request, res: Response) => {
      try {
        const { message, sessionId, channelId, userId } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create session
        const session = await this.sessionManager.getOrCreateSession(
          channelId || 'api',
          'webchat',
          userId
        );

        // Create user message
        const userMessage: Message = {
          id: uuidv4(),
          sessionId: session.id,
          channelId: session.channelId,
          channelType: 'webchat',
          content: message,
          role: 'user',
          timestamp: new Date(),
          metadata: { userId },
        };

        await this.sessionManager.addMessage(session.id, userMessage);

        // Get AI response
        const response = await this.agent.chat(message, session.context);

        // Create assistant message
        const assistantMessage: Message = {
          id: uuidv4(),
          sessionId: session.id,
          channelId: session.channelId,
          channelType: 'webchat',
          content: response,
          role: 'assistant',
          timestamp: new Date(),
        };

        await this.sessionManager.addMessage(session.id, assistantMessage);

        return res.json({
          response,
          sessionId: session.id,
        });
      } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Stream chat endpoint (SSE)
    this.app.post('/chat/stream', async (req: Request, res: Response) => {
      try {
        const { message, sessionId, channelId, userId } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const session = await this.sessionManager.getOrCreateSession(
          channelId || 'api',
          'webchat',
          userId
        );

        const userMessage: Message = {
          id: uuidv4(),
          sessionId: session.id,
          channelId: session.channelId,
          channelType: 'webchat',
          content: message,
          role: 'user',
          timestamp: new Date(),
          metadata: { userId },
        };

        await this.sessionManager.addMessage(session.id, userMessage);

        let fullResponse = '';

        for await (const chunk of this.agent.streamChat(message, session.context)) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        const assistantMessage: Message = {
          id: uuidv4(),
          sessionId: session.id,
          channelId: session.channelId,
          channelType: 'webchat',
          content: fullResponse,
          role: 'assistant',
          timestamp: new Date(),
        };

        await this.sessionManager.addMessage(session.id, assistantMessage);

        res.write(`data: ${JSON.stringify({ done: true, sessionId: session.id })}\n\n`);
        return res.end();
      } catch (error) {
        console.error('Stream error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Sessions endpoint
    this.app.get('/sessions', (_req: Request, res: Response) => {
      const sessions = this.sessionManager.getActiveSessions();
      res.json(sessions.map((s) => ({
        id: s.id,
        channelType: s.channelType,
        userId: s.userId,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        messageCount: s.context.messages.length,
      })));
    });

    // Get session messages
    this.app.get('/sessions/:id/messages', (req: Request, res: Response) => {
      const session = this.sessionManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.json(session.context.messages);
    });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      const client: ConnectedClient = {
        id: clientId,
        ws,
        channelType: 'webchat',
        authenticated: !this.config.auth?.enabled,
      };

      this.clients.set(clientId, client);

      ws.on('message', async (data: Buffer) => {
        try {
          const message: GatewayMessage = JSON.parse(data.toString());
          await this.handleWebSocketMessage(client, message);
        } catch (error) {
          this.sendToClient(client, {
            type: 'error',
            payload: { error: 'Invalid message format' },
            timestamp: new Date(),
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        eventBus.emit('gateway:disconnected', { clientId });
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendToClient(client, {
        type: 'event',
        payload: { event: 'connected', clientId },
        timestamp: new Date(),
      });

      eventBus.emit('gateway:connected', { clientId });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleWebSocketMessage(
    client: ConnectedClient,
    message: GatewayMessage
  ): Promise<void> {
    // Handle authentication
    if (this.config.auth?.enabled && !client.authenticated) {
      if (message.type === 'command' && (message.payload as { command: string }).command === 'auth') {
        const token = (message.payload as { token: string }).token;
        if (token === this.config.auth.token) {
          client.authenticated = true;
          this.sendToClient(client, {
            type: 'response',
            payload: { authenticated: true },
            timestamp: new Date(),
          });
        } else {
          this.sendToClient(client, {
            type: 'error',
            payload: { error: 'Invalid token' },
            timestamp: new Date(),
          });
        }
        return;
      }

      this.sendToClient(client, {
        type: 'error',
        payload: { error: 'Not authenticated' },
        timestamp: new Date(),
      });
      return;
    }

    switch (message.type) {
      case 'message':
        await this.handleChatMessage(client, message);
        break;

      case 'command':
        await this.handleCommand(client, message);
        break;

      default:
        this.sendToClient(client, {
          type: 'error',
          payload: { error: 'Unknown message type' },
          timestamp: new Date(),
        });
    }
  }

  /**
   * Handle chat message from WebSocket
   */
  private async handleChatMessage(
    client: ConnectedClient,
    message: GatewayMessage
  ): Promise<void> {
    const payload = message.payload as { content: string; userId?: string };
    const { content, userId } = payload;

    // Get or create session
    if (!client.sessionId) {
      const session = await this.sessionManager.createSession(
        client.id,
        client.channelType,
        userId
      );
      client.sessionId = session.id;
    }

    const session = this.sessionManager.getSession(client.sessionId);
    if (!session) {
      this.sendToClient(client, {
        type: 'error',
        payload: { error: 'Session not found' },
        timestamp: new Date(),
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      sessionId: session.id,
      channelId: client.id,
      channelType: client.channelType,
      content,
      role: 'user',
      timestamp: new Date(),
      metadata: { userId },
    };

    await this.sessionManager.addMessage(session.id, userMessage);

    // Stream response
    let fullResponse = '';

    try {
      for await (const chunk of this.agent.streamChat(content, session.context)) {
        fullResponse += chunk;
        this.sendToClient(client, {
          type: 'response',
          payload: { chunk, streaming: true },
          sessionId: session.id,
          timestamp: new Date(),
        });
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        sessionId: session.id,
        channelId: client.id,
        channelType: client.channelType,
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date(),
      };

      await this.sessionManager.addMessage(session.id, assistantMessage);

      // Send completion
      this.sendToClient(client, {
        type: 'response',
        payload: { done: true, content: fullResponse },
        sessionId: session.id,
        timestamp: new Date(),
      });
    } catch (error) {
      this.sendToClient(client, {
        type: 'error',
        payload: { error: String(error) },
        sessionId: session.id,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle command from WebSocket
   */
  private async handleCommand(
    client: ConnectedClient,
    message: GatewayMessage
  ): Promise<void> {
    const payload = message.payload as { command: string; args?: unknown };
    const { command, args } = payload;

    switch (command) {
      case 'clear':
        if (client.sessionId) {
          this.sessionManager.clearMessages(client.sessionId);
          this.sendToClient(client, {
            type: 'response',
            payload: { success: true, message: 'Session cleared' },
            timestamp: new Date(),
          });
        }
        break;

      case 'end':
        if (client.sessionId) {
          await this.sessionManager.endSession(client.sessionId);
          client.sessionId = undefined;
          this.sendToClient(client, {
            type: 'response',
            payload: { success: true, message: 'Session ended' },
            timestamp: new Date(),
          });
        }
        break;

      case 'ping':
        this.sendToClient(client, {
          type: 'response',
          payload: { pong: true, timestamp: Date.now() },
          timestamp: new Date(),
        });
        break;

      default:
        this.sendToClient(client, {
          type: 'error',
          payload: { error: `Unknown command: ${command}` },
          timestamp: new Date(),
        });
    }
  }

  /**
   * Send message to a client
   */
  private sendToClient(client: ConnectedClient, message: GatewayMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message: GatewayMessage): void {
    for (const client of this.clients.values()) {
      if (client.authenticated) {
        this.sendToClient(client, message);
      }
    }
  }

  /**
   * Start the gateway server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`Gateway running at http://${this.config.host}:${this.config.port}`);
        console.log(`WebSocket available at ws://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the gateway server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close all WebSocket connections
      for (const client of this.clients.values()) {
        client.ws.close();
      }
      this.clients.clear();

      // Close server
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Get Express app for extending
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get client count
   */
  get clientCount(): number {
    return this.clients.size;
  }
}
