import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET || process.env.ACCESS_CODE || 'learn-genie-default-secret';
  return new TextEncoder().encode(secret);
}

/** Convert string to Uint8Array */
function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert ArrayBuffer to hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verify an HMAC-signed token using Web Crypto API (Edge-compatible) */
async function verifyAccessToken(token: string, accessCode: string): Promise<boolean> {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const keyData = encode(accessCode);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const data = encode(timestamp);
  const expected = bufToHex(await crypto.subtle.sign('HMAC', key, data.buffer as ArrayBuffer));

  if (signature.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyJwt(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

function getJwtFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('auth_token')?.value ?? null;
}

const PUBLIC_PAGE_PATHS = ['/', '/login', '/register'];
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/access-code/',
  '/api/health',
];
const PROTECTED_PAGE_PREFIXES = [
  '/generate',
  '/profile',
  '/bookshelf',
  '/wrong-questions',
  '/classroom',
  '/generation-preview',
  '/knowledge',
  '/document-viewer',
];

function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_PAGE_PATHS.includes(pathname)) return false;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (PROTECTED_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Other paths (static files, etc.) are public
  return false;
}

export async function middleware(request: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;
  const { pathname } = request.nextUrl;

  // --- ACCESS_CODE check (existing logic) ---
  if (accessCode) {
    const isAccessCodeWhitelisted =
      pathname.startsWith('/api/access-code/') || pathname === '/api/health';

    if (!isAccessCodeWhitelisted) {
      const cookie = request.cookies.get('openmaic_access');
      if (!cookie?.value || !(await verifyAccessToken(cookie.value, accessCode))) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, errorCode: 'INVALID_REQUEST', error: 'Access code required' },
            { status: 401 },
          );
        }
        // Page requests → let through, frontend shows modal
      }
    }
  }

  // --- JWT auth check ---
  if (isProtectedPath(pathname)) {
    const jwtToken = getJwtFromRequest(request);
    const jwtValid = await verifyJwt(jwtToken ?? '');

    if (!jwtValid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, errorCode: 'INVALID_REQUEST', error: 'Not authenticated' },
          { status: 401 },
        );
      }
      // Redirect page requests to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos/).*)'],
};
