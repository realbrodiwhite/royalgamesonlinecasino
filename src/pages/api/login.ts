import type { NextApiRequest, NextApiResponse } from 'next';
import { compare } from 'bcrypt';
import { z } from 'zod';
import { withRateLimit } from '../../middleware/rateLimit';
import { prisma } from '../../lib/prisma';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

// Validation schema
const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(email => email.toLowerCase()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
});

// Device fingerprinting (same as register endpoint)
const getDeviceFingerprint = (req: NextApiRequest): string => {
  const ua = new UAParser(req.headers['user-agent']);
  const browser = ua.getBrowser();
  const os = ua.getOS();
  const device = ua.getDevice();

  const fingerprint = {
    browser: `${browser.name || ''}${browser.version || ''}`,
    os: `${os.name || ''}${os.version || ''}`,
    device: `${device.vendor || ''}${device.model || ''}`,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    acceptLanguage: req.headers['accept-language'],
  };

  return crypto.createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const deviceFingerprint = getDeviceFingerprint(req);
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                   req.socket.remoteAddress || 
                   'unknown';

  try {
    const validationResult = LoginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationResult.error.errors 
      });
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      await prisma.log.create({
        data: {
          email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          eventType: 'login',
          success: false,
          errorMessage: 'User not found'
        }
      });

      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockUntil && user.lockUntil > new Date()) {
      await prisma.log.create({
        data: {
          userId: user.id,
          email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          eventType: 'login',
          success: false,
          errorMessage: 'Account locked'
        }
      });

      return res.status(423).json({
        message: 'Account is locked. Please try again later.'
      });
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: {
            increment: 1
          },
          lastFailedLogin: new Date(),
          // Lock account after 5 failed attempts
          accountLocked: user.failedLoginAttempts >= 4,
          lockUntil: user.failedLoginAttempts >= 4 
            ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
            : null
        }
      });

      await prisma.log.create({
        data: {
          userId: user.id,
          email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          eventType: 'login',
          success: false,
          errorMessage: 'Invalid password'
        }
      });

      if (updatedUser.accountLocked) {
        return res.status(423).json({
          message: 'Account has been locked due to too many failed attempts. Please try again later.'
        });
      }

      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLocked: false,
        lockUntil: null,
        lastLogin: new Date(),
        deviceFingerprint
      }
    });

    // Log successful login
    await prisma.log.create({
      data: {
        userId: user.id,
        email,
        ipAddress,
        userAgent: req.headers['user-agent'] || 'unknown',
        deviceFingerprint,
        eventType: 'login',
        success: true
      }
    });

    // Return user data (excluding sensitive fields)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance,
      lastLogin: user.lastLogin
    };

    return res.status(200).json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);

    // Log error
    if (req.body?.email) {
      await prisma.log.create({
        data: {
          email: req.body.email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          eventType: 'login',
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    return res.status(500).json({ 
      message: 'Login failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

// Apply rate limiting to the login endpoint
export default withRateLimit(handler, {
  limit: 5, // 5 attempts
  windowSeconds: 60 * 15 // 15 minute window
});
