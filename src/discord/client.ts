import { Client, Events, type GatewayIntentBits } from 'discord.js';

export function createClient(intents: readonly GatewayIntentBits[]): Client {
  return new Client({ intents: [...intents] });
}

export type LoginableClient = Pick<
  Client,
  'once' | 'login' | 'removeAllListeners'
>;

export async function loginAndAwaitReady(
  client: LoginableClient,
  token: string,
): Promise<void> {
  const ready = new Promise<void>((resolve) => {
    client.once(Events.ClientReady, () => {
      resolve();
    });
  });

  try {
    await client.login(token);
    await ready;
  } catch (err) {
    client.removeAllListeners(Events.ClientReady);
    throw err;
  }
}
