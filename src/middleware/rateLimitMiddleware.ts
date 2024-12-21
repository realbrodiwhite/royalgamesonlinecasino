import { NextResponse, NextRequest } from 'next/server';
import { rateLimiting } from '../lib/redis';

const defaultConfig = {
  limit: 100, // Default requests per window
  windowSeconds: 60 * 15 // 15 minutes
};

const endpointLimits: Record<string, { limit: number; windowSeconds: number }> = {
  '/api/auth/login': {
    limit: 5,
    windowSeconds: 60 * 15 // 15 minutes
  },
  '/api/auth/register': {
    limit: 3,
    windowSeconds: 60 * 60 // 1 hour
  },
  '/api/game/spin': {
    limit: 60,
    windowSeconds: 60 // 1 minute
  }
};

export function getRateLimitConfig(endpoint: string) {
  return endpointLimits[endpoint] || defaultConfig;
}

export async function rateLimitMiddleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next(); // Skip rate limiting in development
  }

  const endpoint = req.nextUrl.pathname;
  const identifier = getIdentifier(req);
  const { limit, windowSeconds } = getRateLimitConfig(endpoint);

  const isLimited = await rateLimiting.isRateLimited(
    `${endpoint}:${identifier}`,
    limit,
    windowSeconds
  );

  if (isLimited) {
    return NextResponse.json({
      error: 'Too many requests',
      message: 'Please try again later'
    }, { status: 429 });
  }

  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Window', windowSeconds.toString());

  return response;
}

// Helper function to get a unique identifier for the request
function getIdentifier(req: NextRequest): string {
  const userId = req.cookies.get('userId'); // Example of getting user ID from cookies
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : 'unknown';
  return `ip:${ip}`;
}
