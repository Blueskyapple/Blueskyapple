import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { HeartbeatTask, Logger } from '../core/types';
import { Agent } from '../core/agent';

/**
 * HeartbeatScheduler manages proactive, recurring tasks.
 * Tasks are defined with cron expressions and executed on schedule.
 */
export class HeartbeatScheduler {
  private tasks: Map<string, HeartbeatTask> = new Map();
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private agent: Agent;
  private logger: Logger;
  private tasksFile: string;
  private sendCallback?: (userId: string, channel: string, message: string) => Promise<void>;

  constructor(agent: Agent, logger: Logger, dataPath: string) {
    this.agent = agent;
    this.logger = logger;
    this.tasksFile = path.join(dataPath, 'heartbeat-tasks.json');
    this.loadTasks();
  }

  /** Set a callback for sending messages back to users */
  onSend(callback: (userId: string, channel: string, message: string) => Promise<void>): void {
    this.sendCallback = callback;
  }

  /** Load tasks from disk */
  private loadTasks(): void {
    try {
      if (fs.existsSync(this.tasksFile)) {
        const data = JSON.parse(fs.readFileSync(this.tasksFile, 'utf-8'));
        for (const task of data) {
          this.tasks.set(task.id, task);
        }
        this.logger.info(`Loaded ${this.tasks.size} heartbeat tasks`);
      }
    } catch (err) {
      this.logger.warn('Failed to load heartbeat tasks');
    }
  }

  /** Save tasks to disk */
  private saveTasks(): void {
    const dir = path.dirname(this.tasksFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = Array.from(this.tasks.values());
    fs.writeFileSync(this.tasksFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  /** Add a new heartbeat task */
  addTask(
    name: string,
    schedule: string,
    prompt: string,
    userId: string,
    channel: string,
  ): HeartbeatTask {
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    const task: HeartbeatTask = {
      id: uuidv4(),
      name,
      schedule,
      prompt,
      enabled: true,
      userId,
      channel,
    };

    this.tasks.set(task.id, task);
    this.saveTasks();
    this.scheduleTask(task);

    this.logger.info(`Heartbeat task added: ${name} (${schedule})`);
    return task;
  }

  /** Remove a heartbeat task */
  removeTask(id: string): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
    }

    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.saveTasks();
    }
    return deleted;
  }

  /** Enable or disable a task */
  setEnabled(id: string, enabled: boolean): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.enabled = enabled;
    this.saveTasks();

    const job = this.jobs.get(id);
    if (job) {
      if (enabled) {
        job.start();
      } else {
        job.stop();
      }
    }

    return true;
  }

  /** Schedule a task with cron */
  private scheduleTask(task: HeartbeatTask): void {
    if (this.jobs.has(task.id)) {
      this.jobs.get(task.id)!.stop();
    }

    const job = cron.schedule(task.schedule, async () => {
      if (!task.enabled) return;

      this.logger.info(`Heartbeat firing: ${task.name}`);
      try {
        const response = await this.agent.processHeartbeat(
          task.prompt,
          task.userId,
          task.channel,
        );

        task.lastRun = new Date();
        this.saveTasks();

        if (this.sendCallback) {
          await this.sendCallback(task.userId, task.channel, response);
        }
      } catch (err) {
        this.logger.error(`Heartbeat task failed: ${task.name}`, err);
      }
    });

    if (!task.enabled) {
      job.stop();
    }

    this.jobs.set(task.id, job);
  }

  /** Start all scheduled tasks */
  startAll(): void {
    for (const task of this.tasks.values()) {
      this.scheduleTask(task);
    }
    this.logger.info(`Started ${this.tasks.size} heartbeat tasks`);
  }

  /** Stop all scheduled tasks */
  stopAll(): void {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
    this.logger.info('All heartbeat tasks stopped');
  }

  /** List all tasks */
  listTasks(): HeartbeatTask[] {
    return Array.from(this.tasks.values());
  }

  /** Get a specific task */
  getTask(id: string): HeartbeatTask | undefined {
    return this.tasks.get(id);
  }
}
