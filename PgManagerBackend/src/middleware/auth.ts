import { Context, Next } from 'hono';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
  const token = extractTokenFromHeader(c.req.header('authorization'));

  if (!token) {
    return c.json({ message: 'No token provided' }, 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return c.json({ message: 'Invalid token' }, 401);
  }

  c.set('userId', decoded.id);
  c.set('user', decoded);

  await next();
};
