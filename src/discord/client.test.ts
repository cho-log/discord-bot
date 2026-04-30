import { EventEmitter } from 'node:events';
import { Events } from 'discord.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { type LoginableClient, loginAndAwaitReady } from './client.js';

function createEmitterClient(loginImpl: () => Promise<string>): {
  client: LoginableClient;
  emitter: EventEmitter;
  off: ReturnType<typeof vi.fn>;
} {
  const emitter = new EventEmitter();
  const off = vi.fn((event: string, listener: (...args: unknown[]) => void) => {
    emitter.off(event, listener);
  });
  const client: LoginableClient = {
    once: emitter.once.bind(emitter) as LoginableClient['once'],
    login: vi.fn(loginImpl) as unknown as LoginableClient['login'],
    off: off as unknown as LoginableClient['off'],
  };
  return { client, emitter, off };
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

  test('rejects when login fails and removes the ready listener', async () => {
    const failure = new Error('DISALLOWED_INTENTS');
    const { client, emitter, off } = createEmitterClient(() => Promise.reject(failure));

    await expect(loginAndAwaitReady(client, 'bad')).rejects.toBe(failure);
    expect(off).toHaveBeenCalledWith(Events.ClientReady, expect.any(Function));
    expect(emitter.listenerCount(Events.ClientReady)).toBe(0);
  });

  test('does not affect listeners registered outside loginAndAwaitReady', async () => {
    const failure = new Error('DISALLOWED_INTENTS');
    const { client, emitter } = createEmitterClient(() => Promise.reject(failure));
    const externalHandler = vi.fn();
    emitter.on(Events.ClientReady, externalHandler);

    await expect(loginAndAwaitReady(client, 'bad')).rejects.toBe(failure);
    expect(emitter.listenerCount(Events.ClientReady)).toBe(1);
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('rejects when clientReady is not emitted before timeout', async () => {
      const { client, emitter, off } = createEmitterClient(async () => 'token');

      // expect.rejects를 먼저 호출해 reject handler를 미리 부착한다.
      // 그래야 fake timer가 reject를 발화시킬 때 unhandled rejection이 뜨지 않는다.
      const assertion = expect(loginAndAwaitReady(client, 'token')).rejects.toThrow(
        /clientReady not received/,
      );

      await vi.advanceTimersByTimeAsync(30_000);
      await assertion;

      expect(off).toHaveBeenCalledWith(Events.ClientReady, expect.any(Function));
      expect(emitter.listenerCount(Events.ClientReady)).toBe(0);
    });
  });
});
