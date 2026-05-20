import { cookies } from 'next/headers';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { getUserByPhoneWithPassword } from '@/lib/server/user-store';
import { verifyPassword, createToken } from '@/lib/server/auth-utils';

export async function POST(request: Request) {
  let body: { phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  const { phone, password } = body;

  if (!phone || !phone.trim()) {
    return apiError('INVALID_REQUEST', 400, 'Phone number is required');
  }

  if (!password) {
    return apiError('INVALID_REQUEST', 400, 'Password is required');
  }

  const phoneTrimmed = phone.trim();
  const user = await getUserByPhoneWithPassword(phoneTrimmed);

  if (!user) {
    return apiError('INVALID_REQUEST', 401, 'Invalid phone number or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return apiError('INVALID_REQUEST', 401, 'Invalid phone number or password');
  }

  const token = await createToken({ phone: user.phone });

  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });

  return apiSuccess({
    token,
    user: {
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
    },
  });
}
