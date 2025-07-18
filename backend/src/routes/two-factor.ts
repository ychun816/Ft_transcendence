import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function twoFactorRoutes(fastify: FastifyInstance) {
  // Generate 2FA setup (QR code)
  fastify.post('/api/2fa/setup', async (request, reply) => {
    try {
      const { userId } = request.body as { userId: number };
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      if (user.isTwoFactorEnabled) {
        return reply.status(400).send({ error: '2FA is already enabled' });
      }
      
      // Generate secret for the user
      const secret = speakeasy.generateSecret({
        name: `Transcendence (${user.username})`,
        issuer: 'Transcendence',
        length: 32
      });
      
      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
      
      // Store secret temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret.base32
        }
      });
      
      return reply.send({
        qrCode: qrCodeUrl,
        secret: secret.base32,
        manualEntryCode: secret.base32
      });
      
    } catch (error) {
      console.error('2FA setup error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Verify and enable 2FA
  fastify.post('/api/2fa/verify', async (request, reply) => {
    try {
      const { userId, token } = request.body as { userId: number; token: string };
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user || !user.twoFactorSecret) {
        return reply.status(404).send({ error: 'User not found or 2FA not set up' });
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 1 step tolerance
      });
      
      if (!verified) {
        return reply.status(400).send({ error: 'Invalid verification code' });
      }
      
      // Enable 2FA for the user
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true,
          twoFactorEnabledAt: new Date()
        }
      });
      
      return reply.send({ message: '2FA enabled successfully' });
      
    } catch (error) {
      console.error('2FA verification error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Disable 2FA
  fastify.post('/api/2fa/disable', async (request, reply) => {
    try {
      const { userId, password } = request.body as { userId: number; password: string };
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(400).send({ error: 'Invalid password' });
      }
      
      // Disable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorEnabledAt: null
        }
      });
      
      return reply.send({ message: '2FA disabled successfully' });
      
    } catch (error) {
      console.error('2FA disable error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Login with 2FA
  fastify.post('/api/2fa/login', async (request, reply) => {
    try {
      const { username, password, twoFactorCode } = request.body as {
        username: string;
        password: string;
        twoFactorCode: string;
      };
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!user) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }
      
      // If 2FA is enabled, verify the code
      if (user.isTwoFactorEnabled && user.twoFactorSecret) {
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 1
        });
        
        if (!verified) {
          return reply.status(400).send({ error: 'Invalid 2FA code' });
        }
      }
      
      // Generate JWT token
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
}
