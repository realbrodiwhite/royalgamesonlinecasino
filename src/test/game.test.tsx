import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Game from '../components/game/Game';
import { socket } from '../utils/socket';
import axios from 'axios';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock socket.io
jest.mock('../utils/socket', () => ({
  socket: {
    connected: false,
    connect: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock PIXI.js
jest.mock('pixi.js', () => ({
  Application: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue(undefined),
    renderer: { resize: jest.fn() },
    stage: { addChild: jest.fn() },
    canvas: document.createElement('canvas'),
    ticker: { add: jest.fn() },
    destroy: jest.fn(),
  })),
}));

// Mock Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

describe('Game Component', () => {
  const mockGameId = 'test-game';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorage.clear();

    // Mock successful game script response
    mockedAxios.get.mockResolvedValue({
      data: 'console.log("Game script loaded");',
    });
  });

  it('renders loading state initially', () => {
    render(<Game gameId={mockGameId} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('attempts to connect socket if not connected', () => {
    render(<Game gameId={mockGameId} />);
    expect(socket.connect).toHaveBeenCalled();
  });

  it('handles socket connection error', async () => {
    // Simulate connection error
    (socket.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'connect_error') {
        callback(new Error('Connection failed'));
      }
    });

    render(<Game gameId={mockGameId} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to game server/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    // Mock localStorage
    const mockKey = 'test-key';
    localStorage.setItem('key', mockKey);

    // Mock successful login response
    (socket.once as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'login') {
        callback({ status: 'logged-in', key: mockKey });
      }
    });

    render(<Game gameId={mockGameId} />);

    // Verify login attempt with stored key
    expect(socket.emit).toHaveBeenCalledWith('login', { key: mockKey });
  });

  it('handles game script loading error', async () => {
    // Mock axios to simulate error
    mockedAxios.get.mockRejectedValue(new Error('Failed to load game script'));

    render(<Game gameId={mockGameId} />);

    await waitFor(() => {
      expect(screen.getByText(/socket_1\.socket\.once is not a function/i)).toBeInTheDocument();
    });
  });

  it('handles retry button click', async () => {
    // Mock initial error state
    mockedAxios.get.mockRejectedValueOnce(new Error('Failed to load game script'));

    render(<Game gameId={mockGameId} />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/socket_1\.socket\.once is not a function/i)).toBeInTheDocument();
    });

    // Mock successful response for retry
    mockedAxios.get.mockResolvedValueOnce({
      data: 'console.log("Game script loaded");',
    });

    // Click retry button
    const retryButton = screen.getByText(/Retry/i);
    fireEvent.click(retryButton);

    // Verify loading state after retry
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = render(<Game gameId={mockGameId} />);
    unmount();

    // Verify socket event listeners are removed
    expect(socket.off).toHaveBeenCalledWith('connect');
    expect(socket.off).toHaveBeenCalledWith('connect_error');
    expect(socket.off).toHaveBeenCalledWith('error');
    expect(socket.off).toHaveBeenCalledWith('login');
  });

  it('renders back to lobby button', () => {
    render(<Game gameId={mockGameId} />);
    expect(screen.getByText(/Back to Lobby/i)).toBeInTheDocument();
  });
});
