import { PgBoss } from 'pg-boss';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL not found in .env');
}

/**
 * Background job queue. pg-boss stores jobs in Postgres (schema `pgboss`),
 * so jobs survive restarts without needing Redis.
 */
export const boss = new PgBoss(connectionString);

boss.on('error', (error) => console.error('[Queue] error:', error));

export const startQueue = async () => {
  await boss.start();
  console.log('Job queue started');
};

/** Waits up to `timeoutMs` for running jobs to finish before closing. */
export const stopQueue = async (timeoutMs = 20_000) => {
  await boss.stop({ graceful: true, timeout: timeoutMs });
};
