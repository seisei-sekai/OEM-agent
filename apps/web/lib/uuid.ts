/**
 * Generate UUID that works in both secure (HTTPS) and non-secure (HTTP) contexts
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID if available (HTTPS/secure context)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to polyfill
    }
  }

  // Fallback for HTTP or older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

