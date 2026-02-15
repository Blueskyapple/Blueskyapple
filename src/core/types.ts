/**
 * Core type definitions for the OpenClaw AI assistant.
 */

/** A message in a conversation */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  channel: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/** A conversation thread */
export interface Conversation {
  id: string;
  userId: string;
  channel: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/** AI provider completion request */
export interface CompletionRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: ToolDefinition[];
}

/** AI provider completion response */
export interface CompletionResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  toolCalls?: ToolCall[];
  finishReason?: string;
}

/** Tool/function definition for the AI model */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** A tool call returned by the AI model */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** Result of executing a tool */
export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
}

/** Configuration for an AI provider */
export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/** A channel adapter connects to a messaging platform */
export interface ChannelAdapter {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  sendMessage(userId: string, content: string): Promise<void>;
  onMessage(handler: (message: Message) => Promise<void>): void;
}

/** A skill adds capabilities to the agent */
export interface Skill {
  name: string;
  description: string;
  version: string;
  tools: ToolDefinition[];
  execute(toolName: string, args: Record<string, unknown>): Promise<string>;
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
}

/** Heartbeat task configuration */
export interface HeartbeatTask {
  id: string;
  name: string;
  schedule: string; // cron expression
  prompt: string;
  enabled: boolean;
  lastRun?: Date;
  userId: string;
  channel: string;
}

/** Memory entry stored as markdown */
export interface MemoryEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Application configuration */
export interface AppConfig {
  aiProvider: string;
  aiModel: string;
  providers: Record<string, ProviderConfig>;
  webPort: number;
  webHost: string;
  heartbeatInterval: number;
  memoryPath: string;
  skillsPath: string;
  sandboxMode: 'none' | 'docker' | 'restricted';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  channels: Record<string, Record<string, string>>;
}

/** Logger interface */
export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}
