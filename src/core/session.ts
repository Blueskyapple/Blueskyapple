/**
 * Session management for BlueBot
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Session,
  SessionContext,
  Message,
  ChannelType,
  StorageInterface,
} from './types.js';
import { eventBus } from './events.js';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private storage?: StorageInterface;

  constructor(storage?: StorageInterface) {
    this.storage = storage;
  }

  /**
   * Create a new session
   */
  async createSession(
    channelId: string,
    channelType: ChannelType,
    userId?: string
  ): Promise<Session> {
    const id = uuidv4();
    const now = new Date();

    const session: Session = {
      id,
      channelId,
      channelType,
      userId,
      createdAt: now,
      lastActivity: now,
      context: {
        messages: [],
        variables: {},
        activeSkills: [],
      },
      status: 'active',
    };

    this.sessions.set(id, session);

    // Load previous messages if storage is available
    if (this.storage && userId) {
      const messages = await this.storage.getMemory(`${channelType}:${userId}`);
      if (messages && messages.length > 0) {
        session.context.messages = messages;
      }
    }

    await eventBus.emit('session:created', session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  /**
   * Find session by channel and user
   */
  findSession(
    channelId: string,
    channelType: ChannelType,
    userId?: string
  ): Session | undefined {
    for (const session of this.sessions.values()) {
      if (
        session.channelId === channelId &&
        session.channelType === channelType &&
        session.userId === userId &&
        session.status === 'active'
      ) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Get or create session
   */
  async getOrCreateSession(
    channelId: string,
    channelType: ChannelType,
    userId?: string
  ): Promise<Session> {
    let session = this.findSession(channelId, channelType, userId);
    if (!session) {
      session = await this.createSession(channelId, channelType, userId);
    }
    return session;
  }

  /**
   * Add message to session
   */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.context.messages.push(message);
    session.lastActivity = new Date();

    // Persist messages
    if (this.storage && session.userId) {
      await this.storage.saveMemory(
        `${session.channelType}:${session.userId}`,
        session.context.messages
      );
    }

    await eventBus.emit(
      message.role === 'user' ? 'message:received' : 'message:sent',
      { session, message }
    );
  }

  /**
   * Get session context
   */
  getContext(sessionId: string): SessionContext | undefined {
    return this.sessions.get(sessionId)?.context;
  }

  /**
   * Update session variable
   */
  setVariable(sessionId: string, key: string, value: unknown): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context.variables[key] = value;
    }
  }

  /**
   * Get session variable
   */
  getVariable(sessionId: string, key: string): unknown {
    return this.sessions.get(sessionId)?.context.variables[key];
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      await eventBus.emit('session:ended', session);
    }
  }

  /**
   * Clear session messages
   */
  clearMessages(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context.messages = [];
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'active'
    );
  }

  /**
   * Clean up old sessions
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > maxAge) {
        session.status = 'ended';
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get session count
   */
  get count(): number {
    return this.sessions.size;
  }
}
