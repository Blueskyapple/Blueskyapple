import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { ChannelAdapter, Message, Logger } from '../core/types';

/**
 * Telegram channel adapter using the Bot API with long polling.
 */
export class TelegramAdapter implements ChannelAdapter {
  name = 'telegram';

  private token: string;
  private logger: Logger;
  private messageHandler?: (message: Message) => Promise<void>;
  private polling = false;
  private lastUpdateId = 0;

  constructor(token: string, logger: Logger) {
    this.token = token;
    this.logger = logger;
  }

  async start(): Promise<void> {
    if (!this.token) {
      this.logger.warn('Telegram bot token not configured, skipping');
      return;
    }

    this.polling = true;
    this.logger.info('Telegram adapter started');
    this.poll();
  }

  async stop(): Promise<void> {
    this.polling = false;
    this.logger.info('Telegram adapter stopped');
  }

  private async poll(): Promise<void> {
    while (this.polling) {
      try {
        const updates = await this.apiCall('getUpdates', {
          offset: this.lastUpdateId + 1,
          timeout: 30,
        });

        if (updates.result) {
          for (const update of updates.result) {
            this.lastUpdateId = update.update_id;

            if (update.message?.text && this.messageHandler) {
              const msg: Message = {
                id: uuidv4(),
                role: 'user',
                content: update.message.text,
                channel: 'telegram',
                userId: String(update.message.chat.id),
                timestamp: new Date(update.message.date * 1000),
                metadata: {
                  chatId: update.message.chat.id,
                  username: update.message.from?.username,
                },
              };
              await this.messageHandler(msg);
            }
          }
        }
      } catch (err) {
        this.logger.error('Telegram polling error', err);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    await this.apiCall('sendMessage', {
      chat_id: userId,
      text: content,
      parse_mode: 'Markdown',
    });
  }

  onMessage(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  private apiCall(method: string, params: Record<string, unknown>): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(params);
      const req = https.request(
        {
          hostname: 'api.telegram.org',
          path: `/bot${this.token}/${method}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
          timeout: 35000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error(`Invalid JSON response: ${body}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
      req.write(data);
      req.end();
    });
  }
}
