import { apiError, apiSuccess } from '@/lib/server/api-response';
import { getTokenFromRequest, verifyToken } from '@/lib/server/auth-utils';
import { updateUser } from '@/lib/server/user-store';

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return apiError('INVALID_REQUEST', 401, 'Not authenticated');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return apiError('INVALID_REQUEST', 401, 'Invalid or expired token');
  }

  let body: { avatar?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 400, 'Invalid JSON body');
  }

  const { avatar } = body;

  if (!avatar || typeof avatar !== 'string') {
    return apiError('INVALID_REQUEST', 400, 'Avatar is required');
  }

  const isPredefined = avatar.startsWith('/avatars/');
  const isDataUrl = avatar.startsWith('data:image/');

  if (!isPredefined && !isDataUrl) {
    return apiError('INVALID_REQUEST', 400, 'Invalid avatar format');
  }

  const updated = await updateUser(payload.email, { avatar });
  if (!updated) {
    return apiError('INVALID_REQUEST', 404, 'User not found');
  }

  return apiSuccess({ avatar: updated.avatar });
}
