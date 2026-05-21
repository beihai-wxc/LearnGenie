import { apiError, apiSuccess } from '@/lib/server/api-response';
import { createUser, getUserByEmail } from '@/lib/server/user-store';
import { hashPassword } from '@/lib/server/auth-utils';

export async function POST(request: Request) {
  let body: { email?: string; password?: string; nickname?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  const { email, password, nickname } = body;

  if (!email || !email.includes('@')) {
    return apiError('INVALID_REQUEST', 400, 'Please enter a valid email address');
  }

  if (!password || password.length < 6) {
    return apiError('INVALID_REQUEST', 400, 'Password must be at least 6 characters');
  }

  const emailTrimmed = email.trim().toLowerCase();

  const existing = await getUserByEmail(emailTrimmed);
  if (existing) {
    return apiError('INVALID_REQUEST', 409, 'This email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const displayName = nickname?.trim() || emailTrimmed.split('@')[0];

  await createUser({
    email: emailTrimmed,
    passwordHash,
    nickname: displayName,
    avatar: '/avatars/user.png',
    createdAt: now,
    updatedAt: now,
  });

  return apiSuccess({ message: 'Registration successful' }, 201);
}
