import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChannelAdapter, Message, Logger } from '../core/types';

/**
 * WebChat channel adapter.
 * Serves a web UI and communicates via WebSocket.
 */
export class WebChatAdapter implements ChannelAdapter {
  name = 'webchat';

  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocket.Server | null = null;
  private port: number;
  private host: string;
  private logger: Logger;
  private messageHandler?: (message: Message) => Promise<void>;
  private clients: Map<string, WebSocket> = new Map();

  constructor(port: number, host: string, logger: Logger) {
    this.port = port;
    this.host = host;
    this.logger = logger;
    this.app = express.default();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Serve static files
    this.app.use(express.static(path.join(__dirname, '..', 'web', 'public')));

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', channel: 'webchat' });
    });

    // API info
    this.app.get('/api/info', (_req, res) => {
      res.json({
        name: 'OpenClaw AI Assistant',
        version: '1.0.0',
        channels: ['webchat'],
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(this.app);
      this.wss = new WebSocket.Server({ server: this.server });

      this.wss.on('connection', (ws: WebSocket) => {
        const clientId = uuidv4();
        this.clients.set(clientId, ws);
        this.logger.info(`WebChat client connected: ${clientId}`);

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'connected',
            clientId,
            message: 'Connected to OpenClaw. How can I help you?',
          }),
        );

        ws.on('message', async (data: WebSocket.Data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'message' && parsed.content && this.messageHandler) {
              const message: Message = {
                id: uuidv4(),
                role: 'user',
                content: parsed.content,
                channel: 'webchat',
                userId: clientId,
                timestamp: new Date(),
              };
              await this.messageHandler(message);
            }
          } catch (err) {
            this.logger.error('Failed to process WebChat message', err);
          }
        });

        ws.on('close', () => {
          this.clients.delete(clientId);
          this.logger.info(`WebChat client disconnected: ${clientId}`);
        });

        ws.on('error', (err) => {
          this.logger.error(`WebChat client error: ${clientId}`, err);
        });
      });

      this.server.listen(this.port, this.host, () => {
        this.logger.info(`WebChat server running at http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    this.clients.clear();
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'message',
          content,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
