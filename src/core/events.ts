/**
 * Event emitter for BlueBot
 */

import { Event, EventType, EventHandler } from './types.js';

export class EventEmitter {
  private handlers: Map<EventType | '*', Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: EventType | '*', handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (once only)
   */
  once(event: EventType | '*', handler: EventHandler): () => void {
    const wrappedHandler: EventHandler = async (e) => {
      this.off(event, wrappedHandler);
      await handler(e);
    };
    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: EventType | '*', handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event
   */
  async emit(type: EventType, data: unknown, source?: string): Promise<void> {
    const event: Event = {
      type,
      data,
      timestamp: new Date(),
      source,
    };

    // Call specific handlers
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
        }
      }
    }

    // Call wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in wildcard event handler:`, error);
        }
      }
    }
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(event?: EventType | '*'): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get handler count for an event
   */
  listenerCount(event: EventType | '*'): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

// Global event bus
export const eventBus = new EventEmitter();
