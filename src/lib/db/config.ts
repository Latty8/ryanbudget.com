/** Server-side MongoDB availability (read at call time, not build time). */
export function isMongoDBConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

/** @deprecated Use isMongoDBConfigured() — kept for gradual migration */
export const hasMongoDB = isMongoDBConfigured();

/**
 * Client-visible flag — set NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true when MongoDB is configured.
 * All signed-in user data syncs through /api/sync/pull and /api/sync/push.
 */
export function isCloudDataSyncEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === "true" || isMongoDBConfigured();
}

export const hasCloudDataSync = isCloudDataSyncEnabled();

export function isCloudSyncAvailable() {
  return isMongoDBConfigured();
}
