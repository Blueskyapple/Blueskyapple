/**
 * Interactive chat command for BlueBot CLI
 */

import chalk from 'chalk';
import readline from 'readline';
import { loadConfig, getEnvConfig } from '../../config/index.js';
import { createAgent } from '../../core/agent.js';
import { SessionManager } from '../../core/session.js';
import { createLocalStorage } from '../../storage/local.js';
import { SkillManager, builtinSkills } from '../../skills/index.js';

interface ChatOptions {
  config?: string;
  session?: string;
}

export async function chatCommand(options: ChatOptions): Promise<void> {
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.white.bold('  BlueBot Interactive Chat'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  // Load configuration
  let config = await loadConfig(options.config);
  const envConfig = getEnvConfig();
  config = { ...config, ...envConfig } as typeof config;

  // Initialize storage
  const storage = createLocalStorage(config.storage);
  await storage.init();

  // Initialize session manager
  const sessionManager = new SessionManager(storage);

  // Initialize agent
  const agent = createAgent(config.ai);

  // Load skills
  const skillManager = new SkillManager(agent);
  for (const skill of builtinSkills) {
    if (config.skills.includes(skill.id)) {
      skillManager.registerSkill(skill);
    }
  }

  // Create or restore session
  const session = await sessionManager.createSession(
    'cli',
    'cli',
    options.session || 'cli-user'
  );

  console.log(chalk.gray(`Session: ${session.id}`));
  console.log(chalk.gray(`AI: ${config.ai.provider}/${config.ai.model}`));
  console.log(chalk.gray(`Skills: ${skillManager.count} loaded`));
  console.log(chalk.gray('\nCommands: /help, /clear, /exit\n'));

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const promptUser = () => {
    rl.question(chalk.blue('\nYou: '), async (input) => {
      const trimmedInput = input.trim();

      if (!trimmedInput) {
        promptUser();
        return;
      }

      // Handle commands
      if (trimmedInput.startsWith('/')) {
        const handled = await handleCommand(
          trimmedInput,
          session,
          sessionManager,
          rl
        );
        if (handled === 'exit') {
          return;
        }
        promptUser();
        return;
      }

      // Add user message to session
      const userMessage = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        channelId: 'cli',
        channelType: 'cli' as const,
        content: trimmedInput,
        role: 'user' as const,
        timestamp: new Date(),
      };
      await sessionManager.addMessage(session.id, userMessage);

      // Get AI response
      console.log(chalk.green('\nBlueBot: ') + chalk.gray('thinking...'));

      try {
        // Stream response
        let response = '';
        process.stdout.write(chalk.green('\nBlueBot: '));

        for await (const chunk of agent.streamChat(
          trimmedInput,
          session.context
        )) {
          response += chunk;
          process.stdout.write(chunk);
        }

        console.log(); // New line after response

        // Add assistant message to session
        const assistantMessage = {
          id: crypto.randomUUID(),
          sessionId: session.id,
          channelId: 'cli',
          channelType: 'cli' as const,
          content: response,
          role: 'assistant' as const,
          timestamp: new Date(),
        };
        await sessionManager.addMessage(session.id, assistantMessage);
      } catch (error) {
        console.log(chalk.red('\nError: ') + String(error));

        if (String(error).includes('API key')) {
          console.log(
            chalk.yellow('\nMake sure your API key is set correctly.')
          );
          console.log(chalk.gray('  export OPENAI_API_KEY=your-key-here'));
        }
      }

      promptUser();
    });
  };

  // Handle close
  rl.on('close', () => {
    console.log(chalk.yellow('\n\nGoodbye!\n'));
    process.exit(0);
  });

  // Start prompting
  promptUser();
}

async function handleCommand(
  command: string,
  session: any,
  sessionManager: SessionManager,
  rl: readline.Interface
): Promise<string | void> {
  const [cmd, ...args] = command.slice(1).split(' ');

  switch (cmd.toLowerCase()) {
    case 'help':
      console.log(chalk.cyan('\nAvailable commands:'));
      console.log(chalk.gray('  /help    - Show this help message'));
      console.log(chalk.gray('  /clear   - Clear conversation history'));
      console.log(chalk.gray('  /history - Show conversation history'));
      console.log(chalk.gray('  /session - Show session info'));
      console.log(chalk.gray('  /exit    - Exit the chat'));
      break;

    case 'clear':
      sessionManager.clearMessages(session.id);
      console.log(chalk.green('\nConversation history cleared.'));
      break;

    case 'history':
      const context = sessionManager.getContext(session.id);
      if (context && context.messages.length > 0) {
        console.log(chalk.cyan('\nConversation history:'));
        for (const msg of context.messages) {
          const role = msg.role === 'user' ? chalk.blue('You') : chalk.green('BlueBot');
          console.log(`\n${role}: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
        }
      } else {
        console.log(chalk.gray('\nNo messages in history.'));
      }
      break;

    case 'session':
      console.log(chalk.cyan('\nSession info:'));
      console.log(chalk.gray(`  ID: ${session.id}`));
      console.log(chalk.gray(`  Created: ${session.createdAt.toISOString()}`));
      console.log(chalk.gray(`  Messages: ${session.context.messages.length}`));
      break;

    case 'exit':
    case 'quit':
      console.log(chalk.yellow('\nGoodbye!\n'));
      rl.close();
      return 'exit';

    default:
      console.log(chalk.red(`\nUnknown command: ${cmd}`));
      console.log(chalk.gray('Type /help for available commands.'));
  }
}
