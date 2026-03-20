import { useContext } from 'react';
import { createContext } from 'react';

// SocketContext is not currently active (no SocketProvider in App.tsx)
// This hook is unused — will be cleaned up in a later step
const SocketContext = createContext<{ socket: null; isConnected: boolean }>({ socket: null, isConnected: false });

export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};