import * as fs from 'fs';
import * as path from 'path';
import { FileSystemSkill } from '../src/skills/builtin/filesystem';
import { ShellSkill } from '../src/skills/builtin/shell';
import { MemorySkill } from '../src/skills/builtin/memory';
import { MemoryManager } from '../src/memory/manager';

const TEST_DIR = path.join(__dirname, '.test-skills');

function createTestLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

describe('FileSystemSkill', () => {
  const skill = new FileSystemSkill();
  const testFile = path.join(TEST_DIR, 'test.txt');

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(cleanup);

  it('should write and read a file', async () => {
    await skill.execute('fs_write', { path: testFile, content: 'Hello World' });
    expect(fs.existsSync(testFile)).toBe(true);

    const content = await skill.execute('fs_read', { path: testFile });
    expect(content).toBe('Hello World');
  });

  it('should list directory contents', async () => {
    fs.writeFileSync(path.join(TEST_DIR, 'a.txt'), 'a');
    fs.writeFileSync(path.join(TEST_DIR, 'b.txt'), 'b');
    fs.mkdirSync(path.join(TEST_DIR, 'subdir'));

    const result = await skill.execute('fs_list', { path: TEST_DIR });
    expect(result).toContain('a.txt');
    expect(result).toContain('b.txt');
    expect(result).toContain('subdir');
    expect(result).toContain('[DIR]');
    expect(result).toContain('[FILE]');
  });

  it('should create directories', async () => {
    const dir = path.join(TEST_DIR, 'deep', 'nested', 'dir');
    await skill.execute('fs_mkdir', { path: dir });
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('should check file existence', async () => {
    const result1 = await skill.execute('fs_exists', { path: testFile });
    expect(result1).toBe('false');

    fs.writeFileSync(testFile, 'exists');
    const result2 = await skill.execute('fs_exists', { path: testFile });
    expect(result2).toBe('true');
  });

  it('should delete files', async () => {
    fs.writeFileSync(testFile, 'to delete');
    await skill.execute('fs_delete', { path: testFile });
    expect(fs.existsSync(testFile)).toBe(false);
  });

  it('should return error for non-existent file', async () => {
    const result = await skill.execute('fs_read', { path: '/nonexistent/file.txt' });
    expect(result).toContain('Error');
  });
});

describe('ShellSkill', () => {
  const skill = new ShellSkill();

  it('should execute a simple command', async () => {
    const result = await skill.execute('shell_exec', { command: 'echo "hello"' });
    expect(result.trim()).toBe('hello');
  });

  it('should return error for failed commands', async () => {
    const result = await skill.execute('shell_exec', {
      command: 'nonexistent_command_xyz',
    });
    expect(result).toContain('Exit code');
  });

  it('should block dangerous commands', async () => {
    const result = await skill.execute('shell_exec', { command: 'rm -rf /' });
    expect(result).toContain('blocked');
  });
});

describe('MemorySkill', () => {
  const memPath = path.join(TEST_DIR, 'memory');
  let manager: MemoryManager;
  let skill: MemorySkill;

  beforeEach(() => {
    cleanup();
    const logger = createTestLogger();
    manager = new MemoryManager(memPath, logger);
    skill = new MemorySkill(manager);
  });

  afterEach(cleanup);

  it('should store a memory via tool', async () => {
    const result = await skill.execute('memory_store', {
      category: 'test',
      title: 'Test Memory',
      content: 'This is a test memory.',
      tags: ['test'],
    });
    expect(result).toContain('stored successfully');
  });

  it('should search memories via tool', async () => {
    await manager.store('test', 'Favorite Language', 'TypeScript', ['dev']);

    const result = await skill.execute('memory_search', { query: 'TypeScript' });
    expect(result).toContain('Favorite Language');
    expect(result).toContain('TypeScript');
  });

  it('should list memories via tool', async () => {
    await manager.store('prefs', 'Color', 'Blue', []);
    await manager.store('prefs', 'Food', 'Pizza', []);

    const result = await skill.execute('memory_list', { category: 'prefs' });
    expect(result).toContain('Color');
    expect(result).toContain('Food');
  });
});
