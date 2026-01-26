/**
 * Configuration management for BlueBot
 */

import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';
import { BlueBotConfig } from '../core/types.js';

const DEFAULT_CONFIG_NAME = 'bluebot.yaml';

/**
 * Default configuration
 */
export const defaultConfig: BlueBotConfig = {
  name: 'BlueBot',
  version: '1.0.0',
  gateway: {
    host: '127.0.0.1',
    port: 18800,
    cors: true,
    auth: {
      enabled: false,
    },
  },
  ai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: `You are BlueBot, a helpful personal AI assistant. You are friendly, knowledgeable, and always aim to provide accurate and useful information. When you don't know something, you say so honestly.`,
  },
  channels: [],
  skills: ['weather', 'calculator', 'reminder', 'system-info', 'web-search', 'notes'],
  storage: {
    type: 'local',
    path: '.bluebot',
    encryption: false,
  },
};

/**
 * Load configuration from file
 */
export async function loadConfig(configPath?: string): Promise<BlueBotConfig> {
  const filePath = configPath || findConfigFile();

  if (!filePath) {
    console.log('No config file found, using defaults');
    return { ...defaultConfig };
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    let parsed: Partial<BlueBotConfig>;
    if (ext === '.json') {
      parsed = JSON.parse(content);
    } else {
      parsed = YAML.parse(content);
    }

    // Merge with defaults
    return mergeConfig(defaultConfig, parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('Config file not found, using defaults');
      return { ...defaultConfig };
    }
    throw error;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(
  config: BlueBotConfig,
  configPath?: string
): Promise<void> {
  const filePath = configPath || path.join(process.cwd(), DEFAULT_CONFIG_NAME);
  const ext = path.extname(filePath).toLowerCase();

  let content: string;
  if (ext === '.json') {
    content = JSON.stringify(config, null, 2);
  } else {
    content = YAML.stringify(config, { indent: 2 });
  }

  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Find config file in current directory or home
 */
function findConfigFile(): string | undefined {
  const possiblePaths = [
    path.join(process.cwd(), 'bluebot.yaml'),
    path.join(process.cwd(), 'bluebot.yml'),
    path.join(process.cwd(), 'bluebot.json'),
    path.join(process.cwd(), '.bluebot', 'config.yaml'),
    path.join(process.env.HOME || '', '.bluebot', 'config.yaml'),
  ];

  for (const p of possiblePaths) {
    try {
      require('fs').accessSync(p);
      return p;
    } catch {
      // Continue checking
    }
  }

  return undefined;
}

/**
 * Deep merge configurations
 */
function mergeConfig(
  defaults: BlueBotConfig,
  overrides: Partial<BlueBotConfig>
): BlueBotConfig {
  const result = { ...defaults };

  for (const key of Object.keys(overrides) as Array<keyof BlueBotConfig>) {
    const value = overrides[key];
    if (value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        result[key] = {
          ...(defaults[key] as object),
          ...(value as object),
        } as any;
      } else {
        result[key] = value as any;
      }
    }
  }

  return result;
}

/**
 * Validate configuration
 */
export function validateConfig(config: BlueBotConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!config.ai.provider) {
    errors.push('AI provider is required');
  }

  if (!config.ai.model) {
    errors.push('AI model is required');
  }

  // Check API key for cloud providers
  if (['openai', 'anthropic'].includes(config.ai.provider)) {
    if (!config.ai.apiKey && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      errors.push(`API key required for ${config.ai.provider}. Set in config or environment.`);
    }
  }

  // Check channel configurations
  for (const channel of config.channels) {
    if (channel.enabled) {
      if (channel.type === 'discord' && !channel.config.token) {
        errors.push('Discord channel requires a token');
      }
      if (channel.type === 'telegram' && !channel.config.token) {
        errors.push('Telegram channel requires a token');
      }
      if (channel.type === 'slack' && !channel.config.botToken) {
        errors.push('Slack channel requires a bot token');
      }
    }
  }

  // Validate port
  if (config.gateway.port < 1 || config.gateway.port > 65535) {
    errors.push('Gateway port must be between 1 and 65535');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate sample config file
 */
export function generateSampleConfig(): BlueBotConfig {
  return {
    ...defaultConfig,
    ai: {
      ...defaultConfig.ai,
      apiKey: 'your-api-key-here',
    },
    channels: [
      {
        id: 'discord-main',
        type: 'discord',
        name: 'Discord Bot',
        enabled: false,
        config: {
          token: 'your-discord-bot-token',
          prefix: '!bot',
          respondToDMs: true,
          respondToMentions: true,
        },
      },
      {
        id: 'telegram-main',
        type: 'telegram',
        name: 'Telegram Bot',
        enabled: false,
        config: {
          token: 'your-telegram-bot-token',
          respondToGroups: true,
        },
      },
      {
        id: 'slack-main',
        type: 'slack',
        name: 'Slack Bot',
        enabled: false,
        config: {
          botToken: 'xoxb-your-slack-bot-token',
          respondToDMs: true,
          respondToMentions: true,
        },
      },
    ],
  };
}

/**
 * Get environment variable mappings
 */
export function getEnvConfig(): Partial<BlueBotConfig> {
  const env: Partial<BlueBotConfig> = {};

  // AI config from environment
  if (process.env.BLUEBOT_AI_PROVIDER) {
    env.ai = env.ai || {} as any;
    (env.ai as any).provider = process.env.BLUEBOT_AI_PROVIDER;
  }

  if (process.env.BLUEBOT_AI_MODEL) {
    env.ai = env.ai || {} as any;
    (env.ai as any).model = process.env.BLUEBOT_AI_MODEL;
  }

  if (process.env.OPENAI_API_KEY) {
    env.ai = env.ai || {} as any;
    (env.ai as any).apiKey = process.env.OPENAI_API_KEY;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    env.ai = env.ai || {} as any;
    (env.ai as any).apiKey = process.env.ANTHROPIC_API_KEY;
  }

  // Gateway config from environment
  if (process.env.BLUEBOT_PORT) {
    env.gateway = env.gateway || {} as any;
    (env.gateway as any).port = parseInt(process.env.BLUEBOT_PORT, 10);
  }

  if (process.env.BLUEBOT_HOST) {
    env.gateway = env.gateway || {} as any;
    (env.gateway as any).host = process.env.BLUEBOT_HOST;
  }

  return env;
}
