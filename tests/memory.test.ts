import * as fs from 'fs';
import * as path from 'path';
import { MemoryManager } from '../src/memory/manager';

const TEST_MEMORY_PATH = path.join(__dirname, '.test-memory');

function createTestLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function cleanup() {
  if (fs.existsSync(TEST_MEMORY_PATH)) {
    fs.rmSync(TEST_MEMORY_PATH, { recursive: true, force: true });
  }
}

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let logger: ReturnType<typeof createTestLogger>;

  beforeEach(() => {
    cleanup();
    logger = createTestLogger();
    manager = new MemoryManager(TEST_MEMORY_PATH, logger);
  });

  afterEach(() => {
    cleanup();
  });

  it('should create memory directory on initialization', () => {
    expect(fs.existsSync(TEST_MEMORY_PATH)).toBe(true);
  });

  it('should store and retrieve a memory', async () => {
    const entry = await manager.store(
      'preferences',
      'Favorite Color',
      'The user prefers blue.',
      ['color', 'preference'],
    );

    expect(entry.id).toBeDefined();
    expect(entry.category).toBe('preferences');
    expect(entry.title).toBe('Favorite Color');
    expect(entry.content).toBe('The user prefers blue.');

    const retrieved = await manager.get(entry.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.title).toBe('Favorite Color');
  });

  it('should search memories by keyword', async () => {
    await manager.store('preferences', 'Favorite Color', 'Blue is the best', ['color']);
    await manager.store('projects', 'Website Redesign', 'Working on a React project', ['web']);
    await manager.store('preferences', 'Editor', 'Uses VS Code', ['tools']);

    const results = await manager.search('color');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Favorite Color');

    const reactResults = await manager.search('react');
    expect(reactResults.length).toBe(1);
    expect(reactResults[0].title).toBe('Website Redesign');
  });

  it('should list memories by category', async () => {
    await manager.store('preferences', 'Color', 'Blue', []);
    await manager.store('preferences', 'Editor', 'VS Code', []);
    await manager.store('projects', 'Website', 'React app', []);

    const prefs = await manager.getByCategory('preferences');
    expect(prefs.length).toBe(2);

    const projects = await manager.getByCategory('projects');
    expect(projects.length).toBe(1);
  });

  it('should delete a memory', async () => {
    const entry = await manager.store('test', 'Test Entry', 'Content', []);
    expect(await manager.get(entry.id)).not.toBeNull();

    const deleted = await manager.delete(entry.id);
    expect(deleted).toBe(true);
    expect(await manager.get(entry.id)).toBeNull();
  });

  it('should update a memory', async () => {
    const entry = await manager.store('test', 'Original', 'Original content', []);

    const updated = await manager.update(entry.id, {
      title: 'Updated',
      content: 'Updated content',
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.content).toBe('Updated content');
  });

  it('should get recent memories', async () => {
    for (let i = 0; i < 15; i++) {
      await manager.store('test', `Memory ${i}`, `Content ${i}`, []);
    }

    const recent = await manager.getRecentMemories(5);
    expect(recent.length).toBe(5);
  });

  it('should persist memories to disk as markdown', async () => {
    const entry = await manager.store(
      'notes',
      'Test Note',
      'This is persisted to disk.',
      ['test'],
    );

    const filePath = path.join(TEST_MEMORY_PATH, 'notes', `${entry.id}.md`);
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('title: Test Note');
    expect(content).toContain('category: notes');
    expect(content).toContain('This is persisted to disk.');
  });
});
