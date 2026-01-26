/**
 * Telegram channel adapter for BlueBot
 */

import TelegramBot from 'node-telegram-bot-api';
import { Channel } from '../core/types.js';
import { SessionManager } from '../core/session.js';
import { Agent } from '../core/agent.js';
import { BaseChannel, registerChannel } from './base.js';

interface TelegramConfig {
  token: string;
  allowedUsers?: number[];
  allowedGroups?: number[];
  respondToGroups?: boolean;
  commands?: { command: string; description: string }[];
}

export class TelegramChannel extends BaseChannel {
  private bot: TelegramBot;
  private telegramConfig: TelegramConfig;

  constructor(config: Channel, sessionManager: SessionManager, agent: Agent) {
    super(config, sessionManager, agent);

    this.telegramConfig = config.config as TelegramConfig;

    this.bot = new TelegramBot(this.telegramConfig.token, { polling: true });

    this.setupListeners();
  }

  private setupListeners(): void {
    // Handle messages
    this.bot.on('message', async (msg) => {
      await this.handleMessage(msg);
    });

    // Handle callback queries (for inline keyboards)
    this.bot.on('callback_query', async (query) => {
      if (query.message && query.data) {
        await this.bot.answerCallbackQuery(query.id);

        // Process as a regular message
        await this.handleMessage({
          ...query.message,
          from: query.from,
          text: query.data,
        } as TelegramBot.Message);
      }
    });

    // Handle errors
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    // Ignore non-text messages for now
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const userName = msg.from?.username || msg.from?.first_name || 'Unknown';
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

    // Check if we should respond to groups
    if (isGroup && this.telegramConfig.respondToGroups === false) {
      return;
    }

    // Check allowed users
    if (
      this.telegramConfig.allowedUsers &&
      this.telegramConfig.allowedUsers.length > 0 &&
      userId &&
      !this.telegramConfig.allowedUsers.includes(userId)
    ) {
      return;
    }

    // Check allowed groups
    if (
      isGroup &&
      this.telegramConfig.allowedGroups &&
      this.telegramConfig.allowedGroups.length > 0 &&
      !this.telegramConfig.allowedGroups.includes(chatId)
    ) {
      return;
    }

    // In groups, only respond to mentions or replies
    if (isGroup) {
      const botUsername = (await this.bot.getMe()).username;
      const isMentioned = msg.text.includes(`@${botUsername}`);
      const isReply = msg.reply_to_message?.from?.id === (await this.bot.getMe()).id;

      if (!isMentioned && !isReply && !msg.text.startsWith('/')) {
        return;
      }
    }

    // Extract content (remove bot mention if present)
    let content = msg.text;
    const botUsername = (await this.bot.getMe()).username;
    if (botUsername) {
      content = content.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
    }

    // Handle built-in commands
    if (content.startsWith('/')) {
      const handled = await this.handleCommand(chatId, content);
      if (handled) return;
    }

    if (!content) return;

    // Send typing action
    await this.bot.sendChatAction(chatId, 'typing');

    try {
      // Process message and get response
      const response = await this.handleIncomingMessage(
        content,
        chatId.toString(),
        userId?.toString(),
        userName,
        {
          chatType: msg.chat.type,
          chatTitle: msg.chat.title,
          messageId: msg.message_id,
        }
      );

      // Send response
      await this.sendLongMessage(chatId, response, msg.message_id);
    } catch (error) {
      console.error('Error handling Telegram message:', error);
      await this.bot.sendMessage(
        chatId,
        'Sorry, I encountered an error processing your message.',
        { reply_to_message_id: msg.message_id }
      );
    }
  }

  private async handleCommand(chatId: number, command: string): Promise<boolean> {
    const [cmd, ...args] = command.slice(1).split(' ');

    switch (cmd.toLowerCase()) {
      case 'start':
        await this.bot.sendMessage(
          chatId,
          "Hello! I'm BlueBot, your personal AI assistant. Send me a message and I'll help you out!"
        );
        return true;

      case 'help':
        await this.bot.sendMessage(
          chatId,
          `Available commands:\n` +
            `/start - Start the bot\n` +
            `/help - Show this help message\n` +
            `/clear - Clear conversation history\n` +
            `\nYou can also just send me any message and I'll respond!`
        );
        return true;

      case 'clear':
        const session = this.sessionManager.findSession(
          chatId.toString(),
          'telegram'
        );
        if (session) {
          this.sessionManager.clearMessages(session.id);
        }
        await this.bot.sendMessage(chatId, 'Conversation history cleared!');
        return true;

      default:
        return false;
    }
  }

  private async sendLongMessage(
    chatId: number,
    content: string,
    replyTo?: number
  ): Promise<void> {
    const maxLength = 4096; // Telegram's limit
    const chunks: string[] = [];

    // Split by newlines first, then by length
    const lines = content.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        // If single line is too long, split it
        if (line.length > maxLength) {
          for (let i = 0; i < line.length; i += maxLength) {
            chunks.push(line.slice(i, i + maxLength));
          }
        } else {
          currentChunk = line;
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    // Send all chunks
    for (let i = 0; i < chunks.length; i++) {
      await this.bot.sendMessage(chatId, chunks[i], {
        reply_to_message_id: i === 0 ? replyTo : undefined,
        parse_mode: 'Markdown',
      }).catch(async () => {
        // If Markdown fails, send without formatting
        await this.bot.sendMessage(chatId, chunks[i], {
          reply_to_message_id: i === 0 ? replyTo : undefined,
        });
      });
    }
  }

  async connect(): Promise<void> {
    if (!this.telegramConfig.token) {
      throw new Error('Telegram token is required');
    }

    // Register commands if specified
    if (this.telegramConfig.commands) {
      await this.bot.setMyCommands(this.telegramConfig.commands);
    } else {
      // Set default commands
      await this.bot.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show help message' },
        { command: 'clear', description: 'Clear conversation history' },
      ]);
    }

    const me = await this.bot.getMe();
    console.log(`Telegram bot connected as @${me.username}`);
    this.emitConnected();
  }

  async disconnect(): Promise<void> {
    await this.bot.stopPolling();
    this.emitDisconnected();
  }

  async sendMessage(
    content: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const chatId = parseInt(targetId, 10);
    await this.sendLongMessage(chatId, content, metadata?.replyTo as number);
  }
}

// Register Telegram channel
registerChannel('telegram', (config, sessionManager, agent) => {
  return new TelegramChannel(config, sessionManager, agent);
});
