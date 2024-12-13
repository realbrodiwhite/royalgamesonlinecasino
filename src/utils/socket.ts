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

  public static getInstance(): ReturnType<typeof io> {
    if (!SocketManager.instance) {
      SocketManager.instance = io('http://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true
      });
      
      // Set up event listeners
      SocketManager.instance.on('login', (data: LoginResponse) => {
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
    }

    return SocketManager.instance;
  }
}

export const socket = SocketManager.getInstance();
