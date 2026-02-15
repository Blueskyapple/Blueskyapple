import * as http from 'http';
import { AIProvider } from './base';
import {
  CompletionRequest,
  CompletionResponse,
  ProviderConfig,
} from '../core/types';

export class OllamaProvider extends AIProvider {
  get name(): string {
    return 'ollama';
  }

  constructor(config: ProviderConfig) {
    super(config);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    const url = new URL(baseUrl);

    const messages = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body = JSON.stringify({
      model: request.model || this.config.model,
      messages,
      stream: false,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens || 4096,
      },
    });

    const response = await this.httpPost(
      url.hostname,
      parseInt(url.port || '11434', 10),
      '/api/chat',
      body,
    );

    const parsed = JSON.parse(response);

    if (parsed.error) {
      throw new Error(`Ollama error: ${parsed.error}`);
    }

    return {
      content: parsed.message?.content || '',
      model: parsed.model || this.config.model,
      usage: {
        inputTokens: parsed.prompt_eval_count || 0,
        outputTokens: parsed.eval_count || 0,
      },
      finishReason: parsed.done ? 'stop' : 'length',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const baseUrl = this.config.baseUrl || 'http://localhost:11434';
      const url = new URL(baseUrl);
      return new Promise((resolve) => {
        const req = http.request(
          {
            hostname: url.hostname,
            port: parseInt(url.port || '11434', 10),
            path: '/api/tags',
            method: 'GET',
            timeout: 3000,
          },
          (res) => {
            resolve(res.statusCode === 200);
          },
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        req.end();
      });
    } catch {
      return false;
    }
  }

  private httpPost(
    host: string,
    port: number,
    path: string,
    data: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: host,
          port,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
          timeout: 120000, // Ollama can be slow with large models
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve(body));
        },
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}
