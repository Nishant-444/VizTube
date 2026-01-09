import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
// console.log(connectionString);

if (!connectionString) {
  throw new Error('DATABASE_URL not found in .env');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
