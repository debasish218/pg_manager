import { PrismaClient } from '@prisma/client';
import { generateTOTPSecret, verifyTOTPCode } from '../utils/totp';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

export class AuthService {
  async setup(phoneNumber: string, pgName: string, name?: string) {
    try {
      const { secret, qrCodeUri } = generateTOTPSecret(phoneNumber);

      let user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phoneNumber,
            pgName,
            name,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { phoneNumber },
          data: { pgName, name },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: secret },
      });

      return { secret, qrCodeUri };
    } catch (error) {
      throw error;
    }
  }

  async login(phoneNumber: string, code: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.totpSecret) {
        throw new Error('2FA not set up for this user');
      }

      const isValid = verifyTOTPCode(user.totpSecret, code);
      if (!isValid) {
        throw new Error('Invalid TOTP code');
      }

      const token = generateToken({
        id: user.id,
        phoneNumber: user.phoneNumber || undefined,
        email: user.email || undefined,
        pgName: user.pgName,
        name: user.name || undefined,
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          pgName: user.pgName,
          role: user.role,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getUser(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        pgName: user.pgName,
        role: user.role,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userId: number, data: { pgName?: string; name?: string; phoneNumber?: string }) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        pgName: user.pgName,
        role: user.role,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteProfile(userId: number) {
    try {
      // Delete all tenants
      await prisma.tenant.deleteMany({
        where: { userId },
      });

      // Delete all rooms
      await prisma.room.deleteMany({
        where: { userId },
      });

      // Delete user
      await prisma.user.delete({
        where: { id: userId },
      });

      return { message: 'Profile deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}
