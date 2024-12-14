import type { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcrypt';
import { z } from 'zod';
import { withRateLimit } from '../../middleware/rateLimit';
import { userPreferences } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

// Validation schema
const RegisterSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform(username => username.toLowerCase()),
  email: z.string()
    .email('Invalid email format')
    .transform(email => email.toLowerCase()),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  dateOfBirth: z.string()
    .transform((str: string) => new Date(str))
    .refine((date: Date) => {
      const age = (new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18;
    }, 'Must be at least 18 years old'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  verifyPassword: z.string()
}).refine((data) => data.password === data.verifyPassword, {
  message: "Passwords don't match",
  path: ["verifyPassword"],
});

// Check for common passwords
const isCommonPassword = async (password: string): Promise<boolean> => {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  // You would typically check against a database or API of common passwords
  const commonPasswordHashes = [
    'password123', '12345678', 'qwerty123', 'admin123'
  ].map(pwd => crypto.createHash('sha256').update(pwd).digest('hex'));
  
  return commonPasswordHashes.includes(hash);
};

// Device fingerprinting
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
    const validationResult = RegisterSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationResult.error.errors 
      });
    }

    const {
      username,
      email,
      phone,
      dateOfBirth,
      password
    } = validationResult.data;

    // Check for common passwords
    if (await isCommonPassword(password)) {
      return res.status(400).json({
        message: 'Password is too common. Please choose a stronger password.'
      });
    }

    // Check for suspicious registration patterns
    const recentRegistrations = await prisma.$transaction([
      // Check registrations from same device
      prisma.registrationLog.count({
        where: {
          deviceFingerprint,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      // Check registrations from same IP
      prisma.registrationLog.count({
        where: {
          ipAddress,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      // Check registrations with same email domain
      prisma.registrationLog.count({
        where: {
          email: { endsWith: `@${email.split('@')[1]}` },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const [deviceCount, ipCount, emailDomainCount] = recentRegistrations;

    if (deviceCount > 3 || ipCount > 5 || emailDomainCount > 10) {
      await prisma.registrationLog.create({
        data: {
          email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          success: false,
          errorMessage: 'Suspicious registration pattern detected'
        }
      });

      return res.status(400).json({
        message: 'Too many registration attempts. Please try again later.'
      });
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      await prisma.registrationLog.create({
        data: {
          email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          success: false,
          errorMessage: 'Username or email already exists'
        }
      });

      return res.status(409).json({ 
        message: 'Registration failed. Please try again with different credentials.'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password with increased rounds
    const hashedPassword = await hash(password, 12);

    // Create new user with verification token
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        dateOfBirth,
        password: hashedPassword,
        role: 'user',
        deviceFingerprint,
        verificationTokens: {
          create: {
            token: verificationToken,
            expires: tokenExpiry
          }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        createdAt: true
      }
    });

    // Log successful registration
    await prisma.registrationLog.create({
      data: {
        userId: newUser.id,
        email,
        ipAddress,
        userAgent: req.headers['user-agent'] || 'unknown',
        deviceFingerprint,
        success: true
      }
    });

    // Store initial user preferences
    await userPreferences.set(newUser.id, {
      userId: newUser.id,
      theme: 'light',
      notifications: true,
      sound: true
    });

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Log failed registration attempt
    if (req.body?.email) {
      await prisma.registrationLog.create({
        data: {
          email: req.body.email,
          ipAddress,
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    return res.status(500).json({ 
      message: 'Registration failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

// Apply rate limiting to the registration endpoint
export default withRateLimit(handler, {
  limit: 3, // 3 attempts
  windowSeconds: 60 * 60 // 1 hour window
});
