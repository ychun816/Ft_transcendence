//Fastify route handlers for endpoints like /api/2fa/email/send and /api/2fa/email/verify.
//These routes should call functions from your twoFactorService.ts.

// bcrypt: To compare hashed passwords.
// jsonwebtoken (JWT): To issue access tokens after login.
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function twoFactorRoutes(fastify: FastifyInstance) {
  // Disable 2FA
  fastify.post('/api/2fa/disable', async (request, reply) => {
    try {
      const { userId, password } = request.body as { userId: number; password: string };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(400).send({ error: 'Invalid password' });
      }
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: false,
          twoFactorCode: null,
          twoFactorCodeExpires: null,
          twoFactorEnabledAt: null
        }
      });
      return reply.send({ message: '2FA disabled successfully' });
    } catch (error) {
      console.error('2FA disable error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login with 2FA (email code only)
  fastify.post('/api/2fa/login', async (request, reply) => {
    try {
      const { username, password, twoFactorCode } = request.body as {
        username: string;
        password: string;
        twoFactorCode: string;
      };
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }
      if (user.isTwoFactorEnabled) {
        if (!user.twoFactorCode || !user.twoFactorCodeExpires) {
          return reply.status(400).send({ error: '2FA code not requested' });
        }
        const now = new Date();
        if (user.twoFactorCode !== twoFactorCode || user.twoFactorCodeExpires < now) {
          return reply.status(400).send({ error: 'Invalid or expired 2FA code' });
        }
        // Clear code after successful login
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorCode: null, twoFactorCodeExpires: null }
        });
      }
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      return reply.send({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isTwoFactorEnabled: user.isTwoFactorEnabled
        }
      });
    } catch (error) {
      console.error('2FA login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Send 2FA code by email
  fastify.post('/api/2fa/email/send', async (request, reply) => {
    try {
      const { userId } = request.body as { userId: number };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorCode: code, twoFactorCodeExpires: expires }
      });
      // TODO: Send code by email (use nodemailer or your email util)
      // Example: await sendEmail(user.email, 'Your 2FA code', `Your code is: ${code}`);
      return reply.send({ message: '2FA code sent to your email.' });
    } catch (error) {
      console.error('2FA email send error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Verify 2FA code from email
  fastify.post('/api/2fa/email/verify', async (request, reply) => {
    try {
      const { userId, code } = request.body as { userId: number; code: string };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.twoFactorCode || !user.twoFactorCodeExpires) {
        return reply.status(400).send({ error: '2FA not requested or expired' });
      }
      const now = new Date();
      if (user.twoFactorCode !== code || user.twoFactorCodeExpires < now) {
        return reply.status(400).send({ error: 'Invalid or expired code' });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { isTwoFactorEnabled: true, twoFactorCode: null, twoFactorCodeExpires: null, twoFactorEnabledAt: new Date() }
      });
      return reply.send({ message: '2FA enabled successfully' });
    } catch (error) {
      console.error('2FA email verify error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
