import { PrismaClient } from '@prisma/client';

/**
 * Fintrack — Prisma Client Singleton
 *
 * Requirements:
 * - Prevents instantiating multiple PrismaClient connections during Next.js App Router hot reloads.
 * - Restricts execution strictly to server-side environments.
 * - Does not perform queries or connect to live databases at module evaluation time.
 */

// Runtime guard ensuring this module is never bundled or executed on the client
if (typeof window !== 'undefined') {
  throw new Error('Prisma Client can only be imported in server-side contexts.');
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
