import type { NextApiRequest, NextApiResponse } from 'next';
import { compare, hash } from 'bcrypt';
import { z } from 'zod';
import { withRateLimit } from '../../middleware/rateLimit';
import { prisma } from '../../lib/prisma';

// Validation schemas
const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(email => email.toLowerCase()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
});

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Handle login
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
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Log successful login
    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email }
    });

  } else if (req.method === 'PUT') {
    // Handle registration
    const validationResult = RegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationResult.error.errors 
      });
    }

    const { username, email, phone, dateOfBirth, password } = validationResult.data;

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        dateOfBirth,
        password: hashedPassword,
      }
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: newUser
    });
  } else {
    res.setHeader('Allow', ['POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Apply rate limiting to the auth endpoint
export default withRateLimit(handler, {
  limit: 5, // 5 attempts
  windowSeconds: 60 * 15 // 15 minute window
});