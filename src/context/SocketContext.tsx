import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL, SOCKET_OPTIONS } from '../config/socket';
import { createContext } from 'react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let newSocket: Socket | null = null;

    const initializeSocket = () => {
      // Use the configured socket URL and options from config/socket.ts
      newSocket = io(SOCKET_URL, {
        ...SOCKET_OPTIONS,
        auth: user ? { token: user.id, user } : undefined
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server with ID:', newSocket?.id);
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error.message);
        setIsConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.IO server:', reason);
        setIsConnected(false);
      });

      // Connect the socket
      newSocket.connect();
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}