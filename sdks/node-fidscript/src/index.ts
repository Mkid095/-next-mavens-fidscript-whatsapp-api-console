/**
 * index.ts — public surface of @fidscript/sdk.
 *
 * Usage:
 *   import { Fidscript } from '@fidscript/sdk';
 *
 *   const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY });
 *   await fs.sends.text('my-bot', { number: '+254700000000', message: 'Hello!' });
 *
 *   // Logged-in flow (chatbots, instances, BYO LLM):
 *   const fs2 = new Fidscript();
 *   await fs2.auth.requestCode('me@example.com');
 *   await fs2.auth.verifyCode('me@example.com', '123456');   // sets apiKey + jwt
 *   await fs2.chatbots.list();
 */
import { FidscriptClient, type FidscriptClientOptions } from './client.js';
import { AuthResource } from './auth.js';
import { SendsResource } from './sends.js';
import { InstancesResource } from './instances.js';
import { ChatbotsResource } from './chatbots.js';
import { LlmResource } from './llm.js';

export class Fidscript {
  public readonly client: FidscriptClient;
  public readonly auth: AuthResource;
  public readonly sends: SendsResource;
  public readonly instances: InstancesResource;
  public readonly chatbots: ChatbotsResource;
  public readonly llm: LlmResource;

  constructor(opts: FidscriptClientOptions = {}) {
    this.client = new FidscriptClient(opts);
    this.auth = new AuthResource(this.client);
    this.sends = new SendsResource(this.client);
    this.instances = new InstancesResource(this.client);
    this.chatbots = new ChatbotsResource(this.client);
    this.llm = new LlmResource(this.client);
  }

  /** Quick check: returns the authenticated client. */
  whoami() {
    return this.client.request('GET', '/api/v1/whoami', undefined, { auth: 'apikey' });
  }

  /** Token balance + usage. */
  tokens() {
    return this.client.request('GET', '/api/v1/usage', undefined, { auth: 'apikey' });
  }

  /**
   * Hit ANY API endpoint not wrapped above. Auto-picks auth from path.
   *
   *   await fs.api('POST', '/api/v1/groups/create', { subject: 'My group', participants: ['+254…'] });
   *   await fs.api('GET',  '/api/v1/profile/fetch/my-bot', undefined, { auth: 'apikey' });
   */
  api<T = unknown>(method: string, path: string, body?: unknown, opts?: { auth?: 'apikey' | 'jwt' }): Promise<T> {
    return this.client.request<T>(method, path, body, opts);
  }
}

export { FidscriptClient } from './client.js';
export { FidscriptError } from './errors.js';
export type { FidscriptErrorCode } from './errors.js';
export type { FidscriptClientOptions } from './client.js';
export type {
  Whoami, Usage, Instance, CreateInstance,
  SendText, SendMedia, SendLocation, SendContact, SendReaction, SendPoll,
  SendList, SendAudio, SendSticker, SendStatus, SendResult,
  ContactCard, MessageKey, ListSection, ListRow,
  Chatbot, ChatbotAiConfig, ChatbotHealth,
  LlmConnection, CreateLlmConnection,
} from './types.js';
export { AuthResource } from './auth.js';
export { SendsResource } from './sends.js';
export { InstancesResource } from './instances.js';
export { ChatbotsResource, type CreateChatbot } from './chatbots.js';
export { LlmResource } from './llm.js';