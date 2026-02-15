import { loadConfig } from './core/config';
import { createLogger } from './core/logger';
import { Agent } from './core/agent';
import { createProvider } from './providers';
import { MemoryManager } from './memory/manager';
import { MemorySkill } from './skills/builtin/memory';
import { FileSystemSkill } from './skills/builtin/filesystem';
import { ShellSkill } from './skills/builtin/shell';
import { WebBrowseSkill } from './skills/builtin/webbrowse';
import { SkillLoader } from './skills/loader';
import { WebChatAdapter } from './channels/webchat';
import { TelegramAdapter } from './channels/telegram';
import { DiscordAdapter } from './channels/discord';
import { SlackAdapter } from './channels/slack';
import { HeartbeatScheduler } from './heartbeat/scheduler';
import { ChannelAdapter, Message, AppConfig, Logger } from './core/types';

export class OpenClaw {
  private config: AppConfig;
  private logger: Logger;
  private agent: Agent;
  private memory: MemoryManager;
  private heartbeat: HeartbeatScheduler;
  private channels: ChannelAdapter[] = [];

  constructor(configPath?: string) {
    this.config = loadConfig(configPath);
    this.logger = createLogger(this.config.logLevel);

    // Initialize AI provider
    const providerConfig = this.config.providers[this.config.aiProvider];
    if (!providerConfig) {
      throw new Error(`AI provider not configured: ${this.config.aiProvider}`);
    }
    const provider = createProvider(this.config.aiProvider, providerConfig);

    // Initialize memory
    this.memory = new MemoryManager(this.config.memoryPath, this.logger);

    // Initialize agent
    this.agent = new Agent(provider, this.memory, this.logger, this.config);

    // Initialize heartbeat
    this.heartbeat = new HeartbeatScheduler(
      this.agent,
      this.logger,
      this.config.memoryPath,
    );

    // Register built-in skills
    this.registerBuiltinSkills();
  }

  private registerBuiltinSkills(): void {
    const memorySkill = new MemorySkill(this.memory);
    this.agent.registerSkill(memorySkill);
    this.agent.registerSkill(new FileSystemSkill());
    this.agent.registerSkill(new ShellSkill());
    this.agent.registerSkill(new WebBrowseSkill());
  }

  /** Initialize and start all channels */
  async start(): Promise<void> {
    this.logger.info('Starting OpenClaw AI Assistant...');
    this.logger.info(`AI Provider: ${this.config.aiProvider}`);
    this.logger.info(`Model: ${this.config.aiModel}`);

    // Load custom skills
    const loader = new SkillLoader(this.config.skillsPath, this.logger);
    const customSkills = await loader.loadCustomSkills();
    for (const skill of customSkills) {
      this.agent.registerSkill(skill);
    }

    // Set up message handler
    const handleMessage = async (message: Message) => {
      this.logger.debug(`Message from ${message.channel}:${message.userId}`);
      const response = await this.agent.processMessage(
        message.content,
        message.userId,
        message.channel,
      );

      // Send response back through the appropriate channel
      const channel = this.channels.find((c) => c.name === message.channel);
      if (channel) {
        await channel.sendMessage(message.userId, response);
      }
    };

    // Initialize channels
    // WebChat (always enabled)
    const webchat = new WebChatAdapter(
      this.config.webPort,
      this.config.webHost,
      this.logger,
    );
    webchat.onMessage(handleMessage);
    this.channels.push(webchat);

    // Telegram (if configured)
    const tgConfig = this.config.channels.telegram;
    if (tgConfig?.token) {
      const telegram = new TelegramAdapter(tgConfig.token, this.logger);
      telegram.onMessage(handleMessage);
      this.channels.push(telegram);
    }

    // Discord (if configured)
    const dcConfig = this.config.channels.discord;
    if (dcConfig?.token) {
      const discord = new DiscordAdapter(dcConfig.token, this.logger);
      discord.onMessage(handleMessage);
      this.channels.push(discord);
    }

    // Slack (if configured)
    const slConfig = this.config.channels.slack;
    if (slConfig?.botToken) {
      const slack = new SlackAdapter(
        slConfig.botToken,
        slConfig.appToken || '',
        this.logger,
      );
      slack.onMessage(handleMessage);
      this.channels.push(slack);
    }

    // Start all channels
    for (const channel of this.channels) {
      try {
        await channel.start();
        this.logger.info(`Channel started: ${channel.name}`);
      } catch (err) {
        this.logger.error(`Failed to start channel: ${channel.name}`, err);
      }
    }

    // Set up heartbeat send callback
    this.heartbeat.onSend(async (userId, channelName, message) => {
      const channel = this.channels.find((c) => c.name === channelName);
      if (channel) {
        await channel.sendMessage(userId, message);
      }
    });

    // Start heartbeat scheduler
    this.heartbeat.startAll();

    this.logger.info('OpenClaw is ready!');
    this.logger.info(`Web UI: http://${this.config.webHost}:${this.config.webPort}`);
  }

  /** Gracefully stop all services */
  async stop(): Promise<void> {
    this.logger.info('Shutting down OpenClaw...');

    this.heartbeat.stopAll();

    for (const channel of this.channels) {
      try {
        await channel.stop();
      } catch (err) {
        this.logger.error(`Failed to stop channel: ${channel.name}`, err);
      }
    }

    this.logger.info('OpenClaw stopped.');
  }

  /** Get the agent instance (for programmatic use) */
  getAgent(): Agent {
    return this.agent;
  }

  /** Get the memory manager */
  getMemory(): MemoryManager {
    return this.memory;
  }

  /** Get the heartbeat scheduler */
  getHeartbeat(): HeartbeatScheduler {
    return this.heartbeat;
  }
}

export default OpenClaw;
