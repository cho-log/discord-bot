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

  test('skips duplicate handler instance on repeated calls to same client', () => {
    const client = createMockClient();
    const handler: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    registerEventHandlers(client, [handler]);
    registerEventHandlers(client, [handler]);
    expect(client.on).toHaveBeenCalledTimes(1);
    expect(client.on).toHaveBeenCalledWith('messageCreate', handler.handle);
  });

  test('skips duplicates within a single call', () => {
    const client = createMockClient();
    const handler: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    registerEventHandlers(client, [handler, handler]);
    expect(client.on).toHaveBeenCalledTimes(1);
  });

  test('still registers a different handler instance for the same event', () => {
    const client = createMockClient();
    const first: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    const second: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    registerEventHandlers(client, [first]);
    registerEventHandlers(client, [second]);
    expect(client.on).toHaveBeenCalledTimes(2);
    expect(client.on).toHaveBeenNthCalledWith(1, 'messageCreate', first.handle);
    expect(client.on).toHaveBeenNthCalledWith(2, 'messageCreate', second.handle);
  });

  test('tracks dedup state per client instance', () => {
    const clientA = createMockClient();
    const clientB = createMockClient();
    const handler: AnyEventHandler = {
      event: 'messageCreate',
      handle: vi.fn(),
    };
    registerEventHandlers(clientA, [handler]);
    registerEventHandlers(clientB, [handler]);
    expect(clientA.on).toHaveBeenCalledTimes(1);
    expect(clientB.on).toHaveBeenCalledTimes(1);
  });
});
