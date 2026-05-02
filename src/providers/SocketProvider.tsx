import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
const SOCKET_URL = BASE_URL.replace('/api/v1', '');

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context.socket;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    // Only connect if authenticated and we don't have an active socket
    if (isAuthenticated && user && !socketRef.current) {
      console.log('🔌 [Socket] Initializing shared connection to', SOCKET_URL);
      
      const token = localStorage.getItem('access_token');
      
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('✅ [Socket] Connected:', socket.id);
        setIsConnected(true);
        
        // Join specific rooms if needed (backend handles auto-join on connect but explicit is safer)
        const storeId = user.storeId || user.store?.id;
        if (storeId) {
          console.log(`🏠 [Socket] Joining store room: ${storeId}`);
          socket.emit('join:room', { storeId });
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ [Socket] Disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('⚠️ [Socket] Connection error:', err.message);
        setIsConnected(false);
      });

      socketRef.current = socket;
    }

    // Cleanup on unmount or logout
    return () => {
      if (socketRef.current && (!isAuthenticated || !user)) {
        console.log('🔌 [Socket] Closing shared connection');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
