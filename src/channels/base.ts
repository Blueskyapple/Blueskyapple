/**
 * Base channel adapter for BlueBot
 */

import { Channel, Message, ChannelType, ChannelConfig } from '../core/types.js';
import { SessionManager } from '../core/session.js';
import { Agent } from '../core/agent.js';
import { eventBus } from '../core/events.js';

export abstract class BaseChannel {
  protected config: Channel;
  protected sessionManager: SessionManager;
  protected agent: Agent;
  protected connected: boolean = false;

  constructor(config: Channel, sessionManager: SessionManager, agent: Agent) {
    this.config = config;
    this.sessionManager = sessionManager;
    this.agent = agent;
  }

  /**
   * Get channel ID
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Get channel type
   */
  get type(): ChannelType {
    return this.config.type;
  }

  /**
   * Get channel name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Check if channel is connected
   */
  get isConnected(): boolean {
    return this.connected;
  }

  /**
   * Connect to the channel
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the channel
   */
  abstract disconnect(): Promise<void>;

  /**
   * Send a message to the channel
   */
  abstract sendMessage(
    content: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Handle incoming message
   */
  protected async handleIncomingMessage(
    content: string,
    channelId: string,
    userId?: string,
    userName?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    // Get or create session
    const session = await this.sessionManager.getOrCreateSession(
      channelId,
      this.type,
      userId
    );

    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      channelId,
      channelType: this.type,
      content,
      role: 'user',
      timestamp: new Date(),
      metadata: { userId, userName, ...metadata },
    };

    await this.sessionManager.addMessage(session.id, userMessage);

    // Get AI response
    const response = await this.agent.chat(content, session.context);

    // Create assistant message
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      channelId,
      channelType: this.type,
      content: response,
      role: 'assistant',
      timestamp: new Date(),
    };

    await this.sessionManager.addMessage(session.id, assistantMessage);

    return response;
  }

  /**
   * Emit channel connected event
   */
  protected emitConnected(): void {
    this.connected = true;
    eventBus.emit('channel:connected', {
      channelId: this.id,
      channelType: this.type,
      channelName: this.name,
    });
  }

  /**
   * Emit channel disconnected event
   */
  protected emitDisconnected(): void {
    this.connected = false;
    eventBus.emit('channel:disconnected', {
      channelId: this.id,
      channelType: this.type,
      channelName: this.name,
    });
  }

  /**
   * Get channel config
   */
  getConfig(): Channel {
    return { ...this.config };
  }
}

/**
 * Channel factory type
 */
export type ChannelFactory = (
  config: Channel,
  sessionManager: SessionManager,
  agent: Agent
) => BaseChannel;

/**
 * Channel registry
 */
export const channelRegistry: Map<ChannelType, ChannelFactory> = new Map();

/**
 * Register a channel type
 */
export function registerChannel(type: ChannelType, factory: ChannelFactory): void {
  channelRegistry.set(type, factory);
}

/**
 * Create a channel instance
 */
export function createChannel(
  config: Channel,
  sessionManager: SessionManager,
  agent: Agent
): BaseChannel {
  const factory = channelRegistry.get(config.type);
  if (!factory) {
    throw new Error(`Unknown channel type: ${config.type}`);
  }
  return factory(config, sessionManager, agent);
}
