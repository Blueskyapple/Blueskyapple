import { CompletionRequest, CompletionResponse, ProviderConfig } from '../core/types';

/**
 * Abstract base class for AI providers.
 * Each provider (Anthropic, OpenAI, Ollama) implements this interface.
 */
export abstract class AIProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract get name(): string;

  /** Send a completion request and get a response */
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;

  /** Check if the provider is available and configured */
  abstract isAvailable(): Promise<boolean>;
}
