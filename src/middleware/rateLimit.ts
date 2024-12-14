import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimiting } from '../lib/redis';
import type { Session } from 'next-auth';

type RateLimitConfig = {
  limit: number;
  windowSeconds: number;
};

const defaultConfig: RateLimitConfig = {
  limit: 100, // Default requests per window
  windowSeconds: 60 * 15 // 15 minutes
};

const endpointLimits: Record<string, RateLimitConfig> = {
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

export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return endpointLimits[endpoint] || defaultConfig;
}

type ExtendedNextApiRequest = NextApiRequest & {
  session?: Session | null;
};

async function checkRateLimit(
  req: ExtendedNextApiRequest,
  res: NextApiResponse,
  config?: RateLimitConfig
): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    return true; // Skip rate limiting in development
  }

  const endpoint = req.url || 'unknown';
  const identifier = getIdentifier(req);
  const { limit, windowSeconds } = config || getRateLimitConfig(endpoint);

  const isLimited = await rateLimiting.isRateLimited(
    `${endpoint}:${identifier}`,
    limit,
    windowSeconds
  );

  if (isLimited) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
    return false;
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Window', windowSeconds.toString());

  return true;
}

// Helper function to get a unique identifier for the request
function getIdentifier(req: ExtendedNextApiRequest): string {
  // Try to get user ID if authenticated
  const userId = req.session?.user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress;
  
  return `ip:${ip || 'unknown'}`;
}

type ApiHandler = (
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) => Promise<void>;

// Higher-order function to wrap API routes with rate limiting
export function withRateLimit(
  handler: ApiHandler,
  config?: RateLimitConfig
): ApiHandler {
  return async function rateLimitedHandler(
    req: ExtendedNextApiRequest,
    res: NextApiResponse
  ): Promise<void> {
    const canProceed = await checkRateLimit(req, res, config);
    
    if (!canProceed) {
      return;
    }

    return handler(req, res);
  };
}

// Example usage:
/*
export default withRateLimit(async function handler(req, res) {
  // Your API route logic here
}, {
  limit: 5,
  windowSeconds: 60
});
*/
