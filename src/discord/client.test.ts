import { EventEmitter } from 'node:events';
import { Events } from 'discord.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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
    removeAllListeners: removeAllListeners as unknown as LoginableClient['removeAllListeners'],
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

  test('rejects when login fails without registering ready listener', async () => {
    const failure = new Error('DISALLOWED_INTENTS');
    const { client, emitter } = createEmitterClient(() => Promise.reject(failure));

    await expect(loginAndAwaitReady(client, 'bad')).rejects.toBe(failure);
    expect(emitter.listenerCount(Events.ClientReady)).toBe(0);
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('rejects when clientReady is not emitted before timeout', async () => {
      const { client, emitter, removeAllListeners } = createEmitterClient(async () => 'token');

      // expect.rejects를 먼저 호출해 reject handler를 미리 부착한다.
      // 그래야 fake timer가 reject를 발화시킬 때 unhandled rejection이 뜨지 않는다.
      const assertion = expect(loginAndAwaitReady(client, 'token')).rejects.toThrow(
        /clientReady not received/,
      );

      await vi.advanceTimersByTimeAsync(30_000);
      await assertion;

      expect(removeAllListeners).toHaveBeenCalledWith(Events.ClientReady);
      expect(emitter.listenerCount(Events.ClientReady)).toBe(0);
    });
  });
});
