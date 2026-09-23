import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { Menu } from '../../../shared/contracts.js';
import { normalizeQuery, suggestionSchema, type Suggestion } from '../../../shared/discovery.js';
import { ApiError } from '../../http/errors.js';
import { transaction } from '../../infrastructure/database.js';
import { admit } from '../sessions/sessions.js';
import {
  buildJevRequest,
  httpJevProvider,
  interpretJev,
  JEV_MODEL,
  JEV_POLICY,
  JevHttpError,
  jevResponseSchema,
  type JevProvider,
} from './jev.js';

export type DiscoveryOptions = {
  apiKey?: string;
  maxCallsPerDay?: number;
  timeoutMs?: number;
  provider?: JevProvider;
};
const fallback = (status: Suggestion['status']): Suggestion => ({
  status,
  source: 'jev',
  products: [],
  cached: false,
});

export async function suggest(
  pool: Pool,
  visitorId: string,
  menu: Menu,
  rawQuery: string,
  options: DiscoveryOptions = {},
): Promise<Suggestion> {
  if (!options.apiKey && !options.provider) return fallback('unavailable');
  const query = normalizeQuery(rawQuery);
  const circuitKey = createHash('sha256')
    .update('jev-auth:' + (options.apiKey ?? 'injected-test-provider'))
    .digest('hex');
  const cacheKey = createHash('sha256')
    .update([JEV_POLICY, JEV_MODEL, menu.revision, query].join('\n'))
    .digest('hex');
  const leaseId = randomUUID();
  const timeoutMs = options.timeoutMs ?? 4000;
  let admission: { cached?: Suggestion; claimed?: boolean };
  try {
    admission = await transaction(pool, async (db) => {
      await admit(db, 'discovery:visitor:' + visitorId, 60, 3600);
      const blocked = await db.query(
        'SELECT result FROM discovery_cache WHERE cache_key=$1 AND expires_at>now()',
        [circuitKey],
      );
      if (blocked.rows[0]) return { cached: { ...fallback('unavailable'), cached: true } };
      const cached = await db.query(
        'SELECT result FROM discovery_cache WHERE cache_key=$1 AND expires_at>now()',
        [cacheKey],
      );
      if (cached.rows[0]?.result)
        return { cached: { ...suggestionSchema.parse(cached.rows[0].result), cached: true } };
      if (cached.rows[0]) return { claimed: false };
      const lease = await db.query(
        `INSERT INTO discovery_cache(cache_key,lease_id,expires_at) VALUES($1,$2,now()+interval '15 seconds')
         ON CONFLICT(cache_key) DO UPDATE SET lease_id=EXCLUDED.lease_id,result=NULL,expires_at=EXCLUDED.expires_at
         WHERE discovery_cache.expires_at<=now() RETURNING cache_key`,
        [cacheKey, leaseId],
      );
      if (!lease.rowCount) return { claimed: false };
      await admit(db, 'discovery:paid:global', options.maxCallsPerDay ?? 100, 86400);
      return { claimed: true };
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) return fallback('limited');
    return fallback('unavailable');
  }
  if (admission.cached) return admission.cached;
  if (!admission.claimed) return fallback('pending');
  const started = Date.now();
  let inputTokens: number | null = null,
    outputTokens: number | null = null;
  let model = JEV_MODEL,
    result: Suggestion = fallback('unavailable'),
    outcome = 'failed';
  try {
    const provider = options.provider ?? httpJevProvider(options.apiKey!);
    const response = jevResponseSchema.parse(
      await provider(buildJevRequest(menu, query), AbortSignal.timeout(timeoutMs)),
    );
    model = response.model;
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    result = interpretJev(response, menu);
    outcome = result.status;
  } catch (error) {
    outcome =
      error instanceof JevHttpError
        ? 'http_' + error.status
        : error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
          ? 'timeout'
          : 'invalid_or_unavailable';
    // Never log provider payloads or credentials. Status-only telemetry supports diagnosis.
  }
  try {
    await pool.query(
      "UPDATE discovery_cache SET result=$3::jsonb,expires_at=now()+CASE WHEN $4 THEN interval '6 hours' ELSE interval '30 seconds' END WHERE cache_key=$1 AND lease_id=$2",
      [cacheKey, leaseId, JSON.stringify(result), ['ready', 'no-match'].includes(outcome)],
    );
    if (['http_401', 'http_403'].includes(outcome))
      await pool.query(
        "INSERT INTO discovery_cache(cache_key,lease_id,result,expires_at) VALUES($1,$2,$3::jsonb,now()+interval '5 minutes') ON CONFLICT(cache_key) DO UPDATE SET result=EXCLUDED.result,expires_at=EXCLUDED.expires_at",
        [circuitKey, randomUUID(), JSON.stringify(fallback('unavailable'))],
      );
    await pool.query(
      'INSERT INTO discovery_usage(model,outcome,input_tokens,output_tokens,duration_ms) VALUES($1,$2,$3,$4,$5)',
      [model, outcome, inputTokens, outputTokens, Date.now() - started],
    );
  } catch {
    /* Telemetry failure cannot turn suggestions into a failed purchase. */
  }
  return result;
}
