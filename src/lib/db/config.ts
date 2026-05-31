/** Server-side MongoDB availability */
export const hasMongoDB = Boolean(process.env.MONGODB_URI?.trim());

/**
 * Client-visible flag — set NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true when MongoDB is configured.
 * All signed-in user data syncs through /api/sync/pull and /api/sync/push.
 */
export const hasCloudDataSync =
  process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === "true" || hasMongoDB;

export function isCloudSyncAvailable() {
  return hasMongoDB;
}
