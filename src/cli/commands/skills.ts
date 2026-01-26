/**
 * Skills management command for BlueBot CLI
 */

import chalk from 'chalk';
import { builtinSkills } from '../../skills/index.js';
import { loadConfig, saveConfig } from '../../config/index.js';

interface SkillsOptions {
  list?: boolean;
  enable?: string;
  disable?: string;
  info?: string;
}

export async function manageSkills(options: SkillsOptions): Promise<void> {
  const config = await loadConfig();

  if (options.list || (!options.enable && !options.disable && !options.info)) {
    // List all skills
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white.bold('  Available Skills'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    for (const skill of builtinSkills) {
      const isEnabled = config.skills.includes(skill.id);
      const status = isEnabled ? chalk.green('✓ enabled') : chalk.gray('○ disabled');

      console.log(chalk.white(`  ${skill.name}`));
      console.log(chalk.gray(`    ID: ${skill.id}`));
      console.log(chalk.gray(`    ${skill.description}`));
      console.log(chalk.gray(`    Status: ${status}`));

      if (skill.triggers && skill.triggers.length > 0) {
        const triggers = skill.triggers.map((t) => `${t.type}:${t.pattern}`).join(', ');
        console.log(chalk.gray(`    Triggers: ${triggers}`));
      }

      if (skill.tools && skill.tools.length > 0) {
        const tools = skill.tools.map((t) => t.name).join(', ');
        console.log(chalk.gray(`    Tools: ${tools}`));
      }

      console.log();
    }

    console.log(chalk.gray('  Use --enable <id> or --disable <id> to toggle skills'));
    return;
  }

  if (options.enable) {
    const skill = builtinSkills.find((s) => s.id === options.enable);
    if (!skill) {
      console.log(chalk.red(`\nSkill not found: ${options.enable}`));
      console.log(chalk.gray('Use --list to see available skills'));
      return;
    }

    if (!config.skills.includes(options.enable)) {
      config.skills.push(options.enable);
      await saveConfig(config);
      console.log(chalk.green(`\nSkill enabled: ${skill.name}`));
    } else {
      console.log(chalk.yellow(`\nSkill already enabled: ${skill.name}`));
    }
    return;
  }

  if (options.disable) {
    const skill = builtinSkills.find((s) => s.id === options.disable);
    if (!skill) {
      console.log(chalk.red(`\nSkill not found: ${options.disable}`));
      return;
    }

    const index = config.skills.indexOf(options.disable);
    if (index > -1) {
      config.skills.splice(index, 1);
      await saveConfig(config);
      console.log(chalk.yellow(`\nSkill disabled: ${skill.name}`));
    } else {
      console.log(chalk.gray(`\nSkill already disabled: ${skill.name}`));
    }
    return;
  }

  if (options.info) {
    const skill = builtinSkills.find((s) => s.id === options.info);
    if (!skill) {
      console.log(chalk.red(`\nSkill not found: ${options.info}`));
      return;
    }

    const isEnabled = config.skills.includes(skill.id);

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white.bold(`  ${skill.name}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(chalk.white('  ID:          ') + chalk.gray(skill.id));
    console.log(chalk.white('  Version:     ') + chalk.gray(skill.version));
    console.log(chalk.white('  Description: ') + chalk.gray(skill.description));
    console.log(
      chalk.white('  Status:      ') +
        (isEnabled ? chalk.green('Enabled') : chalk.gray('Disabled'))
    );

    if (skill.triggers && skill.triggers.length > 0) {
      console.log(chalk.white('\n  Triggers:'));
      for (const trigger of skill.triggers) {
        console.log(chalk.gray(`    - ${trigger.type}: ${trigger.pattern}`));
      }
    }

    if (skill.tools && skill.tools.length > 0) {
      console.log(chalk.white('\n  Tools:'));
      for (const tool of skill.tools) {
        console.log(chalk.gray(`    - ${tool.name}: ${tool.description}`));
      }
    }

    console.log();
    return;
  }
}
