import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);

const migration = `
CREATE TABLE IF NOT EXISTS auditx_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditx_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auditx_users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'trial',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditx_licenses_user_id ON auditx_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_auditx_licenses_stripe_sub ON auditx_licenses(stripe_subscription_id);
`;

async function migrate() {
  console.log('Running AuditX migrations...');
  const statements = [
    `CREATE TABLE IF NOT EXISTS auditx_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS auditx_licenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auditx_users(id) ON DELETE CASCADE,
      plan VARCHAR(50) NOT NULL DEFAULT 'trial',
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_auditx_licenses_user_id ON auditx_licenses(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_auditx_licenses_stripe_sub ON auditx_licenses(stripe_subscription_id)`,
  ];
  try {
    for (const stmt of statements) await sql(stmt);
    console.log('✅ Tables created: auditx_users, auditx_licenses');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
