export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export const RECEIPT_LIMITS = {
  free: {
    maxFiles: 2,
    maxFileBytes: 2 * 1024 * 1024,
    maxTotalBytes: 5 * 1024 * 1024,
    ocr: false,
  },
  premium: {
    maxFiles: 10,
    maxFileBytes: 10 * 1024 * 1024,
    maxTotalBytes: 25 * 1024 * 1024,
    ocr: true,
  },
} as const;

export function getReceiptLimits(premium: boolean) {
  return premium ? RECEIPT_LIMITS.premium : RECEIPT_LIMITS.free;
}
