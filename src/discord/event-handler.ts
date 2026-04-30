import type { Client, ClientEvents } from 'discord.js';

export type EventHandler<E extends keyof ClientEvents> = {
  event: E;
  once?: boolean;
  handle: (...args: ClientEvents[E]) => void | Promise<void>;
};

// AnyEventHandler는 distributed mapped type으로 ClientEvents의 각 키마다
// EventHandler<E>를 만들고 union으로 합친다. 이렇게 해야 배열에 담아도
// 각 요소의 event와 handle 시그니처가 동일한 E로 묶인 채 유지된다.
// `EventHandler<keyof ClientEvents>`로 wide하게 두면 generic이 erasure돼
// 잘못된 (event, handle) 조합도 통과된다.
export type AnyEventHandler = {
  [E in keyof ClientEvents]: EventHandler<E>;
}[keyof ClientEvents];

export function registerEventHandlers(
  client: Pick<Client, 'on' | 'once'>,
  handlers: readonly AnyEventHandler[],
): void {
  for (const handler of handlers) {
    // discord.js의 Client.on/once는 자체 generic 시그니처를 가지지만
    // AnyEventHandler가 union이라 호출 타이밍에 E가 좁혀지지 않아 cast가 필요하다.
    // handler 자체는 EventHandler<E> 제약으로 이미 안전하므로 cast의 위험은 없다.
    if (handler.once === true) {
      client.once(handler.event, handler.handle as (...args: unknown[]) => void);
    } else {
      client.on(handler.event, handler.handle as (...args: unknown[]) => void);
    }
  }
}
