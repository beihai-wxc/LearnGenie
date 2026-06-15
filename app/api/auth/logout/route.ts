import { apiSuccess } from '@/lib/server/api-response';

export async function POST() {
  const response = apiSuccess({ message: 'Logged out' });

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
