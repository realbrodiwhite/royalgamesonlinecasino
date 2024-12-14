import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

// Rate limiting types
type RateLimitRecord = {
  count: number;
  timestamp: number;
};

// Rate limiting map
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

// Validation schema
const RegisterSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string()
    .email('Invalid email format'),
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
});

// Rate limiting middleware
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
};

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 60 * 1000);

type RegisteredUser = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date;
  role: string;
  createdAt: Date;
};

type ApiResponse = {
  message: string;
  user?: RegisteredUser;
  errors?: z.ZodError['errors'];
  error?: unknown;
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get client IP
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ip = Array.isArray(clientIp) ? clientIp[0] : clientIp;

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      message: 'Too many registration attempts. Please try again later.' 
    });
  }

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
      password,
      verifyPassword
    } = validationResult.data;

    // Check if passwords match
    if (password !== verifyPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
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
      return res.status(409).json({ 
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        dateOfBirth,
        password: hashedPassword,
        role: 'user'
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

    // Convert numeric id to string for the response
    const user: RegisteredUser = {
      ...newUser,
      id: String(newUser.id)
    };

    // TODO: Generate verification token and send verification email
    // const verificationToken = await prisma.verificationToken.create({
    //   data: {
    //     identifier: email,
    //     token: crypto.randomBytes(32).toString('hex'),
    //     expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    //   }
    // });
    // await sendVerificationEmail(email, verificationToken.token);

    return res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
