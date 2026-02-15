import { Skill, ToolDefinition, MemoryEntry } from '../../core/types';
import { MemoryManager } from '../../memory/manager';

/**
 * MemorySkill provides tools for the AI to store and retrieve memories.
 */
export class MemorySkill implements Skill {
  name = 'memory';
  description = 'Store and retrieve persistent memories';
  version = '1.0.0';

  private manager: MemoryManager;

  tools: ToolDefinition[] = [
    {
      name: 'memory_store',
      description: 'Store a new memory. Use this to remember important information about the user, their preferences, projects, or anything worth recalling later.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Category for the memory (e.g., "preferences", "projects", "contacts", "notes")',
          },
          title: {
            type: 'string',
            description: 'Short title for the memory',
          },
          content: {
            type: 'string',
            description: 'The content to remember',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional tags for easier searching',
          },
        },
        required: ['category', 'title', 'content'],
      },
    },
    {
      name: 'memory_search',
      description: 'Search through stored memories by keyword',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'memory_list',
      description: 'List memories, optionally filtered by category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional category filter',
          },
        },
      },
    },
    {
      name: 'memory_delete',
      description: 'Delete a memory by ID',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Memory ID to delete',
          },
        },
        required: ['id'],
      },
    },
  ];

  constructor(manager: MemoryManager) {
    this.manager = manager;
  }

  /** Set the memory manager (used when initialized later) */
  setManager(manager: MemoryManager): void {
    this.manager = manager;
  }

  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    switch (toolName) {
      case 'memory_store': {
        const entry = await this.manager.store(
          args.category as string,
          args.title as string,
          args.content as string,
          (args.tags as string[]) || [],
        );
        return `Memory stored successfully with ID: ${entry.id}`;
      }

      case 'memory_search': {
        const results = await this.manager.search(args.query as string);
        if (results.length === 0) {
          return 'No memories found matching the query.';
        }
        return this.formatMemories(results);
      }

      case 'memory_list': {
        let entries: MemoryEntry[];
        if (args.category) {
          entries = await this.manager.getByCategory(args.category as string);
        } else {
          entries = await this.manager.getAll();
        }
        if (entries.length === 0) {
          return 'No memories found.';
        }
        return this.formatMemories(entries);
      }

      case 'memory_delete': {
        const deleted = await this.manager.delete(args.id as string);
        return deleted
          ? 'Memory deleted successfully.'
          : 'Memory not found with that ID.';
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private formatMemories(entries: MemoryEntry[]): string {
    return entries
      .map(
        (e) =>
          `[${e.id}] (${e.category}) ${e.title}\n  ${e.content}\n  Tags: ${e.tags.join(', ') || 'none'}\n  Updated: ${e.updatedAt.toISOString()}`,
      )
      .join('\n\n');
  }
}
