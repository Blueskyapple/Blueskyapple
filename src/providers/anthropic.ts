import * as https from 'https';
import { AIProvider } from './base';
import {
  CompletionRequest,
  CompletionResponse,
  ProviderConfig,
  ToolCall,
} from '../core/types';

export class AnthropicProvider extends AIProvider {
  get name(): string {
    return 'anthropic';
  }

  constructor(config: ProviderConfig) {
    super(config);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Separate system message from the rest
    const systemPrompt =
      request.systemPrompt ||
      request.messages.find((m) => m.role === 'system')?.content ||
      '';
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    const body: Record<string, unknown> = {
      model: request.model || this.config.model,
      max_tokens: request.maxTokens || 4096,
      system: systemPrompt,
      messages,
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const data = JSON.stringify(body);

    const response = await this.httpPost(
      'api.anthropic.com',
      '/v1/messages',
      data,
      {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    );

    const parsed = JSON.parse(response);

    if (parsed.error) {
      throw new Error(`Anthropic API error: ${parsed.error.message}`);
    }

    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of parsed.content || []) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input,
        });
      }
    }

    return {
      content,
      model: parsed.model,
      usage: {
        inputTokens: parsed.usage?.input_tokens || 0,
        outputTokens: parsed.usage?.output_tokens || 0,
      },
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: parsed.stop_reason,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  private httpPost(
    host: string,
    path: string,
    data: string,
    headers: Record<string, string>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: host,
          port: 443,
          path,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(data),
          },
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
