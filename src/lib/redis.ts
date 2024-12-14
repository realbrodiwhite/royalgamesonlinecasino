import { Redis } from 'ioredis';
import { env } from '../env.mjs';

// Type definitions
type SessionData = {
  userId: string;
  expires: Date;
  data: Record<string, unknown>;
};

type GameState = {
  gameId: string;
  userId: string;
  state: Record<string, unknown>;
  lastUpdate: Date;
};

type LeaderboardEntry = {
  userId: string;
  score: number;
  timestamp: Date;
};

type UserPreferences = {
  userId: string;
  theme?: 'light' | 'dark';
  notifications?: boolean;
  sound?: boolean;
  [key: string]: unknown;
};

// Prevent multiple Redis instances in development
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000); // Exponential backoff
    },
    enableOfflineQueue: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Generic cache helpers
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(
  key: string,
  data: unknown,
  expiresIn = env.CACHE_TTL
): Promise<void> {
  try {
    if (expiresIn) {
      await redis.setex(key, expiresIn, JSON.stringify(data));
    } else {
      await redis.set(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

// Session management
export const sessions = {
  async get(sessionId: string): Promise<SessionData | null> {
    return getCache<SessionData>(`session:${sessionId}`);
  },

  async set(sessionId: string, data: SessionData, expiresIn = 24 * 60 * 60): Promise<void> {
    await setCache(`session:${sessionId}`, data, expiresIn);
  },

  async delete(sessionId: string): Promise<void> {
    await deleteCache(`session:${sessionId}`);
  }
};

// Game state management
export const gameState = {
  async get(gameId: string, userId: string): Promise<GameState | null> {
    return getCache<GameState>(`gameState:${gameId}:${userId}`);
  },

  async set(gameId: string, userId: string, state: GameState): Promise<void> {
    await setCache(`gameState:${gameId}:${userId}`, state, 60 * 60);
  },

  async delete(gameId: string, userId: string): Promise<void> {
    await deleteCache(`gameState:${gameId}:${userId}`);
  }
};

// Rate limiting
export const rateLimiting = {
  async increment(key: string, windowSeconds: number): Promise<number> {
    const current = Date.now();
    const clearBefore = current - (windowSeconds * 1000);
    
    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, clearBefore);
      // Add new entry
      await redis.zadd(key, current, `${current}`);
      // Get count of entries in window
      const count = await redis.zcard(key);
      // Set expiry on the key
      await redis.expire(key, windowSeconds);
      
      return count;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return 0;
    }
  },

  async isRateLimited(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean> {
    const count = await this.increment(`ratelimit:${identifier}`, windowSeconds);
    return count > limit;
  }
};

// Leaderboard management
export const leaderboard = {
  async get(gameId: string, timeframe: string): Promise<LeaderboardEntry[] | null> {
    return getCache<LeaderboardEntry[]>(`leaderboard:${gameId}:${timeframe}`);
  },

  async set(gameId: string, timeframe: string, data: LeaderboardEntry[]): Promise<void> {
    await setCache(`leaderboard:${gameId}:${timeframe}`, data, 5 * 60);
  },

  async update(gameId: string, userId: string, score: number): Promise<void> {
    const key = `leaderboard:${gameId}`;
    try {
      await redis.zadd(key, score, userId);
    } catch (error) {
      console.error('Leaderboard update error:', error);
    }
  },

  async getTopScores(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
    const key = `leaderboard:${gameId}`;
    try {
      const scores = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
      const result: LeaderboardEntry[] = [];
      for (let i = 0; i < scores.length; i += 2) {
        result.push({
          userId: scores[i],
          score: parseInt(scores[i + 1], 10),
          timestamp: new Date()
        });
      }
      return result;
    } catch (error) {
      console.error('Get top scores error:', error);
      return [];
    }
  }
};

// User preferences caching
export const userPreferences = {
  async get(userId: string): Promise<UserPreferences | null> {
    return getCache<UserPreferences>(`prefs:${userId}`);
  },

  async set(userId: string, preferences: UserPreferences): Promise<void> {
    await setCache(`prefs:${userId}`, preferences, 24 * 60 * 60);
  },

  async update(userId: string, key: string, value: unknown): Promise<void> {
    const prefs = await this.get(userId) || { userId };
    prefs[key] = value;
    await this.set(userId, prefs);
  }
};
