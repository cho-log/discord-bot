import { Client, Events, type GatewayIntentBits } from 'discord.js';

const READY_TIMEOUT_MS = 30_000;

export function createClient(intents: readonly GatewayIntentBits[]): Client {
  return new Client({ intents: [...intents] });
}

export type LoginableClient = Pick<Client, 'once' | 'login' | 'removeAllListeners'>;

// login 성공 후 Gateway 핸드셰이크가 멈추면 clientReady가 영영 안 올 수 있다.
// PM2 watchdog에 맡기지 않고 부트스트랩 단계에서 직접 timeout으로 차단한다.
// timer는 login resolve 직후 시작해서 login 자체에 영향을 주지 않고
// unhandled rejection이 떠다니지 않게 한다.
export async function loginAndAwaitReady(client: LoginableClient, token: string): Promise<void> {
  await client.login(token);

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeAllListeners(Events.ClientReady);
      reject(new Error(`clientReady not received within ${READY_TIMEOUT_MS}ms`));
    }, READY_TIMEOUT_MS);
    timer.unref?.();

    client.once(Events.ClientReady, () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
