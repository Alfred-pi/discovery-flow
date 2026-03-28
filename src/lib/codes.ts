// Client access codes — stored as SHA-256 hashes
// To add a code: hash it with sha256(code.toUpperCase()) and add to the map
// Value = client name (shown after verification)

const CODE_HASHES: Record<string, string> = {
  // BLUE47 → test code
  '3aa9ed9c77239b848585634d8981b6af8ec6e93ecb1fa08f22979f4bb6988d8c': 'Test Client',
};

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyCode(code: string): Promise<{ valid: boolean; client: string }> {
  const hash = await sha256(code.toUpperCase());
  const client = CODE_HASHES[hash];
  
  if (client) {
    return { valid: true, client };
  }
  
  return { valid: false, client: '' };
}

// Helper: generate hash for a new code (run in browser console)
// await sha256('NEWCODE') → paste hash into CODE_HASHES
export { sha256 };
