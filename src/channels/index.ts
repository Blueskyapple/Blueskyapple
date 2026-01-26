/**
 * Channel adapters index for BlueBot
 */

export * from './base.js';
export * from './discord.js';
export * from './telegram.js';
export * from './slack.js';

// Re-export the registration function and registry
export { registerChannel, channelRegistry, createChannel } from './base.js';
