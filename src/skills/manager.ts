/**
 * Skills manager for BlueBot
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  Skill,
  SkillContext,
  SkillResult,
  SkillTrigger,
  Tool,
  Message,
} from '../core/types.js';
import { Agent } from '../core/agent.js';
import { eventBus } from '../core/events.js';

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private agent: Agent;
  private skillsDir?: string;

  constructor(agent: Agent, skillsDir?: string) {
    this.agent = agent;
    this.skillsDir = skillsDir;
  }

  /**
   * Register a skill
   */
  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);

    // Register skill tools with the agent
    if (skill.tools) {
      for (const tool of skill.tools) {
        this.agent.registerTool(tool);
      }
    }

    console.log(`Skill registered: ${skill.name} (${skill.id})`);
  }

  /**
   * Unregister a skill
   */
  unregisterSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (skill) {
      // Unregister tools
      if (skill.tools) {
        for (const tool of skill.tools) {
          this.agent.unregisterTool(tool.name);
        }
      }
      this.skills.delete(skillId);
      console.log(`Skill unregistered: ${skill.name}`);
    }
  }

  /**
   * Get a skill by ID
   */
  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Get all registered skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get enabled skills
   */
  getEnabledSkills(): Skill[] {
    return Array.from(this.skills.values()).filter((s) => s.enabled);
  }

  /**
   * Enable a skill
   */
  enableSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Disable a skill
   */
  disableSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Check if a message matches any skill triggers
   */
  matchTriggers(message: Message): { skill: Skill; trigger: SkillTrigger } | null {
    for (const skill of this.skills.values()) {
      if (!skill.enabled || !skill.triggers) continue;

      for (const trigger of skill.triggers) {
        if (this.matchTrigger(message.content, trigger)) {
          return { skill, trigger };
        }
      }
    }
    return null;
  }

  private matchTrigger(content: string, trigger: SkillTrigger): boolean {
    switch (trigger.type) {
      case 'command':
        return content.toLowerCase().startsWith(trigger.pattern.toLowerCase());

      case 'keyword':
        return content.toLowerCase().includes(trigger.pattern.toLowerCase());

      case 'regex':
        const regex = new RegExp(trigger.pattern, 'i');
        return regex.test(content);

      case 'event':
        // Events are handled separately
        return false;

      default:
        return false;
    }
  }

  /**
   * Execute a skill
   */
  async executeSkill(
    skill: Skill,
    context: SkillContext,
    params: Record<string, unknown> = {}
  ): Promise<SkillResult> {
    try {
      await eventBus.emit('skill:triggered', {
        skillId: skill.id,
        skillName: skill.name,
        params,
      });

      const result = await skill.handler(context, params);
      return result;
    } catch (error) {
      console.error(`Error executing skill ${skill.id}:`, error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Load skills from a directory
   */
  async loadSkillsFromDir(dir?: string): Promise<void> {
    const skillsDir = dir || this.skillsDir;
    if (!skillsDir) {
      console.log('No skills directory specified');
      return;
    }

    try {
      const files = await fs.readdir(skillsDir);
      const jsFiles = files.filter(
        (f) => f.endsWith('.js') || f.endsWith('.mjs')
      );

      for (const file of jsFiles) {
        try {
          const skillPath = path.join(skillsDir, file);
          const skillModule = await import(`file://${skillPath}`);

          if (skillModule.default && typeof skillModule.default === 'object') {
            this.registerSkill(skillModule.default as Skill);
          } else if (skillModule.skill) {
            this.registerSkill(skillModule.skill as Skill);
          }
        } catch (error) {
          console.error(`Failed to load skill from ${file}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to read skills directory ${skillsDir}:`, error);
    }
  }

  /**
   * Get skill count
   */
  get count(): number {
    return this.skills.size;
  }
}

/**
 * Create a skill helper function
 */
export function createSkill(options: {
  id: string;
  name: string;
  description: string;
  version?: string;
  enabled?: boolean;
  triggers?: SkillTrigger[];
  tools?: Tool[];
  handler: (
    context: SkillContext,
    params: Record<string, unknown>
  ) => Promise<SkillResult>;
}): Skill {
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    version: options.version || '1.0.0',
    enabled: options.enabled ?? true,
    triggers: options.triggers || [],
    tools: options.tools || [],
    handler: options.handler,
  };
}

/**
 * Create a tool helper function
 */
export function createTool(options: {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}): Tool {
  return {
    name: options.name,
    description: options.description,
    parameters: options.parameters,
    handler: options.handler,
  };
}
