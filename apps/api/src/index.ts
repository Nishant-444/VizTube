import dotenv from 'dotenv';
import { app } from './app.js';
import { prisma } from './lib/prisma.js';
import { startQueue, stopQueue } from './lib/queue.js';
import { setupIngestQueue } from './jobs/ingest.job.js';

dotenv.config({
  path: './.env',
});

const PORT = process.env.PORT || 3000;

try {
  await prisma.$connect();
  console.log('Database connected');

  await startQueue();
  await setupIngestQueue();
} catch (err) {
  console.error('Failed to start', err);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running at port : ${PORT}`);
});

// finish in-flight requests and jobs before exiting
let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  // hard stop if something hangs
  setTimeout(() => process.exit(1), 30_000).unref();

  server.close();
  try {
    await stopQueue();
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
