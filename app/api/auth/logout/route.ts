import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/server/api-response';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return apiSuccess({ message: 'Logged out' });
}
