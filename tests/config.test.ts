import { loadConfig } from '../src/core/config';

describe('Config', () => {
  it('should load default configuration', () => {
    const config = loadConfig('/nonexistent/config.json');

    expect(config.aiProvider).toBeDefined();
    expect(config.webPort).toBeGreaterThan(0);
    expect(config.memoryPath).toBeDefined();
    expect(config.logLevel).toBeDefined();
    expect(config.sandboxMode).toBeDefined();
  });

  it('should use environment variables', () => {
    const originalPort = process.env.WEB_PORT;
    process.env.WEB_PORT = '8080';

    const config = loadConfig('/nonexistent/config.json');
    expect(config.webPort).toBe(8080);

    if (originalPort) {
      process.env.WEB_PORT = originalPort;
    } else {
      delete process.env.WEB_PORT;
    }
  });

  it('should have provider configs', () => {
    const config = loadConfig();
    expect(config.providers).toBeDefined();
    expect(config.providers.anthropic).toBeDefined();
    expect(config.providers.openai).toBeDefined();
    expect(config.providers.ollama).toBeDefined();
  });
});
