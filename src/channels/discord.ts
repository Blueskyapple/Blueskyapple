/**
 * Discord channel adapter for BlueBot
 */

import {
  Client,
  GatewayIntentBits,
  Message as DiscordMessage,
  Partials,
  TextChannel,
  DMChannel,
} from 'discord.js';
import { Channel } from '../core/types.js';
import { SessionManager } from '../core/session.js';
import { Agent } from '../core/agent.js';
import { BaseChannel, registerChannel } from './base.js';

interface DiscordConfig {
  token: string;
  prefix?: string;
  respondToDMs?: boolean;
  respondToMentions?: boolean;
  allowedChannels?: string[];
  allowedUsers?: string[];
}

export class DiscordChannel extends BaseChannel {
  private client: Client;
  private discordConfig: DiscordConfig;

  constructor(config: Channel, sessionManager: SessionManager, agent: Agent) {
    super(config, sessionManager, agent);

    this.discordConfig = config.config as DiscordConfig;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.emitConnected();
    });

    this.client.on('messageCreate', async (message: DiscordMessage) => {
      await this.handleMessage(message);
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      this.emitDisconnected();
    });
  }

  private async handleMessage(message: DiscordMessage): Promise<void> {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if we should respond
    if (!this.shouldRespond(message)) return;

    // Check allowed channels
    if (
      this.discordConfig.allowedChannels &&
      this.discordConfig.allowedChannels.length > 0 &&
      !this.discordConfig.allowedChannels.includes(message.channel.id)
    ) {
      return;
    }

    // Check allowed users
    if (
      this.discordConfig.allowedUsers &&
      this.discordConfig.allowedUsers.length > 0 &&
      !this.discordConfig.allowedUsers.includes(message.author.id)
    ) {
      return;
    }

    // Extract content (remove prefix or mention)
    let content = message.content;
    const prefix = this.discordConfig.prefix || '!bot';

    if (content.startsWith(prefix)) {
      content = content.slice(prefix.length).trim();
    } else if (this.client.user && message.mentions.has(this.client.user)) {
      content = content.replace(new RegExp(`<@!?${this.client.user.id}>`), '').trim();
    }

    if (!content) return;

    // Show typing indicator
    if (message.channel instanceof TextChannel || message.channel instanceof DMChannel) {
      await message.channel.sendTyping();
    }

    try {
      // Process message and get response
      const response = await this.handleIncomingMessage(
        content,
        message.channel.id,
        message.author.id,
        message.author.username,
        {
          guildId: message.guild?.id,
          guildName: message.guild?.name,
          channelName: (message.channel as TextChannel).name || 'DM',
        }
      );

      // Split long messages (Discord has 2000 char limit)
      await this.sendLongMessage(message.channel as TextChannel | DMChannel, response);
    } catch (error) {
      console.error('Error handling Discord message:', error);
      await message.reply('Sorry, I encountered an error processing your message.');
    }
  }

  private shouldRespond(message: DiscordMessage): boolean {
    const prefix = this.discordConfig.prefix || '!bot';

    // Check if it's a DM
    if (!message.guild) {
      return this.discordConfig.respondToDMs !== false;
    }

    // Check for prefix
    if (message.content.startsWith(prefix)) {
      return true;
    }

    // Check for mention
    if (
      this.discordConfig.respondToMentions !== false &&
      this.client.user &&
      message.mentions.has(this.client.user)
    ) {
      return true;
    }

    return false;
  }

  private async sendLongMessage(
    channel: TextChannel | DMChannel,
    content: string
  ): Promise<void> {
    const maxLength = 2000;
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
    for (const chunk of chunks) {
      await channel.send(chunk);
    }
  }

  async connect(): Promise<void> {
    if (!this.discordConfig.token) {
      throw new Error('Discord token is required');
    }

    await this.client.login(this.discordConfig.token);
  }

  async disconnect(): Promise<void> {
    await this.client.destroy();
    this.emitDisconnected();
  }

  async sendMessage(
    content: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const channel = await this.client.channels.fetch(targetId);

    if (channel instanceof TextChannel || channel instanceof DMChannel) {
      await this.sendLongMessage(channel, content);
    } else {
      throw new Error('Invalid channel type');
    }
  }
}

// Register Discord channel
registerChannel('discord', (config, sessionManager, agent) => {
  return new DiscordChannel(config, sessionManager, agent);
});
