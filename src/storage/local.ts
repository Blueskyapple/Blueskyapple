/**
 * Local file-based storage for BlueBot
 * Stores data as Markdown files (similar to Obsidian)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { StorageInterface, Message, StorageConfig } from '../core/types.js';

export class LocalStorage implements StorageInterface {
  private basePath: string;
  private memoryDir: string;
  private dataDir: string;

  constructor(config: StorageConfig) {
    this.basePath = config.path || path.join(process.cwd(), '.bluebot');
    this.memoryDir = path.join(this.basePath, 'memory');
    this.dataDir = path.join(this.basePath, 'data');
  }

  /**
   * Initialize storage directories
   */
  async init(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.mkdir(this.memoryDir, { recursive: true });
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  /**
   * Get a value from storage
   */
  async get(key: string): Promise<unknown> {
    const filePath = this.getDataPath(key);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Set a value in storage
   */
  async set(key: string, value: unknown): Promise<void> {
    const filePath = this.getDataPath(key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  /**
   * Delete a value from storage
   */
  async delete(key: string): Promise<void> {
    const filePath = this.getDataPath(key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List all keys with optional prefix
   */
  async list(prefix?: string): Promise<string[]> {
    const searchDir = prefix
      ? path.join(this.dataDir, prefix)
      : this.dataDir;

    try {
      const files = await this.walkDir(searchDir);
      return files.map((f) =>
        f.replace(this.dataDir + path.sep, '').replace('.json', '')
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get conversation memory for a session
   */
  async getMemory(sessionId: string): Promise<Message[]> {
    const filePath = this.getMemoryPath(sessionId);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseMemoryFile(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save conversation memory for a session
   */
  async saveMemory(sessionId: string, messages: Message[]): Promise<void> {
    const filePath = this.getMemoryPath(sessionId);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const markdown = this.formatMemoryAsMarkdown(sessionId, messages);
    await fs.writeFile(filePath, markdown, 'utf-8');
  }

  /**
   * Append a message to memory (efficient for large histories)
   */
  async appendToMemory(sessionId: string, message: Message): Promise<void> {
    const filePath = this.getMemoryPath(sessionId);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const entry = this.formatMessageAsMarkdown(message);

    try {
      await fs.appendFile(filePath, '\n\n' + entry, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, create with header
        const header = `# Conversation: ${sessionId}\n\nCreated: ${new Date().toISOString()}\n\n---\n\n`;
        await fs.writeFile(filePath, header + entry, 'utf-8');
      } else {
        throw error;
      }
    }
  }

  /**
   * Clear memory for a session
   */
  async clearMemory(sessionId: string): Promise<void> {
    const filePath = this.getMemoryPath(sessionId);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List all memory sessions
   */
  async listMemorySessions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.memoryDir);
      return files
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace('.md', ''));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Export all data as JSON
   */
  async exportAll(): Promise<{ data: Record<string, unknown>; memory: Record<string, Message[]> }> {
    const data: Record<string, unknown> = {};
    const memory: Record<string, Message[]> = {};

    const dataKeys = await this.list();
    for (const key of dataKeys) {
      data[key] = await this.get(key);
    }

    const sessions = await this.listMemorySessions();
    for (const sessionId of sessions) {
      memory[sessionId] = await this.getMemory(sessionId);
    }

    return { data, memory };
  }

  /**
   * Import data from JSON
   */
  async importAll(exported: { data: Record<string, unknown>; memory: Record<string, Message[]> }): Promise<void> {
    for (const [key, value] of Object.entries(exported.data)) {
      await this.set(key, value);
    }

    for (const [sessionId, messages] of Object.entries(exported.memory)) {
      await this.saveMemory(sessionId, messages);
    }
  }

  // Helper methods

  private getDataPath(key: string): string {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_/]/g, '_');
    return path.join(this.dataDir, `${sanitizedKey}.json`);
  }

  private getMemoryPath(sessionId: string): string {
    const sanitizedId = sessionId.replace(/[^a-zA-Z0-9-_:]/g, '_');
    return path.join(this.memoryDir, `${sanitizedId}.md`);
  }

  private async walkDir(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.walkDir(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private formatMemoryAsMarkdown(sessionId: string, messages: Message[]): string {
    let md = `# Conversation: ${sessionId}\n\n`;
    md += `Created: ${messages[0]?.timestamp || new Date().toISOString()}\n`;
    md += `Messages: ${messages.length}\n\n`;
    md += `---\n\n`;

    for (const msg of messages) {
      md += this.formatMessageAsMarkdown(msg) + '\n\n';
    }

    return md;
  }

  private formatMessageAsMarkdown(message: Message): string {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    const userName = message.metadata?.userName || message.role;

    let md = `## ${role}${userName !== message.role ? ` (${userName})` : ''}\n`;
    md += `*${timestamp}*\n\n`;
    md += message.content;

    return md;
  }

  private parseMemoryFile(content: string): Message[] {
    const messages: Message[] = [];
    const sections = content.split(/^## /m).slice(1); // Skip header

    for (const section of sections) {
      const lines = section.split('\n');
      const roleLine = lines[0];
      const timestampLine = lines[1];
      const contentLines = lines.slice(3).join('\n').trim();

      // Parse role
      let role: 'user' | 'assistant' | 'system' = 'user';
      if (roleLine.toLowerCase().startsWith('assistant')) {
        role = 'assistant';
      } else if (roleLine.toLowerCase().startsWith('system')) {
        role = 'system';
      }

      // Parse timestamp
      const timestampMatch = timestampLine.match(/\*(.+)\*/);
      const timestamp = timestampMatch
        ? new Date(timestampMatch[1])
        : new Date();

      if (contentLines) {
        messages.push({
          id: crypto.randomUUID(),
          sessionId: '',
          channelId: '',
          channelType: 'cli',
          content: contentLines,
          role,
          timestamp,
        });
      }
    }

    return messages;
  }

  /**
   * Get storage path
   */
  getBasePath(): string {
    return this.basePath;
  }
}

/**
 * Create local storage instance
 */
export function createLocalStorage(config: StorageConfig): LocalStorage {
  return new LocalStorage(config);
}
