import type { Pool } from 'pg';
import type { DiscoveryOptions } from '../modules/discovery/discovery.js';
export interface AppOptions {
  pool: Pool;
  instanceId?: string;
  logger?: boolean;
  publicOrigin?: string;
  staticRoot?: string;
  sessionLimit?: number;
  release?: string;
  discovery?: DiscoveryOptions;
  afterCommit?: (request: import('fastify').FastifyRequest) => Promise<void>;
  /** Explicit browser origins for the token-only game transport. */
  gameOrigins?: readonly string[];
  /** Per-IP session admission for explicit game origins; ordinary checkout stays at sessionLimit. */
  gameSessionLimit?: number;
  /** Shared game session admission; ordinary checkout stays at 600 per ten minutes. */
  gameSessionGlobalLimit?: number;
  /** Shared game order admission for explicit game sessions; ordinary checkout stays at 300/minute. */
  gameOrderLimit?: number;
}
