import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
const SOCKET_URL = BASE_URL.replace('/api/v1', '');

export const useSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && !socketRef.current) {
      console.log('🔌 [Socket] Initializing connection to', SOCKET_URL);
      
      const token = localStorage.getItem('access_token');
      
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        console.log('✅ [Socket] Connected:', socketRef.current?.id);
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ [Socket] Disconnected');
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('⚠️ [Socket] Connection error:', err.message);
      });
    }

    return () => {
      if (socketRef.current) {
        console.log('🔌 [Socket] Closing connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  return socketRef.current;
};
