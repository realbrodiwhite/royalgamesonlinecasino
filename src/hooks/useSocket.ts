import { useEffect } from 'react';
import { socket } from '../utils/socket';

const useSocket = (gameId: string, onConnect: () => void, onError: (error: Error) => void) => {
  useEffect(() => {
    // Connect to the socket
    socket.connect();

    // Set up socket event listeners
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
    socket.on('error', onError);

    // Emit login event
    const key = localStorage.getItem('key');
    socket.emit('login', { key: key || null });

    // Cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      socket.off('error', onError);
      socket.disconnect();
    };
  }, [gameId, onConnect, onError]);
};

export default useSocket;
