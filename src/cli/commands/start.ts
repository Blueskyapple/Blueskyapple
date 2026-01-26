/**
 * Start command for BlueBot CLI
 */

import chalk from 'chalk';
import { loadConfig, validateConfig, getEnvConfig } from '../../config/index.js';
import { Gateway } from '../../gateway/server.js';
import { createAgent } from '../../core/agent.js';
import { SessionManager } from '../../core/session.js';
import { createLocalStorage } from '../../storage/local.js';
import { SkillManager, builtinSkills } from '../../skills/index.js';
import { createChannel, registerChannel } from '../../channels/index.js';
import { eventBus } from '../../core/events.js';
import '../../channels/discord.js';
import '../../channels/telegram.js';
import '../../channels/slack.js';

interface StartOptions {
  config?: string;
  port?: string;
  gateway?: boolean;
}

export async function startBot(options: StartOptions): Promise<void> {
  console.log(chalk.cyan('\nStarting BlueBot...\n'));

  // Load configuration
  console.log(chalk.gray('Loading configuration...'));
  let config = await loadConfig(options.config);

  // Apply environment overrides
  const envConfig = getEnvConfig();
  config = { ...config, ...envConfig } as typeof config;

  // Override port if specified
  if (options.port) {
    config.gateway.port = parseInt(options.port, 10);
  }

  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.log(chalk.red('\nConfiguration errors:'));
    validation.errors.forEach((e) => console.log(chalk.red(`  - ${e}`)));
    console.log(chalk.yellow('\nRun `bluebot setup` to configure BlueBot'));
    throw new Error('Invalid configuration');
  }

  console.log(chalk.green('  Configuration loaded'));

  // Initialize storage
  console.log(chalk.gray('Initializing storage...'));
  const storage = createLocalStorage(config.storage);
  await storage.init();
  console.log(chalk.green(`  Storage initialized at ${storage.getBasePath()}`));

  // Initialize session manager
  const sessionManager = new SessionManager(storage);

  // Initialize agent
  console.log(chalk.gray('Initializing AI agent...'));
  const agent = createAgent(config.ai);
  console.log(chalk.green(`  Agent initialized (${config.ai.provider}/${config.ai.model})`));

  // Initialize skill manager
  console.log(chalk.gray('Loading skills...'));
  const skillManager = new SkillManager(agent);

  // Load built-in skills
  for (const skill of builtinSkills) {
    if (config.skills.includes(skill.id)) {
      skillManager.registerSkill(skill);
    }
  }
  console.log(chalk.green(`  ${skillManager.count} skills loaded`));

  // Set up event logging
  setupEventLogging();

  // Initialize channels
  const channels = [];
  for (const channelConfig of config.channels) {
    if (channelConfig.enabled) {
      console.log(chalk.gray(`Connecting to ${channelConfig.name}...`));
      try {
        const channel = createChannel(channelConfig, sessionManager, agent);
        await channel.connect();
        channels.push(channel);
        console.log(chalk.green(`  ${channelConfig.name} connected`));
      } catch (error) {
        console.log(chalk.red(`  Failed to connect ${channelConfig.name}: ${error}`));
      }
    }
  }

  // Start gateway if enabled
  let gateway: Gateway | null = null;
  if (options.gateway !== false) {
    console.log(chalk.gray('Starting gateway...'));
    gateway = new Gateway(config.gateway, sessionManager, agent);
    await gateway.start();
    console.log(chalk.green(`  Gateway running on http://${config.gateway.host}:${config.gateway.port}`));
  }

  // Print summary
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.green.bold('  BlueBot is running!'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.white('  Gateway:'));
  if (gateway) {
    console.log(chalk.gray(`    HTTP:      http://${config.gateway.host}:${config.gateway.port}`));
    console.log(chalk.gray(`    WebSocket: ws://${config.gateway.host}:${config.gateway.port}`));
  } else {
    console.log(chalk.gray('    Disabled'));
  }

  console.log(chalk.white('\n  Channels:'));
  if (channels.length > 0) {
    channels.forEach((ch) => {
      console.log(chalk.gray(`    - ${ch.name} (${ch.type})`));
    });
  } else {
    console.log(chalk.gray('    No channels connected'));
    console.log(chalk.gray('    Run `bluebot setup` to add channels'));
  }

  console.log(chalk.white('\n  Skills:'));
  skillManager.getAllSkills().forEach((skill) => {
    const status = skill.enabled ? chalk.green('enabled') : chalk.gray('disabled');
    console.log(chalk.gray(`    - ${skill.name} [${status}]`));
  });

  console.log(chalk.gray('\n  Press Ctrl+C to stop\n'));

  // Handle shutdown
  const shutdown = async () => {
    console.log(chalk.yellow('\n\nShutting down BlueBot...'));

    // Disconnect channels
    for (const channel of channels) {
      try {
        await channel.disconnect();
        console.log(chalk.gray(`  ${channel.name} disconnected`));
      } catch (error) {
        console.log(chalk.red(`  Error disconnecting ${channel.name}`));
      }
    }

    // Stop gateway
    if (gateway) {
      await gateway.stop();
      console.log(chalk.gray('  Gateway stopped'));
    }

    console.log(chalk.green('\nBlueBot stopped. Goodbye!\n'));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process running
  await new Promise(() => {}); // Never resolves, keeps bot running
}

function setupEventLogging(): void {
  eventBus.on('message:received', (event) => {
    const data = event.data as { session: { channelType: string }; message: { content: string } };
    console.log(chalk.blue(`[${data.session.channelType}] Message received`));
  });

  eventBus.on('message:sent', (event) => {
    const data = event.data as { session: { channelType: string } };
    console.log(chalk.green(`[${data.session.channelType}] Response sent`));
  });

  eventBus.on('error', (event) => {
    console.log(chalk.red(`[Error] ${JSON.stringify(event.data)}`));
  });

  eventBus.on('channel:connected', (event) => {
    const data = event.data as { channelName: string };
    console.log(chalk.green(`[Channel] ${data.channelName} connected`));
  });

  eventBus.on('channel:disconnected', (event) => {
    const data = event.data as { channelName: string };
    console.log(chalk.yellow(`[Channel] ${data.channelName} disconnected`));
  });
}
