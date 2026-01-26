/**
 * Built-in skills for BlueBot
 */

import { createSkill, createTool } from '../manager.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Weather skill - demonstrates tool usage
 */
export const weatherSkill = createSkill({
  id: 'weather',
  name: 'Weather',
  description: 'Get weather information for a location',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'keyword', pattern: 'weather' },
    { type: 'command', pattern: '/weather' },
  ],
  tools: [
    createTool({
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or location to get weather for',
          },
        },
        required: ['location'],
      },
      handler: async (params) => {
        // This is a mock implementation - integrate with a real weather API
        const location = params.location as string;
        return {
          location,
          temperature: Math.round(15 + Math.random() * 20),
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][
            Math.floor(Math.random() * 4)
          ],
          humidity: Math.round(40 + Math.random() * 40),
          note: 'This is mock data. Connect to a real weather API for actual data.',
        };
      },
    }),
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'Weather skill activated. Ask me about the weather in any location!',
    };
  },
});

/**
 * Calculator skill
 */
export const calculatorSkill = createSkill({
  id: 'calculator',
  name: 'Calculator',
  description: 'Perform mathematical calculations',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'command', pattern: '/calc' },
    { type: 'regex', pattern: '^\\d+[\\+\\-\\*\\/]' },
  ],
  tools: [
    createTool({
      name: 'calculate',
      description: 'Evaluate a mathematical expression',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The mathematical expression to evaluate',
          },
        },
        required: ['expression'],
      },
      handler: async (params) => {
        const expression = params.expression as string;
        // Safe evaluation using Function (basic math only)
        const safeExpression = expression.replace(/[^0-9+\-*/().%\s]/g, '');
        try {
          const result = new Function(`return ${safeExpression}`)();
          return { expression, result };
        } catch {
          return { expression, error: 'Invalid expression' };
        }
      },
    }),
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'Calculator ready. Give me a math expression!',
    };
  },
});

/**
 * Reminder skill
 */
export const reminderSkill = createSkill({
  id: 'reminder',
  name: 'Reminder',
  description: 'Set reminders and timers',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'keyword', pattern: 'remind me' },
    { type: 'command', pattern: '/remind' },
  ],
  tools: [
    createTool({
      name: 'set_reminder',
      description: 'Set a reminder for later',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The reminder message',
          },
          delay_minutes: {
            type: 'number',
            description: 'How many minutes until the reminder',
          },
        },
        required: ['message', 'delay_minutes'],
      },
      handler: async (params) => {
        const message = params.message as string;
        const delayMinutes = params.delay_minutes as number;

        // In a real implementation, you would persist this and set up a proper scheduler
        const reminderTime = new Date(Date.now() + delayMinutes * 60 * 1000);

        return {
          success: true,
          message,
          reminderTime: reminderTime.toISOString(),
          note: 'Reminder set! (Note: In-memory only, will not persist across restarts)',
        };
      },
    }),
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'Reminder skill activated. Tell me what to remind you about!',
    };
  },
});

/**
 * System info skill
 */
export const systemInfoSkill = createSkill({
  id: 'system-info',
  name: 'System Info',
  description: 'Get system information',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'command', pattern: '/system' },
    { type: 'keyword', pattern: 'system info' },
  ],
  tools: [
    createTool({
      name: 'get_system_info',
      description: 'Get current system information',
      parameters: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        return {
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        };
      },
    }),
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'System info skill activated.',
    };
  },
});

/**
 * Web search skill (mock)
 */
export const webSearchSkill = createSkill({
  id: 'web-search',
  name: 'Web Search',
  description: 'Search the web for information',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'command', pattern: '/search' },
    { type: 'keyword', pattern: 'search for' },
  ],
  tools: [
    createTool({
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
        },
        required: ['query'],
      },
      handler: async (params) => {
        const query = params.query as string;
        // This is a mock - integrate with a real search API
        return {
          query,
          results: [
            {
              title: `Search result for: ${query}`,
              snippet: 'This is a mock search result. Integrate with a real search API.',
              url: 'https://example.com',
            },
          ],
          note: 'Connect to a real search API (Google, Bing, DuckDuckGo) for actual results.',
        };
      },
    }),
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'Web search skill activated. What would you like to search for?',
    };
  },
});

/**
 * Note-taking skill
 */
export const notesSkill = createSkill({
  id: 'notes',
  name: 'Notes',
  description: 'Take and manage notes',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'command', pattern: '/note' },
    { type: 'keyword', pattern: 'take a note' },
  ],
  tools: [
    createTool({
      name: 'save_note',
      description: 'Save a note',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The note title',
          },
          content: {
            type: 'string',
            description: 'The note content',
          },
          tags: {
            type: 'array',
            description: 'Tags for the note',
          },
        },
        required: ['content'],
      },
      handler: async (params) => {
        const title = (params.title as string) || 'Untitled';
        const content = params.content as string;
        const tags = (params.tags as string[]) || [];

        // In production, save to storage
        return {
          success: true,
          note: {
            id: Date.now().toString(),
            title,
            content,
            tags,
            createdAt: new Date().toISOString(),
          },
        };
      },
    }),
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'Notes skill activated. What would you like to note down?',
    };
  },
});

// Export all built-in skills
export const builtinSkills = [
  weatherSkill,
  calculatorSkill,
  reminderSkill,
  systemInfoSkill,
  webSearchSkill,
  notesSkill,
];

export default builtinSkills;
