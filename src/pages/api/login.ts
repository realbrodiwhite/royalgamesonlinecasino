import type { NextApiRequest, NextApiResponse } from 'next'; // Importing types for Next.js API request and response
import { sessions } from '../../lib/redis'; // Importing sessions object for Redis session management
import { compare } from 'bcrypt'; // Importing compare function for password verification
import { z } from 'zod'; // Importing Zod for schema validation
import { withRateLimit } from '../../middleware/rateLimit'; // Importing rate limiting middleware
import { prisma } from '../../lib/prisma'; // Importing Prisma client for database access
import { UAParser } from 'ua-parser-js'; // Importing UAParser for user agent parsing
import crypto from 'crypto'; // Importing crypto for hashing

// Validation schema for login
const LoginSchema = z.object({
  email: z.string().email('Invalid email format') // Validate email format
    .email('Invalid email format') // Validate email format
    .transform(email => email.toLowerCase()), // Transform email to lowercase
  password: z.string()
    .min(8, 'Password must be at least 8 characters') // Validate password length
});

// Device fingerprinting function
const getDeviceFingerprint = (req: NextApiRequest): string => {
  const ua = new UAParser(req.headers['user-agent']); // Parse user agent
  const browser = ua.getBrowser(); // Get browser information
  const os = ua.getOS(); // Get operating system information
  const device = ua.getDevice(); // Get device information

  const fingerprint = {
    browser: `${browser.name || ''}${browser.version || ''}`, // Construct browser fingerprint
    os: `${os.name || ''}${os.version || ''}`, // Construct OS fingerprint
    device: `${device.vendor || ''}${device.model || ''}`, // Construct device fingerprint
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress, // Get IP address
    acceptLanguage: req.headers['accept-language'], // Get accepted languages
  };

  return crypto.createHash('sha256') // Create a SHA-256 hash of the fingerprint
    .update(JSON.stringify(fingerprint))
    .digest('hex');
};

// Main handler function for login
async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') { // Check if the request method is POST
    return res.status(405).json({ message: 'Method not allowed' }); // Return 405 if not POST
  }

  const deviceFingerprint = getDeviceFingerprint(req); // Get device fingerprint
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                   req.socket.remoteAddress || 
                   'unknown'; // Get IP address

  try {
    const validationResult = LoginSchema.safeParse(req.body); // Validate request body

    if (!validationResult.success) { // Check if validation failed
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationResult.error.errors // Return validation errors
      });
    }

    const { email, password } = validationResult.data; // Extract email and password

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email } // Query user by email
    });

    if (!user) { // If user not found
      await prisma.log.create({ // Log the failed login attempt
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
        message: 'Invalid email or password' // Return error message
      });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockUntil && user.lockUntil > new Date()) {
      await prisma.log.create({ // Log the failed login attempt
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
        message: 'Account is locked. Please try again later.' // Return account locked message
      });
    }

    // Verify password
    const isValidPassword = await compare(password, user.password); // Compare provided password with stored password

    if (!isValidPassword) { // If password is invalid
      // Increment failed login attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: {
            increment: 1 // Increment failed login attempts
          },
          lastFailedLogin: new Date(), // Update last failed login time
          // Lock account after 5 failed attempts
          accountLocked: user.failedLoginAttempts >= 4,
          lockUntil: user.failedLoginAttempts >= 4 
            ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
            : null
        }
      });

      await prisma.log.create({ // Log the failed login attempt
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

      if (updatedUser.accountLocked) { // If account is locked
        return res.status(423).json({
          message: 'Account has been locked due to too many failed attempts. Please try again later.' // Return account locked message
        });
      }

      return res.status(401).json({
        message: 'Invalid email or password' // Return error message
      });
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0, // Reset failed login attempts
        accountLocked: false, // Unlock account
        lockUntil: null, // Clear lock until
        lastLogin: new Date(), // Update last login time
        deviceFingerprint // Update device fingerprint
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
        success: true // Log successful login
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

    // Create session data
    const sessionData = {
      userId: user.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiration
      data: { /* additional data if needed */ }
    };

    // Store session in Redis
    await sessions.set(user.id, sessionData); // Set session in Redis

    return res.status(200).json({
      message: 'Login successful',
      user: userData // Return user data
    });

  } catch (error) {
    console.error('Login error:', error); // Log error

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
          errorMessage: error instanceof Error ? error.message : 'Unknown error' // Log error message
        }
      });
    }

    return res.status(500).json({ 
      message: 'Login failed. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error : undefined // Return error in development mode
    });
  }
}

// Apply rate limiting to the login endpoint
export default withRateLimit(handler, {
  limit: 5, // 5 attempts
  windowSeconds: 60 * 15 // 15 minute window
});
