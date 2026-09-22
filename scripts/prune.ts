import { createPool } from '../src/server/database.js';
import { configuration } from '../src/server/config.js';
const pool = createPool(configuration().DATABASE_URL);
try {
  const result = await pool.query(
    "WITH expired AS (SELECT id FROM customer_sessions WHERE visitor_id IS NULL AND expires_at < now() - interval '7 days' ORDER BY expires_at LIMIT 500) DELETE FROM customer_sessions WHERE id IN (SELECT id FROM expired)",
  );
  const visitors = await pool.query(
    "WITH expired AS (SELECT id FROM visitors WHERE expires_at<now() OR revoked_at<now()-interval '7 days' ORDER BY expires_at LIMIT 500) DELETE FROM visitors WHERE id IN (SELECT id FROM expired)",
  );
  await pool.query("DELETE FROM discovery_cache WHERE expires_at<now()-interval '1 day'");
  await pool.query("DELETE FROM discovery_usage WHERE created_at<now()-interval '30 days'");
  const counters = await pool.query(
    "DELETE FROM admission WHERE expires_at < now() - interval '1 day'",
  );
  console.log(
    JSON.stringify({
      deletedExpiredSessions: result.rowCount,
      deletedExpiredVisitors: visitors.rowCount,
      deletedExpiredCounters: counters.rowCount,
    }),
  );
} finally {
  await pool.end();
}
