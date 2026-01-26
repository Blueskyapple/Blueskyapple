#!/usr/bin/env node

/**
 * BlueBot CLI - Command Line Interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, saveConfig, validateConfig, generateSampleConfig } from '../config/index.js';
import { startBot } from './commands/start.js';
import { runSetupWizard } from './commands/setup.js';
import { chatCommand } from './commands/chat.js';
import { manageSkills } from './commands/skills.js';
import { manageChannels } from './commands/channels.js';

const program = new Command();

// ASCII art logo
const logo = `
${chalk.blue('  ____  _            ____        _   ')}
${chalk.blue(' | __ )| |_   _  ___| __ )  ___ | |_ ')}
${chalk.blue(" |  _ \\| | | | |/ _ \\  _ \\ / _ \\| __|")}
${chalk.blue(' | |_) | | |_| |  __/ |_) | (_) | |_ ')}
${chalk.blue(' |____/|_|\\__,_|\\___|____/ \\___/ \\__|')}
${chalk.gray('        Your Personal AI Assistant')}
`;

program
  .name('bluebot')
  .description('BlueBot - Your personal AI assistant')
  .version('1.0.0')
  .hook('preAction', () => {
    console.log(logo);
  });

// Start command
program
  .command('start')
  .description('Start the BlueBot gateway and channels')
  .option('-c, --config <path>', 'Path to config file')
  .option('-p, --port <number>', 'Gateway port', '18800')
  .option('--no-gateway', 'Disable HTTP/WebSocket gateway')
  .action(async (options) => {
    try {
      await startBot(options);
    } catch (error) {
      console.error(chalk.red('Error starting BlueBot:'), error);
      process.exit(1);
    }
  });

// Setup wizard
program
  .command('setup')
  .alias('init')
  .description('Run the interactive setup wizard')
  .option('-c, --config <path>', 'Path to save config file')
  .action(async (options) => {
    try {
      await runSetupWizard(options);
    } catch (error) {
      console.error(chalk.red('Error during setup:'), error);
      process.exit(1);
    }
  });

// Chat command (CLI chat interface)
program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-c, --config <path>', 'Path to config file')
  .option('-s, --session <id>', 'Session ID to continue')
  .action(async (options) => {
    try {
      await chatCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Skills management
program
  .command('skills')
  .description('Manage skills')
  .option('-l, --list', 'List all skills')
  .option('-e, --enable <id>', 'Enable a skill')
  .option('-d, --disable <id>', 'Disable a skill')
  .option('-i, --info <id>', 'Get skill info')
  .action(async (options) => {
    try {
      await manageSkills(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Channels management
program
  .command('channels')
  .description('Manage channels')
  .option('-l, --list', 'List all channels')
  .option('-a, --add <type>', 'Add a new channel')
  .option('-r, --remove <id>', 'Remove a channel')
  .option('-t, --test <id>', 'Test channel connection')
  .action(async (options) => {
    try {
      await manageChannels(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('-s, --show', 'Show current configuration')
  .option('-v, --validate', 'Validate configuration')
  .option('-g, --generate', 'Generate sample config file')
  .option('-p, --path <path>', 'Config file path')
  .action(async (options) => {
    try {
      if (options.generate) {
        const sample = generateSampleConfig();
        const configPath = options.path || 'bluebot.yaml';
        await saveConfig(sample, configPath);
        console.log(chalk.green(`Sample config generated at: ${configPath}`));
        return;
      }

      const config = await loadConfig(options.path);

      if (options.validate) {
        const { valid, errors } = validateConfig(config);
        if (valid) {
          console.log(chalk.green('Configuration is valid!'));
        } else {
          console.log(chalk.red('Configuration errors:'));
          errors.forEach((e) => console.log(chalk.red(`  - ${e}`)));
        }
        return;
      }

      // Default: show config
      console.log(chalk.cyan('\nCurrent Configuration:\n'));
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check BlueBot status')
  .option('-p, --port <number>', 'Gateway port', '18800')
  .action(async (options) => {
    try {
      const response = await fetch(`http://127.0.0.1:${options.port}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log(chalk.green('\nBlueBot is running!\n'));
        console.log(`  Status: ${chalk.green(data.status)}`);
        console.log(`  Version: ${data.version}`);
        console.log(`  Sessions: ${data.sessions}`);
        console.log(`  Clients: ${data.clients}`);
      } else {
        console.log(chalk.yellow('\nBlueBot is not responding correctly'));
      }
    } catch {
      console.log(chalk.red('\nBlueBot is not running'));
      console.log(chalk.gray(`  Run 'bluebot start' to start the bot`));
    }
  });

// Version with more info
program
  .command('info')
  .description('Show detailed version and system info')
  .action(() => {
    console.log('\n' + chalk.cyan('BlueBot Information\n'));
    console.log(`  Version: 1.0.0`);
    console.log(`  Node.js: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Architecture: ${process.arch}`);
    console.log(`  Working Directory: ${process.cwd()}`);
    console.log('\n' + chalk.gray('Documentation: https://github.com/Blueskyapple/Blueskyapple'));
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
