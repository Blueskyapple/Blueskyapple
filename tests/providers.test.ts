import { createProvider } from '../src/providers';

describe('Provider Factory', () => {
  it('should create an Anthropic provider', () => {
    const provider = createProvider('anthropic', {
      apiKey: 'test-key',
      model: 'claude-sonnet-4-20250514',
    });
    expect(provider.name).toBe('anthropic');
  });

  it('should create an OpenAI provider', () => {
    const provider = createProvider('openai', {
      apiKey: 'test-key',
      model: 'gpt-4o',
    });
    expect(provider.name).toBe('openai');
  });

  it('should create an Ollama provider', () => {
    const provider = createProvider('ollama', {
      baseUrl: 'http://localhost:11434',
      model: 'llama3',
    });
    expect(provider.name).toBe('ollama');
  });

  it('should throw for unknown provider', () => {
    expect(() =>
      createProvider('unknown', { model: 'test' }),
    ).toThrow('Unknown AI provider');
  });

  it('should check Anthropic availability based on API key', async () => {
    const withKey = createProvider('anthropic', {
      apiKey: 'test-key',
      model: 'claude-sonnet-4-20250514',
    });
    expect(await withKey.isAvailable()).toBe(true);

    const withoutKey = createProvider('anthropic', {
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
    });
    expect(await withoutKey.isAvailable()).toBe(false);
  });
});
