import io from 'socket.io-client';
import { store } from '../store/store';
import { setLoggedIn, setUser } from '../store/lobbySlice';

interface LoginResponse {
  status: 'logged-in' | 'error';
  key: string;
  username: string;
  balance: number;
}

class SocketManager {
  private static instance: ReturnType<typeof io>;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 1000;

  public static getInstance(): ReturnType<typeof io> {
    if (!SocketManager.instance) {
  //  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

      console.log('Initializing socket connection to:', wsUrl);

      SocketManager.instance = io(wsUrl, {
        transports: ['websocket', 'polling'], // Allow fallback to polling if WebSocket fails
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: SocketManager.maxReconnectAttempts,
        reconnectionDelay: SocketManager.reconnectDelay,
        timeout: 10000, // Increase timeout to 10 seconds
      });
      
      // Set up event listeners
      SocketManager.instance.on('connect', () => {
        console.log('Socket connected successfully');
        SocketManager.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      });

      SocketManager.instance.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        SocketManager.handleReconnect();
      });

      SocketManager.instance.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          SocketManager.instance.connect();
        }
      });

      SocketManager.instance.on('login', (data: LoginResponse) => {
        console.log('Received login response:', data);
        if (data.status === 'logged-in') {
          store.dispatch(setLoggedIn(true));
          store.dispatch(setUser({
            username: data.username,
            balance: data.balance
          }));
          localStorage.setItem('key', data.key);
        }
      });

      SocketManager.instance.on('balance', (balance: number) => {
        const currentUser = store.getState().lobby.user;
        if (currentUser) {
          store.dispatch(setUser({
            username: currentUser.username,
            balance
          }));
        }
      });

      // Debug events
      SocketManager.instance.on('error', (error: Error) => {
        console.error('Socket error:', error);
      });

      SocketManager.instance.on('reconnect', (attemptNumber: number) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
      });

      SocketManager.instance.on('reconnect_attempt', (attemptNumber: number) => {
        console.log('Socket reconnection attempt:', attemptNumber);
      });

      SocketManager.instance.on('reconnect_error', (error: Error) => {
        console.error('Socket reconnection error:', error);
      });

      SocketManager.instance.on('reconnect_failed', () => {
        console.error('Socket reconnection failed after', SocketManager.maxReconnectAttempts, 'attempts');
      });
    }

    return SocketManager.instance;
  }

  private static handleReconnect() {
    if (SocketManager.reconnectAttempts < SocketManager.maxReconnectAttempts) {
      SocketManager.reconnectAttempts++;
      console.log(`Attempting to reconnect... Attempt ${SocketManager.reconnectAttempts} of ${SocketManager.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (SocketManager.instance) {
          if (!SocketManager.instance.connected) {
            SocketManager.instance.connect();
          }
        }
      }, SocketManager.reconnectDelay * SocketManager.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public static disconnect() {
    if (SocketManager.instance) {
      SocketManager.instance.disconnect();
    }
  }

  public static reconnect() {
    SocketManager.reconnectAttempts = 0;
    if (SocketManager.instance) {
      SocketManager.instance.connect();
    }
  }
}

export const socket = SocketManager.getInstance();
