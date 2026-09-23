import {
  menuSchema,
  receiptSchema,
  sessionSchema,
  type OrderRequest,
} from '../../shared/contracts.js';
import {
  historySchema,
  suggestionSchema,
  visitorSchema,
  type Visitor,
} from '../../shared/discovery.js';
export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    signal: options.signal ?? AbortSignal.timeout(10000),
    headers: { 'content-type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = body as { error?: { code?: string; message?: string } };
    throw new ApiFailure(
      response.status,
      error.error?.code ?? 'REQUEST_FAILED',
      error.error?.message ?? 'We could not complete this request.',
    );
  }
  return body;
}
export const fetchMenu = async () => menuSchema.parse(await request('/api/menu'));
export const createSession = async () => {
  const visitor = await ensureVisitor();
  return sessionSchema.parse(
    await request('/api/sessions', {
      method: 'POST',
      headers: { 'x-visitor-id': visitor.id },
      body: '{}',
    }),
  );
};
export const sendOrder = async (token: string, key: string, body: OrderRequest) =>
  receiptSchema.parse(
    await request('/api/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'idempotency-key': key },
      body: JSON.stringify(body),
    }),
  );
export const closeSession = async (token: string) =>
  request('/api/sessions/close', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token },
    body: '{}',
  });

let visitorPending: Promise<Visitor> | undefined;
export function ensureVisitor(): Promise<Visitor> {
  visitorPending ??= request('/api/visitor', { method: 'POST', body: '{}' })
    .then((body) => visitorSchema.parse(body))
    .finally(() => {
      visitorPending = undefined;
    });
  return visitorPending;
}
export const forgetVisitor = async () =>
  request('/api/visitor/forget', { method: 'POST', body: '{}' });
export const fetchHistory = async (cursor?: string) =>
  historySchema.parse(
    await request('/api/visitor/orders' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : '')),
  );
export const fetchSuggestions = async (query: string, signal: AbortSignal) => {
  await ensureVisitor();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return suggestionSchema.parse(
    await request('/api/discovery', {
      method: 'POST',
      body: JSON.stringify({ query }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(6500)]),
    }),
  );
};
