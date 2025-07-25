import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  generateEmailCode,
  verifyEmailCode,
  generateTOTPSecret,
  verifyTOTPCode,
  send2FACodeEmail 
} from '../services/TwoFactorService';

// Only one exported function for all 2FA routes!
export async function twoFactorRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  // ===============================
  // Disable 2FA for a user
  // ===============================
  fastify.post('/api/2fa/disable', async (request, reply) => {
    try {
      const { userId, password } = request.body as { userId: number; password: string };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) 
        return reply.status(404).send({ error: 'User not found' });

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) 
        return reply.status(400).send({ error: 'Invalid password' });

      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: false,
          twoFactorCode: null,
          twoFactorCodeExpires: null,
          twoFactorSecret: null,
          twoFactorEnabledAt: null,
          twoFactorType: null
        }
      });
      return reply.send({ message: '2FA successfully disabled' });
    } catch (error) {
      console.error('2FA disable error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Login endpoint (with 2FA check)
  // ===============================
  fastify.post('/api/2fa/login', async (request, reply) => {
    try {
      const { username, password, twoFactorCode } = request.body as {
        username: string;
        password: string;
        twoFactorCode: string;
      };

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) 
        return reply.status(400).send({ error: 'Invalid credentials' });

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) 
        return reply.status(400).send({ error: 'Invalid credentials' });

      if (user.isTwoFactorEnabled) {
        if (user.twoFactorType === 'email') {
          if (!user.twoFactorCode || !user.twoFactorCodeExpires) 
            return reply.status(400).send({ error: '2FA code not requested' });

          const now = new Date();
          if (user.twoFactorCode !== twoFactorCode || user.twoFactorCodeExpires < now) 
            return reply.status(400).send({ error: 'Invalid or expired 2FA code' });

          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorCode: null, twoFactorCodeExpires: null }
          });
        } else if (user.twoFactorType === 'totp') {
          if (!user.twoFactorSecret) 
            return reply.status(400).send({ error: '2FA secret missing' });

          const verified = verifyTOTPCode(user.twoFactorSecret, twoFactorCode);
          if (!verified)
            return reply.status(400).send({ error: 'Invalid TOTP code' });
        }
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.COOKIE_SECRET || 'secret-key',
        { expiresIn: '24h' }
      );

      return reply.send({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          twoFactorType: user.twoFactorType
        }
      });
    } catch (error) {
      console.error('2FA login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Send 2FA code (email or TOTP)
  // ===============================
  fastify.post('/api/2fa/send', async (request, reply) => {
    try {
      const { userId } = request.body as { userId: number };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return reply.status(404).send({ error: 'User not found' });

      if (user.twoFactorType === 'email') {
        const code = await generateEmailCode();
        const expires = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorCode: code, twoFactorCodeExpires: expires }
        });
        await send2FACodeEmail(user.email, code);
      } else if (user.twoFactorType === 'totp') {
        if (!user.twoFactorSecret)
          return reply.status(400).send({ error: '2FA secret missing' });
        return reply.send({ message: 'TOTP is enabled. Use your authenticator app.' });
      } else {
        return reply.status(400).send({ error: '2FA type not set' });
      }
      return reply.send({ message: '2FA code sent to your email.' });
    } catch (error) {
      console.error('2FA send error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Verify email 2FA code (for enabling email 2FA)
  // ===============================
  fastify.post('/api/2fa/email/verify', async (request, reply) => {
    try {
      const { userId, code } = request.body as { userId: number; code: string };
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.twoFactorCode || !user.twoFactorCodeExpires)
        return reply.status(400).send({ error: '2FA not requested or expired' });

      const now = new Date();
      if (user.twoFactorCode !== code || user.twoFactorCodeExpires < now)
        return reply.status(400).send({ error: 'Invalid or expired code' });

      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true,
          twoFactorCode: null,
          twoFactorCodeExpires: null,
          twoFactorEnabledAt: new Date(),
          twoFactorType: 'email'
        }
      });
      return reply.send({ message: '2FA enabled successfully (email)' });
    } catch (error) {
      console.error('2FA email verify error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Setup TOTP (authenticator app) for a user
  // ===============================
  fastify.post('/api/2fa/totp/setup', async (request, reply) => {
    try {
      const { userId } = request.body as { userId: number };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return reply.status(404).send({ error: 'User not found' });

      const secretObj = await generateTOTPSecret(user.username);
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secretObj.base32 }
      });
      return reply.send({ otpauth_url: secretObj.otpauth_url, secret: secretObj.base32 });
    } catch (error) {
      console.error('TOTP setup error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Verify TOTP code and enable TOTP 2FA
  // ===============================
  fastify.post('/api/2fa/totp/verify', async (request, reply) => {
    try {
      const { userId, code } = request.body as { userId: number; code: string };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.twoFactorSecret)
        return reply.status(400).send({ error: 'TOTP not set up' });

      const verified = await verifyTOTPCode(user.twoFactorSecret, code);
      if (!verified)
        return reply.status(400).send({ error: 'Invalid TOTP code' });

      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true,
          twoFactorEnabledAt: new Date(),
          twoFactorType: 'totp'
        }
      });
      return reply.send({ message: '2FA enabled successfully (TOTP)' });
    } catch (error) {
      console.error('TOTP verify error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // 2FA verification for login challenge (frontend expects this)
  // ===============================
  fastify.post('/api/2fa/verify', async (request, reply) => {
    try {
      const { username, code } = request.body as { username: string; code: string };
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !user.isTwoFactorEnabled) {
        return reply.status(400).send({ success: false, message: "2FA not enabled" });
      }

      if (user.twoFactorType === 'email') {
        if (!user.twoFactorCode || !user.twoFactorCodeExpires) {
          return reply.status(400).send({ success: false, message: "2FA code not requested" });
        }
        const now = new Date();
        if (user.twoFactorCode !== code || user.twoFactorCodeExpires < now) {
          return reply.status(400).send({ success: false, message: "Invalid or expired 2FA code" });
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorCode: null, twoFactorCodeExpires: null }
        });
      } else if (user.twoFactorType === 'totp') {
        if (!user.twoFactorSecret) {
          return reply.status(400).send({ success: false, message: "2FA secret missing" });
        }
        const verified = verifyTOTPCode(user.twoFactorSecret, code);
        if (!verified) {
          return reply.status(400).send({ success: false, message: "Invalid TOTP code" });
        }
      } else {
        return reply.status(400).send({ success: false, message: "2FA type not set" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.COOKIE_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

      return reply.send({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          twoFactorType: user.twoFactorType
        }
      });
    } catch (error) {
      console.error('2FA verify error:', error);
      return reply.status(500).send({ success: false, message: 'Internal server error' });
    }
  });
}

/*
| Endpoint                     | Purpose                          |
| ---------------------------- | -------------------------------- |
| `POST /api/2fa/disable`      | Disable 2FA after password check |
| `POST /api/2fa/login`        | Login and validate 2FA code      |
| `POST /api/2fa/send`         | Send a 2FA code (email or TOTP)  |
| `POST /api/2fa/email/verify` | Verify email code and enable 2FA |
| `POST /api/2fa/totp/setup`   | Setup TOTP for 2FA               |
| `POST /api/2fa/totp/verify`  | Verify TOTP code and enable 2FA  |
| `POST /api/2fa/verify`       | 2FA login challenge (frontend)   |


If you use request.params in any route, add a similar type assertion:
const params = request.params as { id: string };
*/