import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { AppConfig } from './types';

dotenv.config();

export function loadConfig(configPath?: string): AppConfig {
  let fileConfig: Partial<AppConfig> = {};

  // Load from config file if provided
  const cfgFile = configPath || path.join(process.cwd(), 'config', 'default.json');
  if (fs.existsSync(cfgFile)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(cfgFile, 'utf-8'));
    } catch {
      // Ignore invalid config files
    }
  }

  const env = process.env;

  return {
    aiProvider: env.AI_PROVIDER || fileConfig.aiProvider || 'anthropic',
    aiModel: env.AI_MODEL || fileConfig.aiModel || 'claude-sonnet-4-20250514',
    providers: {
      anthropic: {
        apiKey: env.ANTHROPIC_API_KEY || '',
        model: env.AI_MODEL || 'claude-sonnet-4-20250514',
        baseUrl: 'https://api.anthropic.com',
      },
      openai: {
        apiKey: env.OPENAI_API_KEY || '',
        model: env.AI_MODEL || 'gpt-4o',
        baseUrl: 'https://api.openai.com/v1',
      },
      ollama: {
        baseUrl: env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: env.AI_MODEL || 'llama3',
      },
      ...fileConfig.providers,
    },
    webPort: parseInt(env.WEB_PORT || '3000', 10),
    webHost: env.WEB_HOST || '0.0.0.0',
    heartbeatInterval: parseInt(env.HEARTBEAT_INTERVAL || '15', 10),
    memoryPath: env.MEMORY_PATH || fileConfig.memoryPath || './data/memory',
    skillsPath: env.SKILLS_PATH || fileConfig.skillsPath || './data/skills',
    sandboxMode: (env.SANDBOX_MODE as AppConfig['sandboxMode']) || fileConfig.sandboxMode || 'restricted',
    logLevel: (env.LOG_LEVEL as AppConfig['logLevel']) || fileConfig.logLevel || 'info',
    channels: {
      telegram: { token: env.TELEGRAM_BOT_TOKEN || '' },
      discord: { token: env.DISCORD_BOT_TOKEN || '' },
      slack: { botToken: env.SLACK_BOT_TOKEN || '', appToken: env.SLACK_APP_TOKEN || '' },
      ...fileConfig.channels,
    },
  };
}
