import { Client, Events, type GatewayIntentBits } from 'discord.js';

const READY_TIMEOUT_MS = 30_000;

export function createClient(intents: readonly GatewayIntentBits[]): Client {
  return new Client({ intents: [...intents] });
}

export type LoginableClient = Pick<Client, 'once' | 'login' | 'off'>;

// login 성공 후 Gateway 핸드셰이크가 멈추면 clientReady가 영영 안 올 수 있다.
// PM2 watchdog에 맡기지 않고 부트스트랩 단계에서 직접 timeout으로 차단한다.
// listener는 login 호출 전에 등록해 이벤트 누락을 방지하고, timeout/login 실패 시
// off(event, handler)로 우리가 등록한 핸들러만 정리한다.
// removeAllListeners는 #6~#8에서 추가될 다른 clientReady 핸들러까지 날릴 수 있어 사용 금지.
export function loginAndAwaitReady(client: LoginableClient, token: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const handleReady = (): void => {
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      client.off(Events.ClientReady, handleReady);
      reject(new Error(`clientReady not received within ${READY_TIMEOUT_MS}ms`));
    }, READY_TIMEOUT_MS);
    timer.unref?.();

    client.once(Events.ClientReady, handleReady);

    client.login(token).catch((err: unknown) => {
      clearTimeout(timer);
      client.off(Events.ClientReady, handleReady);
      reject(err);
    });
  });
}
