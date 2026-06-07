import { apiError, apiSuccess } from '@/lib/server/api-response';
import { getUserByEmailWithPassword } from '@/lib/server/user-store';
import { verifyPassword, createToken } from '@/lib/server/auth-utils';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  const { email, password } = body;

  if (!email || !email.trim()) {
    return apiError('INVALID_REQUEST', 400, 'Email is required');
  }

  if (!password) {
    return apiError('INVALID_REQUEST', 400, 'Password is required');
  }

  const emailTrimmed = email.trim().toLowerCase();
  const user = await getUserByEmailWithPassword(emailTrimmed);

  if (!user) {
    return apiError('INVALID_REQUEST', 401, 'Invalid email or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return apiError('INVALID_REQUEST', 401, 'Invalid email or password');
  }

  const token = await createToken({ email: user.email });

  const response = apiSuccess({
    token,
    user: {
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
    },
  });

  const isSecure = request.headers.get('x-forwarded-proto') === 'https'
    || request.url.startsWith('https://');

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: isSecure,
  });

  return response;
}
