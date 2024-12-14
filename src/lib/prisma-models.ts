import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Log all available models and their properties
console.log('Available models:', Object.keys(prisma));

// Log model properties
for (const key of Object.keys(prisma)) {
  console.log(`\nModel ${key} properties:`, Object.keys(prisma[key as keyof typeof prisma]));
}

// Clean up
prisma.$disconnect();
