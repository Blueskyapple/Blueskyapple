import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  Conversation,
  CompletionRequest,
  CompletionResponse,
  Skill,
  ToolCall,
  ToolResult,
  ToolDefinition,
  Logger,
  AppConfig,
} from './types';
import { AIProvider } from '../providers/base';
import { MemoryManager } from '../memory/manager';

const SYSTEM_PROMPT = `You are OpenClaw, a helpful personal AI assistant. You have access to tools that let you interact with the user's system, manage files, remember information, and perform automated tasks.

Key principles:
- Be helpful, honest, and concise
- Use tools when they help accomplish the user's request
- Remember user preferences and past interactions
- Proactively suggest ways to help when appropriate
- Always respect user privacy and data security

You have persistent memory — you can store and recall information across conversations.`;

export class Agent {
  private provider: AIProvider;
  private skills: Map<string, Skill> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private memory: MemoryManager;
  private logger: Logger;
  private config: AppConfig;

  constructor(
    provider: AIProvider,
    memory: MemoryManager,
    logger: Logger,
    config: AppConfig,
  ) {
    this.provider = provider;
    this.memory = memory;
    this.logger = logger;
    this.config = config;
  }

  /** Register a skill with the agent */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.name, skill);
    this.logger.info(`Skill registered: ${skill.name} v${skill.version}`);
  }

  /** Unregister a skill */
  unregisterSkill(name: string): void {
    this.skills.delete(name);
    this.logger.info(`Skill unregistered: ${name}`);
  }

  /** Get all registered tool definitions */
  private getToolDefinitions(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const skill of this.skills.values()) {
      tools.push(...skill.tools);
    }
    return tools;
  }

  /** Find which skill owns a tool */
  private findSkillForTool(toolName: string): Skill | undefined {
    for (const skill of this.skills.values()) {
      if (skill.tools.some((t) => t.name === toolName)) {
        return skill;
      }
    }
    return undefined;
  }

  /** Execute tool calls from the AI model */
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      const skill = this.findSkillForTool(call.name);
      if (!skill) {
        results.push({
          toolCallId: call.id,
          output: '',
          error: `Unknown tool: ${call.name}`,
        });
        continue;
      }

      try {
        this.logger.debug(`Executing tool: ${call.name}`, call.arguments);
        const output = await skill.execute(call.name, call.arguments);
        results.push({ toolCallId: call.id, output });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Tool execution failed: ${call.name}`, errorMsg);
        results.push({ toolCallId: call.id, output: '', error: errorMsg });
      }
    }

    return results;
  }

  /** Get or create a conversation */
  private getConversation(userId: string, channel: string): Conversation {
    const key = `${channel}:${userId}`;
    let conv = this.conversations.get(key);
    if (!conv) {
      conv = {
        id: uuidv4(),
        userId,
        channel,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.conversations.set(key, conv);
    }
    return conv;
  }

  /** Build the message history for the AI, including memory context */
  private async buildMessages(
    conversation: Conversation,
  ): Promise<Array<{ role: string; content: string }>> {
    // Fetch relevant memories for context
    const recentMemories = await this.memory.getRecentMemories(10);
    let memoryContext = '';
    if (recentMemories.length > 0) {
      memoryContext =
        '\n\nHere are some things you remember about this user:\n' +
        recentMemories
          .map((m) => `- [${m.category}] ${m.title}: ${m.content}`)
          .join('\n');
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT + memoryContext },
    ];

    // Add conversation history (last 50 messages max)
    const recentMessages = conversation.messages.slice(-50);
    for (const msg of recentMessages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    return messages;
  }

  /** Process an incoming message and produce a response */
  async processMessage(
    content: string,
    userId: string,
    channel: string,
  ): Promise<string> {
    const conversation = this.getConversation(userId, channel);

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      channel,
      userId,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);
    conversation.updatedAt = new Date();

    this.logger.debug(`Processing message from ${userId} on ${channel}`);

    // Build request
    const messages = await this.buildMessages(conversation);
    const tools = this.getToolDefinitions();

    let request: CompletionRequest = {
      messages,
      model: this.config.aiModel,
      tools: tools.length > 0 ? tools : undefined,
    };

    // Agentic loop: keep going if the model returns tool calls
    const MAX_ITERATIONS = 10;
    let response: CompletionResponse | undefined;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      response = await this.provider.complete(request);

      if (!response.toolCalls || response.toolCalls.length === 0) {
        break;
      }

      // Execute tool calls
      const results = await this.executeToolCalls(response.toolCalls);

      // Add assistant message with tool calls to context
      messages.push({ role: 'assistant', content: response.content || '' });

      // Add tool results as user messages
      for (const result of results) {
        const toolOutput = result.error
          ? `Error: ${result.error}`
          : result.output;
        messages.push({
          role: 'user',
          content: `[Tool Result for ${result.toolCallId}]: ${toolOutput}`,
        });
      }

      // Update request for next iteration
      request = { ...request, messages };
    }

    const assistantContent = response?.content || 'I apologize, but I was unable to generate a response.';

    // Add assistant message to conversation
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: assistantContent,
      channel,
      userId,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);

    this.logger.debug(`Response generated for ${userId}`);
    return assistantContent;
  }

  /** Process a heartbeat prompt (proactive task) */
  async processHeartbeat(
    prompt: string,
    userId: string,
    channel: string,
  ): Promise<string> {
    this.logger.info(`Processing heartbeat for ${userId}: ${prompt}`);
    return this.processMessage(prompt, userId, channel);
  }

  /** Clear conversation history for a user */
  clearConversation(userId: string, channel: string): void {
    const key = `${channel}:${userId}`;
    this.conversations.delete(key);
    this.logger.info(`Conversation cleared for ${key}`);
  }

  /** Get all registered skills */
  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }
}
