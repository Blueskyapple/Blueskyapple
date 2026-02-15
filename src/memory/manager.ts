import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MemoryEntry, Logger } from '../core/types';

/**
 * MemoryManager stores and retrieves memories as local Markdown files.
 * Each memory is a .md file in the memory directory, organized by category.
 */
export class MemoryManager {
  private memoryPath: string;
  private logger: Logger;
  private cache: Map<string, MemoryEntry> = new Map();

  constructor(memoryPath: string, logger: Logger) {
    this.memoryPath = path.resolve(memoryPath);
    this.logger = logger;
    this.ensureDirectory();
    this.loadAll();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  /** Load all memories from disk into cache */
  private loadAll(): void {
    this.cache.clear();
    try {
      const files = this.getAllMarkdownFiles(this.memoryPath);
      for (const file of files) {
        try {
          const entry = this.parseMemoryFile(file);
          if (entry) {
            this.cache.set(entry.id, entry);
          }
        } catch (err) {
          this.logger.warn(`Failed to parse memory file: ${file}`);
        }
      }
      this.logger.info(`Loaded ${this.cache.size} memories from disk`);
    } catch {
      this.logger.info('No existing memories found');
    }
  }

  private getAllMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.getAllMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  /** Parse a Markdown memory file into a MemoryEntry */
  private parseMemoryFile(filePath: string): MemoryEntry | null {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Parse front matter
    if (lines[0] !== '---') return null;
    const endIdx = lines.indexOf('---', 1);
    if (endIdx === -1) return null;

    const frontMatter: Record<string, string> = {};
    for (let i = 1; i < endIdx; i++) {
      const colonIdx = lines[i].indexOf(':');
      if (colonIdx !== -1) {
        const key = lines[i].substring(0, colonIdx).trim();
        const value = lines[i].substring(colonIdx + 1).trim();
        frontMatter[key] = value;
      }
    }

    const body = lines.slice(endIdx + 1).join('\n').trim();

    return {
      id: frontMatter.id || path.basename(filePath, '.md'),
      category: frontMatter.category || 'general',
      title: frontMatter.title || '',
      content: body,
      tags: frontMatter.tags ? frontMatter.tags.split(',').map((t) => t.trim()) : [],
      createdAt: frontMatter.created ? new Date(frontMatter.created) : new Date(),
      updatedAt: frontMatter.updated ? new Date(frontMatter.updated) : new Date(),
    };
  }

  /** Serialize a MemoryEntry to Markdown */
  private serializeEntry(entry: MemoryEntry): string {
    return [
      '---',
      `id: ${entry.id}`,
      `category: ${entry.category}`,
      `title: ${entry.title}`,
      `tags: ${entry.tags.join(', ')}`,
      `created: ${entry.createdAt.toISOString()}`,
      `updated: ${entry.updatedAt.toISOString()}`,
      '---',
      '',
      entry.content,
    ].join('\n');
  }

  /** Get the file path for a memory entry */
  private getFilePath(entry: MemoryEntry): string {
    const categoryDir = path.join(this.memoryPath, entry.category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    return path.join(categoryDir, `${entry.id}.md`);
  }

  /** Store a new memory */
  async store(
    category: string,
    title: string,
    content: string,
    tags: string[] = [],
  ): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: uuidv4(),
      category,
      title,
      content,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const filePath = this.getFilePath(entry);
    fs.writeFileSync(filePath, this.serializeEntry(entry), 'utf-8');
    this.cache.set(entry.id, entry);

    this.logger.debug(`Memory stored: [${category}] ${title}`);
    return entry;
  }

  /** Update an existing memory */
  async update(
    id: string,
    updates: Partial<Pick<MemoryEntry, 'title' | 'content' | 'tags' | 'category'>>,
  ): Promise<MemoryEntry | null> {
    const existing = this.cache.get(id);
    if (!existing) return null;

    // If category changes, remove old file
    if (updates.category && updates.category !== existing.category) {
      const oldPath = this.getFilePath(existing);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updated: MemoryEntry = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    const filePath = this.getFilePath(updated);
    fs.writeFileSync(filePath, this.serializeEntry(updated), 'utf-8');
    this.cache.set(id, updated);

    return updated;
  }

  /** Delete a memory */
  async delete(id: string): Promise<boolean> {
    const entry = this.cache.get(id);
    if (!entry) return false;

    const filePath = this.getFilePath(entry);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    this.cache.delete(id);
    return true;
  }

  /** Search memories by keyword */
  async search(query: string): Promise<MemoryEntry[]> {
    const lowerQuery = query.toLowerCase();
    const results: MemoryEntry[] = [];

    for (const entry of this.cache.values()) {
      if (
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.content.toLowerCase().includes(lowerQuery) ||
        entry.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
        entry.category.toLowerCase().includes(lowerQuery)
      ) {
        results.push(entry);
      }
    }

    return results.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  /** Get memories by category */
  async getByCategory(category: string): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    for (const entry of this.cache.values()) {
      if (entry.category === category) {
        results.push(entry);
      }
    }
    return results.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  /** Get the most recent memories */
  async getRecentMemories(limit: number = 10): Promise<MemoryEntry[]> {
    const entries = Array.from(this.cache.values());
    return entries
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  /** Get a specific memory by ID */
  async get(id: string): Promise<MemoryEntry | null> {
    return this.cache.get(id) || null;
  }

  /** Get all memories */
  async getAll(): Promise<MemoryEntry[]> {
    return Array.from(this.cache.values());
  }
}
