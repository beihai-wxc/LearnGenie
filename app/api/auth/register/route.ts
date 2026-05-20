import { apiError, apiSuccess } from '@/lib/server/api-response';
import { createUser, getUserByPhone } from '@/lib/server/user-store';
import { hashPassword } from '@/lib/server/auth-utils';

export async function POST(request: Request) {
  let body: { phone?: string; password?: string; nickname?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  const { phone, password, nickname } = body;

  if (!phone || phone.trim().length < 5 || phone.trim().length > 20) {
    return apiError('INVALID_REQUEST', 400, 'Phone number must be 5-20 characters');
  }

  if (!password || password.length < 6) {
    return apiError('INVALID_REQUEST', 400, 'Password must be at least 6 characters');
  }

  const phoneTrimmed = phone.trim();

  const existing = await getUserByPhone(phoneTrimmed);
  if (existing) {
    return apiError('INVALID_REQUEST', 409, 'Phone number already registered');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const displayName = nickname?.trim() || `User${phoneTrimmed.slice(-4)}`;

  await createUser({
    phone: phoneTrimmed,
    passwordHash,
    nickname: displayName,
    avatar: '/avatars/user.png',
    createdAt: now,
    updatedAt: now,
  });

  return apiSuccess({ message: 'Registration successful' }, 201);
}
