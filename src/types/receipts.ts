export type TransactionReceipt = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Supabase object path when stored remotely */
  storagePath?: string;
  /** Display URL (signed URL, blob URL, or data URL) */
  previewUrl: string;
  uploadedAt: string;
};
