/**
 * Channels management command for BlueBot CLI
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig, saveConfig } from '../../config/index.js';
import { Channel, ChannelType } from '../../core/types.js';

interface ChannelsOptions {
  list?: boolean;
  add?: string;
  remove?: string;
  test?: string;
}

export async function manageChannels(options: ChannelsOptions): Promise<void> {
  const config = await loadConfig();

  if (options.list || (!options.add && !options.remove && !options.test)) {
    // List all channels
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white.bold('  Configured Channels'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    if (config.channels.length === 0) {
      console.log(chalk.gray('  No channels configured.'));
      console.log(chalk.gray('  Use --add <type> to add a channel.'));
      console.log(chalk.gray('  Available types: discord, telegram, slack\n'));
      return;
    }

    for (const channel of config.channels) {
      const status = channel.enabled
        ? chalk.green('● enabled')
        : chalk.gray('○ disabled');

      console.log(chalk.white(`  ${channel.name}`));
      console.log(chalk.gray(`    ID: ${channel.id}`));
      console.log(chalk.gray(`    Type: ${channel.type}`));
      console.log(chalk.gray(`    Status: ${status}`));
      console.log();
    }

    console.log(chalk.gray('  Use --add <type> to add a new channel'));
    console.log(chalk.gray('  Use --remove <id> to remove a channel'));
    console.log(chalk.gray('  Use --test <id> to test a channel connection\n'));
    return;
  }

  if (options.add) {
    const channelType = options.add.toLowerCase() as ChannelType;
    const validTypes = ['discord', 'telegram', 'slack'];

    if (!validTypes.includes(channelType)) {
      console.log(chalk.red(`\nInvalid channel type: ${options.add}`));
      console.log(chalk.gray(`Valid types: ${validTypes.join(', ')}`));
      return;
    }

    console.log(chalk.cyan(`\nAdding ${channelType} channel...\n`));

    let newChannel: Channel;

    if (channelType === 'discord') {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Channel name:',
          default: 'Discord Bot',
        },
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
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable this channel?',
          default: true,
        },
      ]);

      newChannel = {
        id: `discord-${Date.now()}`,
        type: 'discord',
        name: answers.name,
        enabled: answers.enabled,
        config: {
          token: answers.token,
          prefix: answers.prefix,
          respondToDMs: answers.respondToDMs,
          respondToMentions: answers.respondToMentions,
        },
      };
    } else if (channelType === 'telegram') {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Channel name:',
          default: 'Telegram Bot',
        },
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
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable this channel?',
          default: true,
        },
      ]);

      newChannel = {
        id: `telegram-${Date.now()}`,
        type: 'telegram',
        name: answers.name,
        enabled: answers.enabled,
        config: {
          token: answers.token,
          respondToGroups: answers.respondToGroups,
        },
      };
    } else {
      // Slack
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Channel name:',
          default: 'Slack Bot',
        },
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
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable this channel?',
          default: true,
        },
      ]);

      newChannel = {
        id: `slack-${Date.now()}`,
        type: 'slack',
        name: answers.name,
        enabled: answers.enabled,
        config: {
          botToken: answers.botToken,
          respondToDMs: answers.respondToDMs,
          respondToMentions: answers.respondToMentions,
        },
      };
    }

    config.channels.push(newChannel);
    await saveConfig(config);
    console.log(chalk.green(`\nChannel added: ${newChannel.name} (${newChannel.id})`));
    return;
  }

  if (options.remove) {
    const index = config.channels.findIndex((c) => c.id === options.remove);
    if (index === -1) {
      console.log(chalk.red(`\nChannel not found: ${options.remove}`));
      return;
    }

    const channel = config.channels[index];
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Remove channel "${channel.name}"?`,
        default: false,
      },
    ]);

    if (confirm.confirm) {
      config.channels.splice(index, 1);
      await saveConfig(config);
      console.log(chalk.yellow(`\nChannel removed: ${channel.name}`));
    } else {
      console.log(chalk.gray('\nCancelled.'));
    }
    return;
  }

  if (options.test) {
    const channel = config.channels.find((c) => c.id === options.test);
    if (!channel) {
      console.log(chalk.red(`\nChannel not found: ${options.test}`));
      return;
    }

    console.log(chalk.cyan(`\nTesting ${channel.name}...\n`));

    try {
      // Import the appropriate channel module
      if (channel.type === 'discord') {
        const { Client, GatewayIntentBits } = await import('discord.js');
        const client = new Client({
          intents: [GatewayIntentBits.Guilds],
        });

        await new Promise<void>((resolve, reject) => {
          client.once('ready', () => {
            console.log(chalk.green(`  Connected as: ${client.user?.tag}`));
            client.destroy();
            resolve();
          });
          client.once('error', reject);
          client.login(channel.config.token as string);
        });
      } else if (channel.type === 'telegram') {
        const TelegramBot = (await import('node-telegram-bot-api')).default;
        const bot = new TelegramBot(channel.config.token as string);
        const me = await bot.getMe();
        console.log(chalk.green(`  Connected as: @${me.username}`));
        bot.stopPolling();
      } else if (channel.type === 'slack') {
        const { WebClient } = await import('@slack/web-api');
        const client = new WebClient(channel.config.botToken as string);
        const auth = await client.auth.test();
        console.log(chalk.green(`  Connected as: ${auth.user}`));
      }

      console.log(chalk.green('\n  Connection test passed!\n'));
    } catch (error) {
      console.log(chalk.red(`\n  Connection test failed: ${error}\n`));
    }
    return;
  }
}
