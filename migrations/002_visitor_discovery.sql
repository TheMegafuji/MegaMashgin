CREATE TABLE visitors (
  id uuid PRIMARY KEY,
  token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
ALTER TABLE customer_sessions ADD COLUMN visitor_id uuid REFERENCES visitors(id) ON DELETE CASCADE;
CREATE INDEX customer_sessions_visitor ON customer_sessions(visitor_id);
CREATE INDEX orders_history ON orders(created_at DESC, id DESC);
CREATE INDEX visitors_expiry ON visitors(expires_at);

CREATE TABLE discovery_cache (
  cache_key char(64) PRIMARY KEY,
  lease_id uuid NOT NULL,
  result jsonb,
  expires_at timestamptz NOT NULL
);
CREATE INDEX discovery_cache_expiry ON discovery_cache(expires_at);
CREATE TABLE discovery_usage (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  model text NOT NULL,
  outcome text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  duration_ms integer NOT NULL
);
