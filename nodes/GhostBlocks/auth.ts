// Ghost Admin API JWT generation using ONLY node:crypto.
// (jsonwebtoken is not allowed in n8n verified community nodes.)

import * as crypto from 'node:crypto';

export function generateGhostJwt(adminKey: string): string {
  const parts = adminKey.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Admin API key must be in format {id}:{hex_secret}');
  }
  const keyId = parts[0];
  const secret = Buffer.from(parts[1], 'hex');

  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'HS256', typ: 'JWT', kid: keyId };
  const payload = { iat: now, exp: now + 300, aud: '/admin/' };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64url');

  return `${message}.${signature}`;
}

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}
