/**
 * Setup wizard for BlueBot CLI
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';
import path from 'path';
import { BlueBotConfig, Channel } from '../../core/types.js';
import { saveConfig, defaultConfig } from '../../config/index.js';

interface SetupOptions {
  config?: string;
}

export async function runSetupWizard(options: SetupOptions): Promise<void> {
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.white.bold('  BlueBot Setup Wizard'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.gray('This wizard will help you configure BlueBot.\n'));

  // Start with default config
  const config: BlueBotConfig = { ...defaultConfig, channels: [] };

  // Step 1: AI Provider
  console.log(chalk.yellow('\n📦 Step 1: AI Provider\n'));

  const aiAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select your AI provider:',
      choices: [
        { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
        { name: 'Anthropic (Claude)', value: 'anthropic' },
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'Custom/OpenAI-compatible', value: 'custom' },
      ],
    },
    {
      type: 'input',
      name: 'model',
      message: 'Model name:',
      default: (answers: { provider: string }) => {
        switch (answers.provider) {
          case 'openai':
            return 'gpt-4o-mini';
          case 'anthropic':
            return 'claude-3-haiku-20240307';
          case 'ollama':
            return 'llama3';
          default:
            return 'gpt-3.5-turbo';
        }
      },
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key (leave empty to use environment variable):',
      when: (answers) => ['openai', 'anthropic'].includes(answers.provider),
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Base URL for API:',
      when: (answers) => ['custom', 'ollama'].includes(answers.provider),
      default: (answers: { provider: string }) => {
        if (answers.provider === 'ollama') return 'http://localhost:11434/v1';
        return '';
      },
    },
  ]);

  config.ai = {
    ...config.ai,
    provider: aiAnswers.provider,
    model: aiAnswers.model,
    apiKey: aiAnswers.apiKey || undefined,
    baseUrl: aiAnswers.baseUrl || undefined,
  };

  // Step 2: Gateway Configuration
  console.log(chalk.yellow('\n🌐 Step 2: Gateway Settings\n'));

  const gatewayAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: 'Gateway port:',
      default: '18800',
      validate: (input) => {
        const port = parseInt(input, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          return 'Please enter a valid port number (1-65535)';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'cors',
      message: 'Enable CORS? (Required for web clients)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'authEnabled',
      message: 'Enable authentication?',
      default: false,
    },
    {
      type: 'password',
      name: 'authToken',
      message: 'Auth token:',
      when: (answers) => answers.authEnabled,
    },
  ]);

  config.gateway = {
    host: '127.0.0.1',
    port: parseInt(gatewayAnswers.port, 10),
    cors: gatewayAnswers.cors,
    auth: {
      enabled: gatewayAnswers.authEnabled,
      token: gatewayAnswers.authToken,
    },
  };

  // Step 3: Channels
  console.log(chalk.yellow('\n💬 Step 3: Messaging Channels\n'));

  const channelAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'channels',
      message: 'Select channels to configure:',
      choices: [
        { name: 'Discord', value: 'discord' },
        { name: 'Telegram', value: 'telegram' },
        { name: 'Slack', value: 'slack' },
      ],
    },
  ]);

  // Configure each selected channel
  for (const channelType of channelAnswers.channels) {
    console.log(chalk.gray(`\nConfiguring ${channelType}...\n`));

    if (channelType === 'discord') {
      const discordAnswers = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Discord bot token:',
        },
        {
          type: 'input',
          name: 'prefix',
          message: 'Command prefix:',
          default: '!bot',
        },
        {
          type: 'confirm',
          name: 'respondToDMs',
          message: 'Respond to direct messages?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'respondToMentions',
          message: 'Respond to @mentions?',
          default: true,
        },
      ]);

      config.channels.push({
        id: 'discord-main',
        type: 'discord',
        name: 'Discord Bot',
        enabled: true,
        config: {
          token: discordAnswers.token,
          prefix: discordAnswers.prefix,
          respondToDMs: discordAnswers.respondToDMs,
          respondToMentions: discordAnswers.respondToMentions,
        },
      });
    }

    if (channelType === 'telegram') {
      const telegramAnswers = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Telegram bot token (from @BotFather):',
        },
        {
          type: 'confirm',
          name: 'respondToGroups',
          message: 'Respond in groups?',
          default: true,
        },
      ]);

      config.channels.push({
        id: 'telegram-main',
        type: 'telegram',
        name: 'Telegram Bot',
        enabled: true,
        config: {
          token: telegramAnswers.token,
          respondToGroups: telegramAnswers.respondToGroups,
        },
      });
    }

    if (channelType === 'slack') {
      const slackAnswers = await inquirer.prompt([
        {
          type: 'password',
          name: 'botToken',
          message: 'Slack bot token (xoxb-...):',
        },
        {
          type: 'confirm',
          name: 'respondToDMs',
          message: 'Respond to direct messages?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'respondToMentions',
          message: 'Respond to @mentions?',
          default: true,
        },
      ]);

      config.channels.push({
        id: 'slack-main',
        type: 'slack',
        name: 'Slack Bot',
        enabled: true,
        config: {
          botToken: slackAnswers.botToken,
          respondToDMs: slackAnswers.respondToDMs,
          respondToMentions: slackAnswers.respondToMentions,
        },
      });
    }
  }

  // Step 4: Skills
  console.log(chalk.yellow('\n🛠️  Step 4: Skills\n'));

  const skillAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'skills',
      message: 'Select skills to enable:',
      choices: [
        { name: 'Weather - Get weather information', value: 'weather', checked: true },
        { name: 'Calculator - Math calculations', value: 'calculator', checked: true },
        { name: 'Reminder - Set reminders', value: 'reminder', checked: true },
        { name: 'System Info - System information', value: 'system-info', checked: true },
        { name: 'Web Search - Search the web', value: 'web-search', checked: true },
        { name: 'Notes - Take notes', value: 'notes', checked: true },
      ],
    },
  ]);

  config.skills = skillAnswers.skills;

  // Step 5: Storage
  console.log(chalk.yellow('\n💾 Step 5: Storage\n'));

  const storageAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Storage directory:',
      default: '.bluebot',
    },
  ]);

  config.storage = {
    type: 'local',
    path: storageAnswers.path,
    encryption: false,
  };

  // Step 6: System Prompt
  console.log(chalk.yellow('\n🤖 Step 6: Bot Personality\n'));

  const promptAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customPrompt',
      message: 'Would you like to customize the bot personality?',
      default: false,
    },
    {
      type: 'editor',
      name: 'systemPrompt',
      message: 'Enter system prompt:',
      when: (answers) => answers.customPrompt,
      default: config.ai.systemPrompt,
    },
  ]);

  if (promptAnswers.systemPrompt) {
    config.ai.systemPrompt = promptAnswers.systemPrompt;
  }

  // Save configuration
  console.log(chalk.yellow('\n💾 Saving configuration...\n'));

  const configPath = options.config || 'bluebot.yaml';
  await saveConfig(config, configPath);

  // Create storage directory
  await fs.mkdir(config.storage.path, { recursive: true });

  // Print summary
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.green.bold('  Setup Complete!'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.white('  Configuration saved to: ') + chalk.cyan(configPath));
  console.log(chalk.white('  Storage directory: ') + chalk.cyan(config.storage.path));

  console.log(chalk.white('\n  AI Provider: ') + chalk.cyan(`${config.ai.provider}/${config.ai.model}`));
  console.log(chalk.white('  Gateway: ') + chalk.cyan(`http://${config.gateway.host}:${config.gateway.port}`));

  if (config.channels.length > 0) {
    console.log(chalk.white('\n  Configured Channels:'));
    config.channels.forEach((ch) => {
      console.log(chalk.gray(`    - ${ch.name} (${ch.type})`));
    });
  }

  console.log(chalk.white('\n  Enabled Skills:'));
  config.skills.forEach((skill) => {
    console.log(chalk.gray(`    - ${skill}`));
  });

  console.log(chalk.yellow('\n  Next steps:'));
  console.log(chalk.gray('    1. Review and edit bluebot.yaml if needed'));
  console.log(chalk.gray('    2. Set your API key in environment: export OPENAI_API_KEY=your-key'));
  console.log(chalk.gray('    3. Run: bluebot start\n'));
}
