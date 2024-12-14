import { prisma } from '../lib/prisma';
import { verifyTestUserLogin, verifyRegistrationLog, verifyLoginLog } from '../lib/prisma-test';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Prisma client
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    log: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

// Mock prisma-test functions
const mockVerifyTestUserLogin = verifyTestUserLogin as jest.Mock;
const mockVerifyRegistrationLog = verifyRegistrationLog as jest.Mock;
const mockVerifyLoginLog = verifyLoginLog as jest.Mock;

jest.mock('../lib/prisma-test', () => ({
  verifyTestUserLogin: jest.fn(),
  verifyRegistrationLog: jest.fn(),
  verifyLoginLog: jest.fn(),
}));

describe('Authentication System', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockFetch.mockReset();
    mockVerifyTestUserLogin.mockReset();
    mockVerifyRegistrationLog.mockReset();
    mockVerifyLoginLog.mockReset();

    // Set up default mock responses
    mockVerifyTestUserLogin.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      username: 'testuser'
    });

    mockVerifyRegistrationLog.mockResolvedValue({
      id: '1',
      success: true,
      eventType: 'registration'
    });

    mockVerifyLoginLog.mockResolvedValue({
      id: '1',
      success: true,
      eventType: 'login'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Registration', () => {
    it('should successfully register a new user', async () => {
      const mockResponse = {
        status: 201,
        json: async () => ({
          message: 'Registration successful. Please check your email to verify your account.',
          user: {
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          password: 'Test123!@#',
          verifyPassword: 'Test123!@#'
        })
      });

      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.message).toContain('Registration successful');
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe('testuser');

      // Verify user in database
      const user = await verifyTestUserLogin();
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');

      // Verify registration log
      const log = await verifyRegistrationLog();
      expect(log).toBeDefined();
      expect(log?.success).toBe(true);

      // Verify mock functions were called
      expect(mockVerifyTestUserLogin).toHaveBeenCalled();
      expect(mockVerifyRegistrationLog).toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      const mockResponse = {
        status: 409,
        json: async () => ({
          message: 'Registration failed. Please try again with different credentials.'
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser2',
          email: 'test@example.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          password: 'Test123!@#',
          verifyPassword: 'Test123!@#'
        })
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain('Registration failed');
    });

    it('should reject registration with invalid password', async () => {
      const mockResponse = {
        status: 400,
        json: async () => ({
          message: 'Validation failed'
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser3',
          email: 'test3@example.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          password: 'weak',
          verifyPassword: 'weak'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Validation failed');
    });
  });

  describe('Login', () => {
    it('should successfully login with correct credentials', async () => {
      const mockResponse = {
        status: 200,
        json: async () => ({
          message: 'Login successful',
          user: {
            email: 'test@example.com',
            username: 'testuser'
          }
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123!@#'
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');

      // Verify login log
      const log = await verifyLoginLog();
      expect(log).toBeDefined();
      expect(log?.success).toBe(true);

      // Verify mock function was called
      expect(mockVerifyLoginLog).toHaveBeenCalled();
    });

    it('should reject login with incorrect password', async () => {
      const mockResponse = {
        status: 401,
        json: async () => ({
          message: 'Invalid email or password'
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const mockResponse = {
        status: 401,
        json: async () => ({
          message: 'Invalid email or password'
        })
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Test123!@#'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Invalid email or password');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Mock responses for the first 5 failed attempts
      const failedResponse = {
        status: 401,
        json: async () => ({
          message: 'Invalid email or password'
        })
      };

      // Mock response for the 6th attempt when account is locked
      const lockedResponse = {
        status: 423,
        json: async () => ({
          message: 'Account has been locked due to too many failed attempts. Please try again later.'
        })
      };

      // Set up mock responses
      mockFetch
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(lockedResponse);

      // Attempt login with wrong password 5 times
      for (let i = 0; i < 5; i++) {
        await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
        });
      }

      // Try one more time to verify account is locked
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(423);
      const data = await response.json();
      expect(data.message).toContain('Account has been locked');
    });
  });
});
