import {
  visitorSchema,
  historySchema,
  suggestionSchema,
  suggestionRequestSchema,
} from '../src/shared/discovery.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import {
  menuSchema,
  orderRequestSchema,
  receiptSchema,
  sessionSchema,
} from '../src/shared/contracts.js';
const schema = (value: z.ZodType) =>
  z.toJSONSchema(value, { target: 'draft-2020-12', io: 'input' });
const json = (ref: string) => ({
  'application/json': { schema: { $ref: '#/components/schemas/' + ref } },
});
const secure = [{ sessionToken: [] }];
const commonErrors = {
  '400': { description: 'Strict request validation failed' },
  '401': { description: 'Session token missing or invalid' },
  '409': {
    description:
      'Changed menu, unavailable item, conflicting intent or completed session; inspect error.code',
  },
  '410': { description: 'Session closed or expired' },
  '429': { description: 'Shared demo admission quota exhausted' },
  '503': { description: 'Temporary failure; preserve the intent and retry with the same key' },
};
const document = {
  openapi: '3.1.0',
  info: {
    title: 'Megafuji Checkout',
    version: '1.1.0',
    description:
      'Synthetic checkout. One purchase per customer session. Money is integer USD cents. Repeat the same intent/key after uncertain responses. Combined per-product quantities are limited to 10; total cart units to 40. No payment secrets accepted.',
  },
  servers: [{ url: 'http://localhost:8090' }],
  paths: {
    '/api/visitor': {
      post: {
        summary: 'Create or restore a 30-day anonymous visitor; sets an opaque HttpOnly cookie',
        responses: {
          '200': {
            description: 'Public visitor UUID and expiry, never a credential',
            content: json('Visitor'),
          },
          '429': commonErrors['429'],
        },
      },
    },
    '/api/visitor/forget': {
      post: {
        summary: 'Revoke the visitor capability and clear its cookie',
        security: [{ visitorCookie: [] }],
        responses: { '204': { description: 'Visitor revoked' }, '401': commonErrors['401'] },
      },
    },
    '/api/visitor/orders': {
      get: {
        summary: 'Paginated history across this visitor-owned purchase sessions',
        security: [{ visitorCookie: [] }],
        parameters: [{ name: 'cursor', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Up to ten receipts and a next cursor', content: json('History') },
          '401': commonErrors['401'],
        },
      },
    },
    '/api/visitor/orders/{id}': {
      get: {
        summary: 'Retrieve only this visitor-owned order',
        security: [{ visitorCookie: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Receipt', content: json('Receipt') },
          '401': commonErrors['401'],
          '404': { description: 'Order not owned by this visitor' },
        },
      },
    },
    '/api/discovery': {
      post: {
        summary:
          'Optional Jev semantic matches, with shared cache and quotas; never changes a purchase',
        security: [{ visitorCookie: [] }],
        requestBody: { required: true, content: json('SuggestionRequest') },
        responses: {
          '200': {
            description: 'Typed result, including graceful unavailable/limited/pending states',
            content: json('Suggestion'),
          },
          '400': commonErrors['400'],
          '401': commonErrors['401'],
        },
      },
    },
    '/api/menu': {
      get: {
        summary: 'Read current menu and revision',
        responses: {
          '200': { description: 'Menu', content: json('Menu') },
          '503': commonErrors['503'],
        },
      },
    },
    '/api/sessions': {
      post: {
        summary: 'Create a 24-hour purchase session; binds to the visitor cookie when present',
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object', additionalProperties: false } },
          },
        },
        responses: {
          '201': {
            description: 'Bearer capability; retain only for this customer',
            content: json('Session'),
          },
          '429': commonErrors['429'],
        },
      },
    },
    '/api/sessions/close': {
      post: {
        security: secure,
        summary: 'End the customer session',
        responses: {
          '204': { description: 'Closed' },
          '401': commonErrors['401'],
          '410': commonErrors['410'],
        },
      },
    },
    '/api/orders': {
      post: {
        security: secure,
        summary: 'Commit a purchase or recover the same receipt',
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: { required: true, content: json('OrderRequest') },
        responses: {
          '201': { description: 'New order committed', content: json('Receipt') },
          '200': { description: 'Original order recovered', content: json('Receipt') },
          ...commonErrors,
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        security: secure,
        summary: 'Read an order belonging to this session',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Receipt', content: json('Receipt') },
          '404': { description: 'Not found for this session' },
          '401': commonErrors['401'],
          '410': commonErrors['410'],
        },
      },
    },
    '/health/live': { get: { responses: { '200': { description: 'Process responds' } } } },
    '/health/ready': {
      get: {
        responses: {
          '200': { description: 'Database/schema reachable' },
          '503': commonErrors['503'],
        },
      },
    },
  },
  components: {
    securitySchemes: {
      visitorCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'megafuji_visitor',
        description: 'Opaque HttpOnly bearer capability; visitor UUID is not authentication.',
      },
      sessionToken: {
        type: 'http',
        scheme: 'bearer',
        description:
          'Opaque 64-character purchase token. Visitor-bound sessions additionally require their matching visitor cookie; old anonymous sessions remain supported.',
      },
    },
    schemas: {
      Visitor: schema(visitorSchema),
      History: schema(historySchema),
      SuggestionRequest: schema(suggestionRequestSchema),
      Suggestion: schema(suggestionSchema),
      Menu: schema(menuSchema),
      OrderRequest: schema(orderRequestSchema),
      Receipt: schema(receiptSchema),
      Session: schema(sessionSchema),
    },
  },
};
await mkdir('docs', { recursive: true });
const serialized = JSON.stringify(document, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if ((await readFile('docs/api.openapi.json', 'utf8')) !== serialized)
    throw new Error('OpenAPI is stale; run npm run api:docs.');
} else await writeFile('docs/api.openapi.json', serialized);
console.log('OpenAPI generated from shared schemas; aggregate constraints also documented.');
