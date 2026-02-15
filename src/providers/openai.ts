import * as https from 'https';
import { AIProvider } from './base';
import {
  CompletionRequest,
  CompletionResponse,
  ProviderConfig,
  ToolCall,
} from '../core/types';

export class OpenAIProvider extends AIProvider {
  get name(): string {
    return 'openai';
  }

  constructor(config: ProviderConfig) {
    super(config);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model: request.model || this.config.model,
      messages,
      max_tokens: request.maxTokens || 4096,
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const data = JSON.stringify(body);
    const url = new URL(this.config.baseUrl || 'https://api.openai.com/v1');

    const response = await this.httpPost(
      url.hostname,
      `${url.pathname}/chat/completions`,
      data,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    );

    const parsed = JSON.parse(response);

    if (parsed.error) {
      throw new Error(`OpenAI API error: ${parsed.error.message}`);
    }

    const choice = parsed.choices?.[0];
    const content = choice?.message?.content || '';
    const toolCalls: ToolCall[] = [];

    if (choice?.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
        });
      }
    }

    return {
      content,
      model: parsed.model,
      usage: {
        inputTokens: parsed.usage?.prompt_tokens || 0,
        outputTokens: parsed.usage?.completion_tokens || 0,
      },
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: choice?.finish_reason,
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
