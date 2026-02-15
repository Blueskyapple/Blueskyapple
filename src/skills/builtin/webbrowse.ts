import * as https from 'https';
import * as http from 'http';
import { Skill, ToolDefinition } from '../../core/types';

const MAX_RESPONSE_SIZE = 100000;

/**
 * WebBrowseSkill provides basic web fetching capabilities.
 * Fetches URLs and returns text content.
 */
export class WebBrowseSkill implements Skill {
  name = 'webbrowse';
  description = 'Fetch web pages and extract text content';
  version = '1.0.0';

  tools: ToolDefinition[] = [
    {
      name: 'web_fetch',
      description:
        'Fetch a URL and return its text content. Useful for reading web pages, APIs, documentation, etc.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch',
          },
          headers: {
            type: 'object',
            description: 'Optional HTTP headers',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'web_search_summary',
      description:
        'Provide a summary prompt for web content. Returns the raw content for the AI to summarize.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch and summarize',
          },
          question: {
            type: 'string',
            description: 'What to look for in the content',
          },
        },
        required: ['url'],
      },
    },
  ];

  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const url = args.url as string;

    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return 'Error: Invalid URL. Must start with http:// or https://';
    }

    try {
      const content = await this.fetchUrl(url, args.headers as Record<string, string>);

      if (toolName === 'web_search_summary') {
        const question = (args.question as string) || 'Summarize this content';
        return `Content from ${url}:\n\n${content}\n\n---\nQuestion: ${question}`;
      }

      return content;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return `Error fetching URL: ${errorMsg}`;
    }
  }

  private fetchUrl(
    url: string,
    headers?: Record<string, string>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;

      const req = client.get(
        url,
        {
          headers: {
            'User-Agent': 'OpenClaw/1.0',
            ...headers,
          },
          timeout: 15000,
        },
        (res) => {
          // Handle redirects
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            this.fetchUrl(res.headers.location, headers)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }

          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
            if (body.length > MAX_RESPONSE_SIZE) {
              res.destroy();
              body = body.substring(0, MAX_RESPONSE_SIZE) + '\n... (truncated)';
            }
          });
          res.on('end', () => {
            // Strip HTML tags for readability
            const text = this.stripHtml(body);
            resolve(text);
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
