/**
 * Slack channel adapter for BlueBot
 * Uses Socket Mode for easy setup without public URLs
 */

import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { Channel } from '../core/types.js';
import { SessionManager } from '../core/session.js';
import { Agent } from '../core/agent.js';
import { BaseChannel, registerChannel } from './base.js';

interface SlackConfig {
  botToken: string;
  signingSecret?: string;
  appToken?: string;
  allowedChannels?: string[];
  allowedUsers?: string[];
  respondToMentions?: boolean;
  respondToDMs?: boolean;
}

interface SlackMessage {
  type: string;
  text: string;
  user: string;
  channel: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
}

export class SlackChannel extends BaseChannel {
  private client: WebClient;
  private slackConfig: SlackConfig;
  private botUserId?: string;

  constructor(config: Channel, sessionManager: SessionManager, agent: Agent) {
    super(config, sessionManager, agent);

    this.slackConfig = config.config as SlackConfig;
    this.client = new WebClient(this.slackConfig.botToken);
  }

  async connect(): Promise<void> {
    if (!this.slackConfig.botToken) {
      throw new Error('Slack bot token is required');
    }

    try {
      // Test connection and get bot info
      const authTest = await this.client.auth.test();
      this.botUserId = authTest.user_id as string;

      console.log(`Slack bot connected as ${authTest.user}`);
      this.emitConnected();

      // Note: For production, you would set up Socket Mode or Events API here
      // This basic implementation provides the message handling framework
      console.log(
        'Slack channel ready. Set up Socket Mode or Events API to receive messages.'
      );
    } catch (error) {
      console.error('Failed to connect to Slack:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.emitDisconnected();
  }

  /**
   * Handle incoming Slack message
   * Call this from your Socket Mode or Events API handler
   */
  async handleSlackMessage(event: SlackMessage): Promise<void> {
    // Ignore bot messages
    if (event.bot_id) return;

    // Check if we should respond
    if (!this.shouldRespond(event)) return;

    // Check allowed channels
    if (
      this.slackConfig.allowedChannels &&
      this.slackConfig.allowedChannels.length > 0 &&
      !this.slackConfig.allowedChannels.includes(event.channel)
    ) {
      return;
    }

    // Check allowed users
    if (
      this.slackConfig.allowedUsers &&
      this.slackConfig.allowedUsers.length > 0 &&
      !this.slackConfig.allowedUsers.includes(event.user)
    ) {
      return;
    }

    // Extract content (remove bot mention if present)
    let content = event.text;
    if (this.botUserId) {
      content = content.replace(new RegExp(`<@${this.botUserId}>`, 'g'), '').trim();
    }

    if (!content) return;

    try {
      // Get user info
      const userInfo = await this.client.users.info({ user: event.user });
      const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';

      // Process message and get response
      const response = await this.handleIncomingMessage(
        content,
        event.channel,
        event.user,
        userName,
        {
          threadTs: event.thread_ts || event.ts,
          messageTs: event.ts,
        }
      );

      // Send response in thread if it's a threaded conversation
      await this.sendMessage(response, event.channel, {
        threadTs: event.thread_ts || event.ts,
      });
    } catch (error) {
      console.error('Error handling Slack message:', error);
      await this.sendMessage(
        'Sorry, I encountered an error processing your message.',
        event.channel,
        { threadTs: event.thread_ts || event.ts }
      );
    }
  }

  private shouldRespond(event: SlackMessage): boolean {
    // Check if it's a DM
    if (event.channel.startsWith('D')) {
      return this.slackConfig.respondToDMs !== false;
    }

    // Check for mention
    if (
      this.slackConfig.respondToMentions !== false &&
      this.botUserId &&
      event.text.includes(`<@${this.botUserId}>`)
    ) {
      return true;
    }

    return false;
  }

  async sendMessage(
    content: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const maxLength = 4000; // Slack's approximate limit
    const chunks = this.splitMessage(content, maxLength);

    for (let i = 0; i < chunks.length; i++) {
      await this.client.chat.postMessage({
        channel: targetId,
        text: chunks[i],
        thread_ts: metadata?.threadTs as string,
        mrkdwn: true,
      });
    }
  }

  private splitMessage(content: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const lines = content.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

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

    return chunks;
  }

  /**
   * Send a message with blocks (rich formatting)
   */
  async sendRichMessage(
    channelId: string,
    blocks: unknown[],
    text: string,
    threadTs?: string
  ): Promise<void> {
    await this.client.chat.postMessage({
      channel: channelId,
      blocks: blocks as [],
      text, // Fallback text
      thread_ts: threadTs,
    });
  }

  /**
   * React to a message
   */
  async addReaction(
    channelId: string,
    timestamp: string,
    emoji: string
  ): Promise<void> {
    await this.client.reactions.add({
      channel: channelId,
      timestamp,
      name: emoji,
    });
  }

  /**
   * Get channel info
   */
  async getChannelInfo(channelId: string): Promise<unknown> {
    const result = await this.client.conversations.info({ channel: channelId });
    return result.channel;
  }

  /**
   * Get user info
   */
  async getUserInfo(userId: string): Promise<unknown> {
    const result = await this.client.users.info({ user: userId });
    return result.user;
  }

  /**
   * Get the Slack WebClient for advanced operations
   */
  getClient(): WebClient {
    return this.client;
  }
}

// Register Slack channel
registerChannel('slack', (config, sessionManager, agent) => {
  return new SlackChannel(config, sessionManager, agent);
});
