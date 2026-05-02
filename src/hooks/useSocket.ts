import { useContext } from 'react';
import { SocketContext } from '../providers/SocketProvider';

/**
 * Hook to access the shared socket instance
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context.socket;
};
