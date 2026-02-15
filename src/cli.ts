#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { OpenClaw } from './index';

const program = new Command();

const BANNER = `
  ___                    ____ _
 / _ \\ _ __   ___ _ __  / ___| | __ ___      __
| | | | '_ \\ / _ \\ '_ \\| |   | |/ _\` \\ \\ /\\ / /
| |_| | |_) |  __/ | | | |___| | (_| |\\ V  V /
 \\___/| .__/ \\___|_| |_|\\____|_|\\__,_| \\_/\\_/
      |_|
`;

program
  .name('openclaw')
  .description('OpenClaw - Your Personal AI Assistant')
  .version('1.0.0');

program
  .command('start')
  .description('Start the OpenClaw AI assistant')
  .option('-c, --config <path>', 'Path to config file')
  .option('-p, --port <number>', 'Web UI port', '3000')
  .option('--provider <name>', 'AI provider (anthropic, openai, ollama)')
  .option('--model <name>', 'AI model name')
  .action(async (options) => {
    console.log(chalk.blue(BANNER));
    console.log(chalk.bold('  Your Personal AI Assistant'));
    console.log(chalk.gray('  Open Source & Privacy-Focused'));
    console.log();

    // Override env vars from CLI options
    if (options.port) process.env.WEB_PORT = options.port;
    if (options.provider) process.env.AI_PROVIDER = options.provider;
    if (options.model) process.env.AI_MODEL = options.model;

    try {
      const app = new OpenClaw(options.config);
      await app.start();

      // Handle graceful shutdown
      const shutdown = async () => {
        console.log(chalk.yellow('\nShutting down...'));
        await app.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err) {
      console.error(chalk.red('Failed to start OpenClaw:'), err);
      process.exit(1);
    }
  });

program
  .command('chat')
  .description('Start an interactive CLI chat session')
  .option('-c, --config <path>', 'Path to config file')
  .option('--provider <name>', 'AI provider (anthropic, openai, ollama)')
  .option('--model <name>', 'AI model name')
  .action(async (options) => {
    console.log(chalk.blue(BANNER));

    if (options.provider) process.env.AI_PROVIDER = options.provider;
    if (options.model) process.env.AI_MODEL = options.model;

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const app = new OpenClaw(options.config);
      const agent = app.getAgent();

      console.log(chalk.green('OpenClaw is ready. Type "exit" to quit.\n'));

      const askQuestion = () => {
        rl.question(chalk.cyan('You: '), async (input: string) => {
          const trimmed = input.trim();
          if (!trimmed) {
            askQuestion();
            return;
          }
          if (trimmed.toLowerCase() === 'exit') {
            console.log(chalk.yellow('Goodbye!'));
            await app.stop();
            rl.close();
            process.exit(0);
          }

          try {
            const response = await agent.processMessage(trimmed, 'cli-user', 'cli');
            console.log(chalk.green('\nOpenClaw: ') + response + '\n');
          } catch (err) {
            console.error(chalk.red('Error:'), err);
          }

          askQuestion();
        });
      };

      askQuestion();
    } catch (err) {
      console.error(chalk.red('Failed to start:'), err);
      rl.close();
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show current configuration')
  .option('-c, --config <path>', 'Path to config file')
  .action((options) => {
    const { loadConfig } = require('./core/config');
    const config = loadConfig(options.config);

    // Redact sensitive values
    const safe = JSON.parse(JSON.stringify(config));
    for (const provider of Object.values(safe.providers) as any[]) {
      if (provider.apiKey) {
        provider.apiKey = provider.apiKey.substring(0, 8) + '...';
      }
    }
    for (const channel of Object.values(safe.channels) as any[]) {
      for (const key of Object.keys(channel)) {
        if (key.toLowerCase().includes('token') && channel[key]) {
          channel[key] = channel[key].substring(0, 8) + '...';
        }
      }
    }

    console.log(chalk.bold('OpenClaw Configuration:\n'));
    console.log(JSON.stringify(safe, null, 2));
  });

program
  .command('skills')
  .description('List available skills')
  .action(() => {
    console.log(chalk.bold('\nBuilt-in Skills:\n'));
    const skills = [
      { name: 'memory', desc: 'Store and retrieve persistent memories', tools: ['memory_store', 'memory_search', 'memory_list', 'memory_delete'] },
      { name: 'filesystem', desc: 'Read, write, and manage files', tools: ['fs_read', 'fs_write', 'fs_list', 'fs_mkdir', 'fs_delete', 'fs_exists'] },
      { name: 'shell', desc: 'Execute shell commands', tools: ['shell_exec'] },
      { name: 'webbrowse', desc: 'Fetch and read web content', tools: ['web_fetch', 'web_search_summary'] },
    ];

    for (const skill of skills) {
      console.log(chalk.cyan(`  ${skill.name}`) + ` - ${skill.desc}`);
      console.log(chalk.gray(`    Tools: ${skill.tools.join(', ')}`));
      console.log();
    }
  });

program.parse();
