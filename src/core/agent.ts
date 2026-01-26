/**
 * AI Agent runtime for BlueBot
 */

import OpenAI from 'openai';
import {
  AgentInterface,
  AIConfig,
  SessionContext,
  Tool,
  Message,
} from './types.js';
import { eventBus } from './events.js';

export class Agent implements AgentInterface {
  private client: OpenAI;
  private config: AIConfig;
  private tools: Map<string, Tool> = new Map();
  private systemPrompt: string;

  constructor(config: AIConfig) {
    this.config = config;
    this.systemPrompt = config.systemPrompt || this.getDefaultSystemPrompt();

    // Initialize OpenAI client (works with OpenAI, Anthropic via proxy, Ollama, etc.)
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'not-needed',
      baseURL: config.baseUrl || this.getDefaultBaseUrl(config.provider),
    });
  }

  private getDefaultBaseUrl(provider: string): string | undefined {
    switch (provider) {
      case 'ollama':
        return 'http://localhost:11434/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      default:
        return undefined;
    }
  }

  private getDefaultSystemPrompt(): string {
    return `You are BlueBot, a helpful personal AI assistant. You are:
- Friendly and conversational
- Helpful and informative
- Concise but thorough
- Honest about limitations

You can help with a wide range of tasks including answering questions,
having conversations, helping with writing, coding, analysis, and more.

Always be respectful and maintain user privacy.`;
  }

  /**
   * Register a tool for function calling
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Convert tools to OpenAI format
   */
  private getOpenAITools(): OpenAI.ChatCompletionTool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as unknown as Record<string, unknown>,
      },
    }));
  }

  /**
   * Build messages array from context
   */
  private buildMessages(
    message: string,
    context?: SessionContext
  ): OpenAI.ChatCompletionMessageParam[] {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.systemPrompt },
    ];

    // Add conversation history
    if (context?.messages) {
      for (const msg of context.messages.slice(-20)) {
        // Keep last 20 messages
        messages.push({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    return messages;
  }

  /**
   * Chat with the AI (non-streaming)
   */
  async chat(message: string, context?: SessionContext): Promise<string> {
    try {
      const messages = this.buildMessages(message, context);
      const tools = this.getOpenAITools();

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2048,
      });

      const choice = response.choices[0];

      // Handle tool calls
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolResults = await this.executeToolCalls(choice.message.tool_calls);

        // Add tool results to messages and get final response
        messages.push(choice.message);
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            tool_call_id: result.id,
            content: JSON.stringify(result.result),
          });
        }

        const finalResponse = await this.client.chat.completions.create({
          model: this.config.model,
          messages,
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 2048,
        });

        return finalResponse.choices[0].message.content || '';
      }

      return choice.message.content || '';
    } catch (error) {
      await eventBus.emit('error', { type: 'agent_chat_error', error });
      throw error;
    }
  }

  /**
   * Stream chat response
   */
  async *streamChat(
    message: string,
    context?: SessionContext
  ): AsyncGenerator<string> {
    try {
      const messages = this.buildMessages(message, context);
      const tools = this.getOpenAITools();

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      await eventBus.emit('error', { type: 'agent_stream_error', error });
      throw error;
    }
  }

  /**
   * Execute tool calls
   */
  private async executeToolCalls(
    toolCalls: OpenAI.ChatCompletionMessageToolCall[]
  ): Promise<Array<{ id: string; result: unknown }>> {
    const results: Array<{ id: string; result: unknown }> = [];

    for (const toolCall of toolCalls) {
      const tool = this.tools.get(toolCall.function.name);
      if (tool) {
        try {
          const params = JSON.parse(toolCall.function.arguments);
          const result = await tool.handler(params);
          results.push({ id: toolCall.id, result });

          await eventBus.emit('skill:triggered', {
            tool: toolCall.function.name,
            params,
            result,
          });
        } catch (error) {
          results.push({
            id: toolCall.id,
            result: { error: String(error) },
          });
        }
      } else {
        results.push({
          id: toolCall.id,
          result: { error: `Unknown tool: ${toolCall.function.name}` },
        });
      }
    }

    return results;
  }

  /**
   * Call a specific tool directly
   */
  async callTool(
    name: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.handler(params);
  }

  /**
   * Update system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * Get current config
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }
}

/**
 * Create an agent from config
 */
export function createAgent(config: AIConfig): Agent {
  return new Agent(config);
}
