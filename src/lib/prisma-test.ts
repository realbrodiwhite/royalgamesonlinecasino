import { prisma } from './prisma';
import { hash } from 'bcrypt';

export async function cleanupTestUsers() {
  await prisma.log.deleteMany({
    where: {
      email: {
        contains: 'test'
      }
    }
  });
  
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test'
      }
    }
  });
}

export async function createTestUser() {
  const hashedPassword = await hash('Test123!@#', 12);
  
  const testUser = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      dateOfBirth: new Date('1990-01-01'),
      phone: '+1234567890'
    }
  });

  return testUser;
}

export async function verifyTestUserLogin() {
  const user = await prisma.user.findUnique({
    where: {
      email: 'test@example.com'
    }
  });

  return user;
}

export async function verifyRegistrationLog() {
  const log = await prisma.log.findFirst({
    where: {
      email: 'test@example.com',
      eventType: 'registration'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return log;
}

export async function verifyLoginLog() {
  const log = await prisma.log.findFirst({
    where: {
      email: 'test@example.com',
      eventType: 'login'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return log;
}
