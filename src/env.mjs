import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database URLs
    DATABASE_URL: z.string().url(),
    MONGODB_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    
    // Auth
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    
    // Security
    MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default("5"),
    LOCK_DURATION: z.string().transform(Number).default("900"), // 15 minutes in seconds
    
    // Cache
    CACHE_TTL: z.string().transform(Number).default("3600"), // 1 hour in seconds
    
    // Node Environment
    NODE_ENV: z.enum(["development", "production", "test"]),
  },
  
  client: {
    // Add client-side env variables here if needed
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    MONGODB_URL: process.env.MONGODB_URL,
    REDIS_URL: process.env.REDIS_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    MAX_LOGIN_ATTEMPTS: process.env.MAX_LOGIN_ATTEMPTS,
    LOCK_DURATION: process.env.LOCK_DURATION,
    CACHE_TTL: process.env.CACHE_TTL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
