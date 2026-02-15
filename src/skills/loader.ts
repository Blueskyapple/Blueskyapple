import * as fs from 'fs';
import * as path from 'path';
import { Skill, Logger } from '../core/types';

/**
 * SkillLoader discovers and loads skills from the skills directory and
 * built-in skill modules.
 */
export class SkillLoader {
  private skillsPath: string;
  private logger: Logger;

  constructor(skillsPath: string, logger: Logger) {
    this.skillsPath = path.resolve(skillsPath);
    this.logger = logger;
  }

  /** Load all built-in skills */
  async loadBuiltinSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];

    // Dynamically import built-in skills
    try {
      const { MemorySkill } = await import('./builtin/memory');
      skills.push(new MemorySkill(null as any)); // Will be initialized later
    } catch (err) {
      this.logger.warn('Failed to load MemorySkill');
    }

    try {
      const { FileSystemSkill } = await import('./builtin/filesystem');
      skills.push(new FileSystemSkill());
    } catch (err) {
      this.logger.warn('Failed to load FileSystemSkill');
    }

    try {
      const { ShellSkill } = await import('./builtin/shell');
      skills.push(new ShellSkill());
    } catch (err) {
      this.logger.warn('Failed to load ShellSkill');
    }

    try {
      const { WebBrowseSkill } = await import('./builtin/webbrowse');
      skills.push(new WebBrowseSkill());
    } catch (err) {
      this.logger.warn('Failed to load WebBrowseSkill');
    }

    this.logger.info(`Loaded ${skills.length} built-in skills`);
    return skills;
  }

  /** Load custom skills from the skills directory */
  async loadCustomSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];

    if (!fs.existsSync(this.skillsPath)) {
      return skills;
    }

    const entries = fs.readdirSync(this.skillsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(
          this.skillsPath,
          entry.name,
          'manifest.json',
        );
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(
              fs.readFileSync(manifestPath, 'utf-8'),
            );
            const skillModule = require(
              path.join(this.skillsPath, entry.name, manifest.main || 'index.js'),
            );
            if (skillModule.default || skillModule.skill) {
              const skill: Skill = skillModule.default || skillModule.skill;
              skills.push(skill);
              this.logger.info(`Loaded custom skill: ${skill.name}`);
            }
          } catch (err) {
            this.logger.warn(`Failed to load custom skill: ${entry.name}`);
          }
        }
      }
    }

    return skills;
  }

  /** Load all skills (builtin + custom) */
  async loadAll(): Promise<Skill[]> {
    const builtin = await this.loadBuiltinSkills();
    const custom = await this.loadCustomSkills();
    return [...builtin, ...custom];
  }
}
