/** Client-safe cloud sync flag (no server secrets). */
export const hasCloudDataSync = process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === "true";
