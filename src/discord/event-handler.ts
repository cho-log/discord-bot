import type { Client, ClientEvents } from 'discord.js';

export type EventHandler<E extends keyof ClientEvents> = {
  event: E;
  once?: boolean;
  handle: (...args: ClientEvents[E]) => void | Promise<void>;
};

export type AnyEventHandler = {
  [E in keyof ClientEvents]: EventHandler<E>;
}[keyof ClientEvents];

export function registerEventHandlers(
  client: Pick<Client, 'on' | 'once'>,
  handlers: readonly AnyEventHandler[],
): void {
  for (const handler of handlers) {
    if (handler.once === true) {
      client.once(handler.event, handler.handle as (...args: unknown[]) => void);
    } else {
      client.on(handler.event, handler.handle as (...args: unknown[]) => void);
    }
  }
}
