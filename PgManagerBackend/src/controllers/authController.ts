import { Context } from 'hono';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export const setup = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { phoneNumber, pgName, name } = body;

    if (!phoneNumber || !pgName) {
      return c.json({ message: 'Phone number and PG name are required' }, 400);
    }

    const result = await authService.setup(phoneNumber, pgName, name);
    return c.json(result);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return c.json({ message: 'Phone number and code are required' }, 400);
    }

    const result = await authService.login(phoneNumber, code);
    return c.json(result);
  } catch (error: any) {
    return c.json({ message: error.message }, 401);
  }
};

export const getMe = async (c: Context) => {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const user = await authService.getUser(userId);
    return c.json(user);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const updateProfile = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { pgName, name, phoneNumber } = body;

    if (!userId) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const user = await authService.updateProfile(userId, { pgName, name, phoneNumber });
    return c.json(user);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const deleteProfile = async (c: Context) => {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const result = await authService.deleteProfile(userId);
    return c.json(result);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};
