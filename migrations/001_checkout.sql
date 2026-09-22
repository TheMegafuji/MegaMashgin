CREATE TABLE products (
  id text PRIMARY KEY, name text NOT NULL, description text NOT NULL,
  category text NOT NULL CHECK (category IN ('Sandwiches','Salads','Sweet treats','Drinks')),
  price_cents integer NOT NULL CHECK (price_cents >= 0 AND price_cents <= 50000),
  available boolean NOT NULL DEFAULT true, image text NOT NULL, dietary jsonb NOT NULL DEFAULT '[]', position integer NOT NULL
);
CREATE TABLE customer_sessions (
  id uuid PRIMARY KEY, token_hash char(64) UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, closed_at timestamptz
);
CREATE INDEX customer_sessions_expiry ON customer_sessions (expires_at);
CREATE TABLE orders (
  id uuid PRIMARY KEY, session_id uuid NOT NULL UNIQUE REFERENCES customer_sessions(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL, request_hash char(64) NOT NULL, reference text NOT NULL,
  menu_revision char(64) NOT NULL, payment_method text NOT NULL CHECK (payment_method IN ('demo-card','demo-cash')),
  total_cents integer NOT NULL CHECK (total_cents >= 0 AND total_cents <= 50000),
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE admission (
  scope text NOT NULL, bucket bigint NOT NULL, used integer NOT NULL CHECK (used > 0),
  expires_at timestamptz NOT NULL, PRIMARY KEY (scope, bucket)
);
INSERT INTO products (id,name,description,category,price_cents,image,dietary,position) VALUES
('pesto-focaccia','Pesto focaccia','Basil pesto, mozzarella & sun-ripened tomato.','Sandwiches',850,'/food/focaccia.svg','["Vegetarian"]',1),
('chicken-club','The chicken club','Roast chicken, crisp leaves & lemon aioli.','Sandwiches',1050,'/food/club.svg','[]',2),
('avocado-toast','Avocado toast','Smashed avocado, pickled onion & seeded sourdough.','Sandwiches',780,'/food/avocado.svg','["Plant-based"]',3),
('green-bowl','The green bowl','Garden greens, avocado, grains & citrus dressing.','Salads',980,'/food/salad.svg','["Plant-based"]',4),
('harvest-bowl','Harvest bowl','Roasted squash, chickpeas & tahini dressing.','Salads',1020,'/food/harvest.svg','["Plant-based"]',5),
('butter-croissant','Butter croissant','Golden layers. Baked fresh, every morning.','Sweet treats',380,'/food/croissant.svg','["Vegetarian"]',6),
('chocolate-cookie','Chocolate chunk cookie','A soft center, dark chocolate & a pinch of salt.','Sweet treats',320,'/food/cookie.svg','["Vegetarian"]',7),
('berry-yogurt','Berry yogurt pot','Thick yogurt, berries & crunchy granola.','Sweet treats',520,'/food/yogurt.svg','["Vegetarian"]',8),
('iced-latte','Iced latte','Our house espresso, milk & plenty of ice.','Drinks',450,'/food/latte.svg','["Vegetarian"]',9),
('citrus-soda','Citrus sparkle','Sparkling citrus with a fresh orange twist.','Drinks',390,'/food/citrus.svg','["Plant-based"]',10),
('sparkling-water','Sparkling water','Crisp, chilled water. A little lift.','Drinks',250,'/food/water.svg','["Plant-based"]',11),
('matcha-latte','Iced matcha','Ceremonial-style matcha with oat milk.','Drinks',490,'/food/matcha.svg','["Plant-based"]',12);
UPDATE products SET available = false WHERE id = 'matcha-latte';
