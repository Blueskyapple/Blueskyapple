/**
 * BlueBot - Your Personal AI Assistant
 *
 * Multi-channel, local-first, easy to use.
 */

// Core exports
export * from './core/types.js';
export * from './core/events.js';
export * from './core/agent.js';
export * from './core/session.js';

// Gateway exports
export * from './gateway/server.js';

// Channel exports
export * from './channels/index.js';

// Skills exports
export * from './skills/index.js';

// Storage exports
export * from './storage/index.js';

// Config exports
export * from './config/index.js';

// Main BlueBot class for easy programmatic usage
import { Gateway } from './gateway/server.js';
import { Agent, createAgent } from './core/agent.js';
import { SessionManager } from './core/session.js';
import { LocalStorage, createLocalStorage } from './storage/local.js';
import { SkillManager, builtinSkills } from './skills/index.js';
import { createChannel, BaseChannel } from './channels/index.js';
import { loadConfig, BlueBotConfig } from './config/index.js';
import { eventBus } from './core/events.js';

// Import channel adapters to register them
import './channels/discord.js';
import './channels/telegram.js';
import './channels/slack.js';

export class BlueBot {
  private config: BlueBotConfig;
  private agent: Agent;
  private sessionManager: SessionManager;
  private storage: LocalStorage;
  private skillManager: SkillManager;
  private gateway?: Gateway;
  private channels: BaseChannel[] = [];
  private running: boolean = false;

  constructor(config: BlueBotConfig) {
    this.config = config;
    this.storage = createLocalStorage(config.storage);
    this.sessionManager = new SessionManager(this.storage);
    this.agent = createAgent(config.ai);
    this.skillManager = new SkillManager(this.agent);
  }

  /**
   * Create a BlueBot instance from a config file
   */
  static async fromConfig(configPath?: string): Promise<BlueBot> {
    const config = await loadConfig(configPath);
    return new BlueBot(config);
  }

  /**
   * Initialize and start the bot
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('BlueBot is already running');
    }

    // Initialize storage
    await this.storage.init();

    // Load skills
    for (const skill of builtinSkills) {
      if (this.config.skills.includes(skill.id)) {
        this.skillManager.registerSkill(skill);
      }
    }

    // Start gateway
    this.gateway = new Gateway(
      this.config.gateway,
      this.sessionManager,
      this.agent
    );
    await this.gateway.start();

    // Connect channels
    for (const channelConfig of this.config.channels) {
      if (channelConfig.enabled) {
        try {
          const channel = createChannel(
            channelConfig,
            this.sessionManager,
            this.agent
          );
          await channel.connect();
          this.channels.push(channel);
        } catch (error) {
          console.error(`Failed to connect channel ${channelConfig.name}:`, error);
        }
      }
    }

    this.running = true;
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    // Disconnect channels
    for (const channel of this.channels) {
      try {
        await channel.disconnect();
      } catch (error) {
        console.error(`Error disconnecting channel:`, error);
      }
    }
    this.channels = [];

    // Stop gateway
    if (this.gateway) {
      await this.gateway.stop();
    }

    this.running = false;
  }

  /**
   * Get the agent for direct interactions
   */
  getAgent(): Agent {
    return this.agent;
  }

  /**
   * Get session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get skill manager
   */
  getSkillManager(): SkillManager {
    return this.skillManager;
  }

  /**
   * Get storage
   */
  getStorage(): LocalStorage {
    return this.storage;
  }

  /**
   * Get gateway
   */
  getGateway(): Gateway | undefined {
    return this.gateway;
  }

  /**
   * Get event bus
   */
  getEventBus() {
    return eventBus;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Simple chat method for quick interactions
   */
  async chat(message: string, userId?: string): Promise<string> {
    const session = await this.sessionManager.getOrCreateSession(
      'api',
      'webchat',
      userId || 'anonymous'
    );
    return this.agent.chat(message, session.context);
  }
}

export default BlueBot;
