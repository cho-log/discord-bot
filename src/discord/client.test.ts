import { EventEmitter } from 'node:events';
import { Events } from 'discord.js';
import { describe, expect, test, vi } from 'vitest';
import { type LoginableClient, loginAndAwaitReady } from './client.js';

function createEmitterClient(loginImpl: () => Promise<string>): {
  client: LoginableClient;
  emitter: EventEmitter;
  removeAllListeners: ReturnType<typeof vi.fn>;
} {
  const emitter = new EventEmitter();
  const removeAllListeners = vi.fn((event: string) => {
    emitter.removeAllListeners(event);
  });
  const client: LoginableClient = {
    once: emitter.once.bind(emitter) as LoginableClient['once'],
    login: vi.fn(loginImpl) as unknown as LoginableClient['login'],
    removeAllListeners:
      removeAllListeners as unknown as LoginableClient['removeAllListeners'],
  };
  return { client, emitter, removeAllListeners };
}

describe('loginAndAwaitReady', () => {
  test('resolves after login resolves and clientReady is emitted', async () => {
    const { client, emitter } = createEmitterClient(async () => 'token');

    const pending = loginAndAwaitReady(client, 'token');
    queueMicrotask(() => {
      emitter.emit(Events.ClientReady);
    });

    await expect(pending).resolves.toBeUndefined();
  });

  test('rejects when login fails and removes the listener', async () => {
    const failure = new Error('DISALLOWED_INTENTS');
    const { client, emitter, removeAllListeners } = createEmitterClient(() =>
      Promise.reject(failure),
    );

    await expect(loginAndAwaitReady(client, 'bad')).rejects.toBe(failure);
    expect(removeAllListeners).toHaveBeenCalledWith(Events.ClientReady);
    expect(emitter.listenerCount(Events.ClientReady)).toBe(0);
  });
});
