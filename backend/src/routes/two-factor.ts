//Fastify route handlers for endpoints like /api/2fa/email/send and /api/2fa/email/verify.
//These routes should call functions from your twoFactorService.ts.

// bcrypt: To compare hashed passwords.
// jsonwebtoken (JWT): To issue access tokens after login.
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
} from '../services/twoFactorService';
// import { sendEmail } from '../sendEmail';
// import speakeasy from 'speakeasy'; // for TOTP

const prisma = new PrismaClient();

export async function twoFactorRoutes(fastify: FastifyInstance) 
{
  // ===============================
  // Disable 2FA for a user
  // ===============================
  fastify.post('/api/2fa/disable', async (request, reply) => 
  {
      try 
      {
        const { userId, password } = request.body as { userId: number; password: string };

        // look up for user by ID
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) 
          return reply.status(404).send({ error: 'User not found' });

        // validate user password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) 
          return reply.status(400).send({ error: 'Invalid password' });

        // disable 2FA
        // clear any existing 2FA code info
        await prisma.user.update(
        {
          where: { id: userId },
          data: {
            isTwoFactorEnabled: false,
            twoFactorCode: null,
            twoFactorCodeExpires: null,
            twoFactorSecret: null,
            twoFactorEnabledAt: null,
            twoFactorType: null}
        });
        return reply.send({ message: '2FA successfully disabled' });
      } catch (error) 
      {
        console.error('2FA disable error:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
  });

  // ===============================
  // Login endpoint (with 2FA check)
  // ===============================
  fastify.post('/api/2fa/login', async (request, reply) => 
  {
    try 
    {
      const { username, password, twoFactorCode } = request.body as {
        username: string;
        password: string;
        twoFactorCode: string;
      };

      // Find user by username
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) 
        return reply.status(400).send({ error: 'Invalid credentials' });

      // Validate password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) 
        return reply.status(400).send({ error: 'Invalid credentials' });

      // If 2FA is enabled -> validate the code
      if (user.isTwoFactorEnabled) 
      {
        if (user.twoFactorType === 'email') 
        {
          if (!user.twoFactorCode || !user.twoFactorCodeExpires) 
          {
            return reply.status(400).send({ error: '2FA code not requested' });
          }
          
          //store the current time -> check if expire
          const now = new Date();

          // check if code match
          // check if code not expired
          if (user.twoFactorCode !== twoFactorCode || user.twoFactorCodeExpires < now) 
          {
            return reply.status(400).send({ error: 'Invalid or expired 2FA code' });
          }

          // Clear code after successful login
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorCode: null, twoFactorCodeExpires: null }
          });
        } 
        else if (user.twoFactorType === 'totp') 
        {
          if (!user.twoFactorSecret) 
            return reply.status(400).send({ error: '2FA secret missing' });

          const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: twoFactorCode,
            window: 1
          });

          if (!verified)
            return reply.status(400).send({ error: 'Invalid TOTP code' });
          // else
          //   return reply.status(400).send({ error: '2FA type not set' });
        }
      }

      // Generate JWT token for session
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '24h' }
      );

      // Respond with token and user info
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
    } catch (error) 
    {
      console.error('2FA login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Send 2FA code (email or TOTP)
  // ===============================
  fastify.post('/api/2fa/send', async (request, reply) => 
  {
    try 
    {
      const { userId } = request.body as { userId: number };

      // Fetch user by ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      if (user.twoFactorType === 'email') 
      {
        // Use service to generate code
        const code = await generateEmailCode();
        // Set code expiration (5 minutes from now)
        const expires = new Date(Date.now() + 5 * 60 * 1000);
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorCode: code, twoFactorCodeExpires: expires }
        });
        await send2FACodeEmail(user.email, code);
      } else if (user.twoFactorType === 'totp') {
          if (!user.twoFactorSecret) 
            return reply.status(400).send({ error: '2FA secret missing' });
          // For TOTP, do not send code via email; just confirm secret exists
          return reply.send({ message: 'TOTP is enabled. Use your authenticator app.' });
      } else 
      {
        return reply.status(400).send({ error: '2FA type not set' });
      }
      return reply.send({ message: '2FA code sent to your email.' });
    } catch (error) 
    {
      console.error('2FA send error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Verify email 2FA code (for enabling email 2FA)
  // ===============================
  fastify.post('/api/2fa/email/verify', async (request, reply) => 
  {
    try 
    {
      const { userId, code } = request.body as { userId: number; code: string };
      
      // Fetch user and ensure a code exists
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.twoFactorCode || !user.twoFactorCodeExpires)
        return reply.status(400).send({ error: '2FA not requested or expired' });
      
      //store current time stamp
      const now = new Date();
      
      // Check if the code matches and is within the expiration window
      if (user.twoFactorCode !== code || user.twoFactorCodeExpires < now)
        return reply.status(400).send({ error: 'Invalid or expired code' });

      // Enable 2FA and clear stored code
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true,
          twoFactorCode: null,
          twoFactorCodeExpires: null,
          twoFactorEnabledAt: new Date(),
          twoFactorType: 'email'}
      });
      return reply.send({ message: '2FA enabled successfully (email)' });
    } catch (error) 
    {
      console.error('2FA email verify error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Setup TOTP (authenticator app) for a user
  // ===============================
  fastify.post('/api/2fa/totp/setup', async (request, reply) => 
  {
    try {
      const { userId } = request.body as { userId: number };

      // Fetch user by ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      // Generate a new secret for TOTP using service
      const secretObj = await generateTOTPSecret(user.username);
      
      // Store the secret in the user's record
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secretObj.base32 }
      });
      // Respond with the otpauth URL and secret
      return reply.send({ otpauth_url: secretObj.otpauth_url, secret: secretObj.base32 });
    } catch (error) 
    {
      console.error('TOTP setup error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ===============================
  // Verify TOTP code and enable TOTP 2FA
  // ===============================
  fastify.post('/api/2fa/totp/verify', async (request, reply) => 
  {
    try {
      const { userId, code } = request.body as { userId: number; code: string };

      // Fetch user by ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.twoFactorSecret)
        return reply.status(400).send({ error: 'TOTP not set up' });

      // Verify the TOTP code using service
      const verified = await verifyTOTPCode(user.twoFactorSecret, code);
      if (!verified)
        return reply.status(400).send({ error: 'Invalid TOTP code' });

      // Enable 2FA and set the type to TOTP
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true,
          twoFactorEnabledAt: new Date(),
          twoFactorType: 'totp'}
      });
      return reply.send({ message: '2FA enabled successfully (TOTP)' });
    } catch (error) 
    {
      console.error('TOTP verify error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
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
*/