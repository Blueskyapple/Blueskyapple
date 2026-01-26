/**
 * Core types for BlueBot - Personal AI Assistant
 */

// Message types
export interface Message {
  id: string;
  sessionId: string;
  channelId: string;
  channelType: ChannelType;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  userId?: string;
  userName?: string;
  replyTo?: string;
  attachments?: Attachment[];
  [key: string]: unknown;
}

export interface Attachment {
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  name?: string;
  size?: number;
}

// Channel types
export type ChannelType =
  | 'discord'
  | 'telegram'
  | 'slack'
  | 'webchat'
  | 'cli'
  | 'custom';

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  enabled: boolean;
  config: ChannelConfig;
}

export interface ChannelConfig {
  [key: string]: unknown;
}

// Session types
export interface Session {
  id: string;
  channelId: string;
  channelType: ChannelType;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  context: SessionContext;
  status: 'active' | 'paused' | 'ended';
}

export interface SessionContext {
  messages: Message[];
  variables: Record<string, unknown>;
  activeSkills: string[];
}

// Skill types
export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  handler: SkillHandler;
  triggers?: SkillTrigger[];
  tools?: Tool[];
}

export type SkillHandler = (
  context: SkillContext,
  params: Record<string, unknown>
) => Promise<SkillResult>;

export interface SkillContext {
  session: Session;
  message: Message;
  agent: AgentInterface;
  storage: StorageInterface;
}

export interface SkillResult {
  success: boolean;
  response?: string;
  data?: unknown;
  error?: string;
}

export interface SkillTrigger {
  type: 'command' | 'keyword' | 'regex' | 'event';
  pattern: string;
}

// Tool types (for AI function calling)
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolProperty>;
  required?: string[];
}

export interface ToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolProperty;
}

// Agent interface
export interface AgentInterface {
  chat(message: string, context?: SessionContext): Promise<string>;
  streamChat(message: string, context?: SessionContext): AsyncGenerator<string>;
  callTool(name: string, params: Record<string, unknown>): Promise<unknown>;
}

// Storage interface
export interface StorageInterface {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  getMemory(sessionId: string): Promise<Message[]>;
  saveMemory(sessionId: string, messages: Message[]): Promise<void>;
}

// Gateway types
export interface GatewayConfig {
  host: string;
  port: number;
  cors: boolean;
  auth?: {
    enabled: boolean;
    token?: string;
  };
}

export interface GatewayMessage {
  type: 'message' | 'event' | 'command' | 'response' | 'error';
  payload: unknown;
  sessionId?: string;
  timestamp: Date;
}

// Config types
export interface BlueBotConfig {
  name: string;
  version: string;
  gateway: GatewayConfig;
  ai: AIConfig;
  channels: Channel[];
  skills: string[];
  storage: StorageConfig;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface StorageConfig {
  type: 'local' | 'sqlite' | 'custom';
  path: string;
  encryption?: boolean;
}

// Event types
export type EventType =
  | 'message:received'
  | 'message:sent'
  | 'session:created'
  | 'session:ended'
  | 'skill:triggered'
  | 'error'
  | 'gateway:connected'
  | 'gateway:disconnected'
  | 'channel:connected'
  | 'channel:disconnected';

export interface Event {
  type: EventType;
  data: unknown;
  timestamp: Date;
  source?: string;
}

export type EventHandler = (event: Event) => void | Promise<void>;
