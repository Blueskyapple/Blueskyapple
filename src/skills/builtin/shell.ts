import { execSync } from 'child_process';
import { Skill, ToolDefinition } from '../../core/types';

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'mkfs',
  'dd if=',
  ':(){',
  'fork bomb',
  '> /dev/sda',
];

const MAX_OUTPUT_LENGTH = 50000;
const DEFAULT_TIMEOUT = 30000;

/**
 * ShellSkill provides the ability to execute shell commands.
 * Includes safety restrictions to prevent destructive operations.
 */
export class ShellSkill implements Skill {
  name = 'shell';
  description = 'Execute shell commands on the local system';
  version = '1.0.0';

  tools: ToolDefinition[] = [
    {
      name: 'shell_exec',
      description:
        'Execute a shell command and return the output. Use for running scripts, checking system info, managing processes, etc.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute',
          },
          cwd: {
            type: 'string',
            description: 'Working directory (optional)',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000)',
          },
        },
        required: ['command'],
      },
    },
  ];

  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    if (toolName !== 'shell_exec') {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const command = args.command as string;
    const cwd = args.cwd as string | undefined;
    const timeout = (args.timeout as number) || DEFAULT_TIMEOUT;

    // Safety check
    const lowerCmd = command.toLowerCase();
    for (const blocked of BLOCKED_COMMANDS) {
      if (lowerCmd.includes(blocked)) {
        return `Error: Command blocked for safety reasons. The command contains a potentially destructive pattern: "${blocked}"`;
      }
    }

    try {
      const output = execSync(command, {
        cwd,
        timeout,
        encoding: 'utf-8',
        maxBuffer: 5 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const trimmed =
        output.length > MAX_OUTPUT_LENGTH
          ? output.substring(0, MAX_OUTPUT_LENGTH) + '\n... (output truncated)'
          : output;

      return trimmed || '(command completed with no output)';
    } catch (err: any) {
      if (err.killed) {
        return `Error: Command timed out after ${timeout}ms`;
      }
      const stderr = err.stderr?.toString() || '';
      const stdout = err.stdout?.toString() || '';
      return `Exit code: ${err.status}\nStdout: ${stdout}\nStderr: ${stderr}`;
    }
  }
}
