import * as fs from 'fs';
import * as path from 'path';
import { Skill, ToolDefinition } from '../../core/types';

/**
 * FileSystemSkill provides file read/write/list operations.
 */
export class FileSystemSkill implements Skill {
  name = 'filesystem';
  description = 'Read, write, and manage files on the local filesystem';
  version = '1.0.0';

  tools: ToolDefinition[] = [
    {
      name: 'fs_read',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to read',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'fs_write',
      description: 'Write content to a file (creates or overwrites)',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to write to',
          },
          content: {
            type: 'string',
            description: 'Content to write',
          },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'fs_list',
      description: 'List files and directories at a given path',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to list',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'fs_mkdir',
      description: 'Create a directory (including parent directories)',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to create',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'fs_delete',
      description: 'Delete a file or empty directory',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to delete',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'fs_exists',
      description: 'Check if a file or directory exists',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to check',
          },
        },
        required: ['path'],
      },
    },
  ];

  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const targetPath = path.resolve(args.path as string);

    switch (toolName) {
      case 'fs_read': {
        if (!fs.existsSync(targetPath)) {
          return `Error: File not found: ${targetPath}`;
        }
        const stat = fs.statSync(targetPath);
        if (stat.size > 1024 * 1024) {
          return `Error: File too large (${stat.size} bytes). Maximum is 1MB.`;
        }
        return fs.readFileSync(targetPath, 'utf-8');
      }

      case 'fs_write': {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, args.content as string, 'utf-8');
        return `File written successfully: ${targetPath}`;
      }

      case 'fs_list': {
        if (!fs.existsSync(targetPath)) {
          return `Error: Directory not found: ${targetPath}`;
        }
        const entries = fs.readdirSync(targetPath, { withFileTypes: true });
        return entries
          .map((e) => `${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`)
          .join('\n');
      }

      case 'fs_mkdir': {
        fs.mkdirSync(targetPath, { recursive: true });
        return `Directory created: ${targetPath}`;
      }

      case 'fs_delete': {
        if (!fs.existsSync(targetPath)) {
          return `Error: Path not found: ${targetPath}`;
        }
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
          fs.rmdirSync(targetPath);
        } else {
          fs.unlinkSync(targetPath);
        }
        return `Deleted: ${targetPath}`;
      }

      case 'fs_exists': {
        return fs.existsSync(targetPath) ? 'true' : 'false';
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
