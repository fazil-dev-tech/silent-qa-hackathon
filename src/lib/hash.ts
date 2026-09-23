export async function computeSHA256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function computeSHA256Sync(content: string): string {
  // For server-side Node.js usage
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}
