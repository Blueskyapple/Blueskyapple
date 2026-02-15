import chalk from 'chalk';
import { Logger } from './types';

const LOG_LEVELS: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(level: string = 'info'): Logger {
  const threshold = LOG_LEVELS[level] ?? 1;

  const timestamp = () => new Date().toISOString();

  return {
    debug(msg: string, ...args: unknown[]) {
      if (threshold <= 0) {
        console.log(chalk.gray(`[${timestamp()}] [DEBUG] ${msg}`), ...args);
      }
    },
    info(msg: string, ...args: unknown[]) {
      if (threshold <= 1) {
        console.log(chalk.blue(`[${timestamp()}] [INFO]  ${msg}`), ...args);
      }
    },
    warn(msg: string, ...args: unknown[]) {
      if (threshold <= 2) {
        console.log(chalk.yellow(`[${timestamp()}] [WARN]  ${msg}`), ...args);
      }
    },
    error(msg: string, ...args: unknown[]) {
      if (threshold <= 3) {
        console.log(chalk.red(`[${timestamp()}] [ERROR] ${msg}`), ...args);
      }
    },
  };
}
