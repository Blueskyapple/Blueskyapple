import { Agent } from '../src/core/agent';
import { AIProvider } from '../src/providers/base';
import { MemoryManager } from '../src/memory/manager';
import {
  CompletionRequest,
  CompletionResponse,
  Skill,
  ToolDefinition,
  AppConfig,
} from '../src/core/types';
import * as path from 'path';
import * as fs from 'fs';

const TEST_MEMORY_PATH = path.join(__dirname, '.test-agent-memory');

class MockProvider extends AIProvider {
  get name() {
    return 'mock';
  }

  private responseContent: string;
  public lastRequest?: CompletionRequest;

  constructor(responseContent: string = 'Hello! I am OpenClaw.') {
    super({ model: 'mock-model' });
    this.responseContent = responseContent;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.lastRequest = request;
    return {
      content: this.responseContent,
      model: 'mock-model',
      usage: { inputTokens: 10, outputTokens: 5 },
      finishReason: 'stop',
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

class MockSkill implements Skill {
  name = 'test-skill';
  description = 'A test skill';
  version = '1.0.0';
  tools: ToolDefinition[] = [
    {
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' },
        },
        required: ['input'],
      },
    },
  ];

  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    return `Executed ${toolName} with input: ${args.input}`;
  }
}

function createTestLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

const testConfig: AppConfig = {
  aiProvider: 'mock',
  aiModel: 'mock-model',
  providers: {},
  webPort: 3000,
  webHost: '0.0.0.0',
  heartbeatInterval: 15,
  memoryPath: TEST_MEMORY_PATH,
  skillsPath: './data/skills',
  sandboxMode: 'restricted',
  logLevel: 'error',
  channels: {},
};

function cleanup() {
  if (fs.existsSync(TEST_MEMORY_PATH)) {
    fs.rmSync(TEST_MEMORY_PATH, { recursive: true, force: true });
  }
}

describe('Agent', () => {
  let agent: Agent;
  let provider: MockProvider;
  let memory: MemoryManager;
  let logger: ReturnType<typeof createTestLogger>;

  beforeEach(() => {
    cleanup();
    provider = new MockProvider();
    logger = createTestLogger();
    memory = new MemoryManager(TEST_MEMORY_PATH, logger);
    agent = new Agent(provider, memory, logger, testConfig);
  });

  afterEach(() => {
    cleanup();
  });

  it('should process a message and return a response', async () => {
    const response = await agent.processMessage('Hello', 'user1', 'test');
    expect(response).toBe('Hello! I am OpenClaw.');
  });

  it('should maintain conversation context', async () => {
    await agent.processMessage('My name is Alice', 'user1', 'test');
    await agent.processMessage('What is my name?', 'user1', 'test');

    // The provider should receive both messages in context
    expect(provider.lastRequest).toBeDefined();
    const messages = provider.lastRequest!.messages;
    expect(messages.some((m) => m.content.includes('My name is Alice'))).toBe(true);
    expect(messages.some((m) => m.content.includes('What is my name?'))).toBe(true);
  });

  it('should register and list skills', () => {
    const skill = new MockSkill();
    agent.registerSkill(skill);

    const skills = agent.getSkills();
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('test-skill');
  });

  it('should unregister skills', () => {
    const skill = new MockSkill();
    agent.registerSkill(skill);
    expect(agent.getSkills().length).toBe(1);

    agent.unregisterSkill('test-skill');
    expect(agent.getSkills().length).toBe(0);
  });

  it('should clear conversation history', async () => {
    await agent.processMessage('First message', 'user1', 'test');
    agent.clearConversation('user1', 'test');
    await agent.processMessage('After clear', 'user1', 'test');

    const messages = provider.lastRequest!.messages;
    const userMessages = messages.filter((m) => m.role === 'user' && m.content !== '');
    // Should only have the "After clear" message, not "First message"
    expect(userMessages.some((m) => m.content === 'First message')).toBe(false);
    expect(userMessages.some((m) => m.content === 'After clear')).toBe(true);
  });

  it('should include tool definitions when skills are registered', async () => {
    const skill = new MockSkill();
    agent.registerSkill(skill);

    await agent.processMessage('Use the test tool', 'user1', 'test');

    expect(provider.lastRequest!.tools).toBeDefined();
    expect(provider.lastRequest!.tools!.length).toBe(1);
    expect(provider.lastRequest!.tools![0].name).toBe('test_tool');
  });

  it('should isolate conversations between users', async () => {
    await agent.processMessage('Message from user1', 'user1', 'test');
    await agent.processMessage('Message from user2', 'user2', 'test');

    // After user2's message, context should only have user2's message
    const messages = provider.lastRequest!.messages;
    const userMessages = messages.filter((m) => m.role === 'user');
    expect(userMessages.some((m) => m.content === 'Message from user1')).toBe(false);
    expect(userMessages.some((m) => m.content === 'Message from user2')).toBe(true);
  });
});
