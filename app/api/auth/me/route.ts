import { apiError, apiSuccess } from '@/lib/server/api-response';
import { getTokenFromRequest, verifyToken } from '@/lib/server/auth-utils';
import { getUserByPhone } from '@/lib/server/user-store';

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return apiError('INVALID_REQUEST', 401, 'Not authenticated');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return apiError('INVALID_REQUEST', 401, 'Invalid or expired token');
  }

  const user = await getUserByPhone(payload.phone);
  if (!user) {
    return apiError('INVALID_REQUEST', 401, 'User not found');
  }

  return apiSuccess({
    user: {
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
}
