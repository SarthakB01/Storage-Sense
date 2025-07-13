import { PrismaClient } from "@prisma/client"

/**
 * Global database instance with connection pooling
 */
declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

/**
 * Graceful database disconnect
 */
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect()
}
