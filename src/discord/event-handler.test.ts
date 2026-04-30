import type { Client } from 'discord.js';
import { describe, expect, test, vi } from 'vitest';
import { type AnyEventHandler, registerEventHandlers } from './event-handler.js';

function createMockClient() {
  return {
    on: vi.fn(),
    once: vi.fn(),
  } as unknown as Pick<Client, 'on' | 'once'>;
}

describe('registerEventHandlers', () => {
  test('does nothing for empty handlers', () => {
    const client = createMockClient();
    registerEventHandlers(client, []);
    expect(client.on).not.toHaveBeenCalled();
    expect(client.once).not.toHaveBeenCalled();
  });

  test('registers persistent handler with client.on', () => {
    const client = createMockClient();
    const handler: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    registerEventHandlers(client, [handler]);
    expect(client.on).toHaveBeenCalledWith('messageCreate', handler.handle);
    expect(client.once).not.toHaveBeenCalled();
  });

  test('registers once handler with client.once', () => {
    const client = createMockClient();
    const handler: AnyEventHandler = {
      event: 'interactionCreate',
      once: true,
      handle: vi.fn(),
    };
    registerEventHandlers(client, [handler]);
    expect(client.once).toHaveBeenCalledWith('interactionCreate', handler.handle);
    expect(client.on).not.toHaveBeenCalled();
  });

  test('registers heterogeneous handlers in order', () => {
    const client = createMockClient();
    const messageHandler: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    const interactionHandler: AnyEventHandler = {
      event: 'interactionCreate',
      handle: vi.fn(),
    };
    registerEventHandlers(client, [messageHandler, interactionHandler]);
    expect(client.on).toHaveBeenCalledTimes(2);
    expect(client.on).toHaveBeenNthCalledWith(1, 'messageCreate', messageHandler.handle);
    expect(client.on).toHaveBeenNthCalledWith(2, 'interactionCreate', interactionHandler.handle);
  });
});
