import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 12;

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET || process.env.ACCESS_CODE || 'learn-genie-default-secret';
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export async function createToken(payload: { email: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { email: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/);
    if (match) return match[1];
  }
  return null;
}

export function getJwtSecretKey() {
  return getJwtSecret();
}
