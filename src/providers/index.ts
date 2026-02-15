import { AIProvider } from './base';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { OllamaProvider } from './ollama';
import { ProviderConfig } from '../core/types';

export { AIProvider } from './base';
export { AnthropicProvider } from './anthropic';
export { OpenAIProvider } from './openai';
export { OllamaProvider } from './ollama';

/** Factory to create the appropriate AI provider */
export function createProvider(
  name: string,
  config: ProviderConfig,
): AIProvider {
  switch (name) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${name}. Supported: anthropic, openai, ollama`);
  }
}
