import { useEffect, useRef } from 'react';

interface SocketMessage {
  type: string;
  data: any;
}

interface UseSocketOptions {
  onMessage?: (message: SocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useSocket = (url: string, options: UseSocketOptions = {}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const { onMessage, onConnect, onDisconnect } = options;

  useEffect(() => {
    // Mock WebSocket connection for demo
    const mockSocket = {
      send: (data: string) => {
        console.log('Mock socket send:', data);
      },
      close: () => {
        console.log('Mock socket closed');
      }
    };

    socketRef.current = mockSocket as any;

    // Simulate connection
    if (onConnect) {
      onConnect();
    }

    // Simulate periodic messages
    const interval = setInterval(() => {
      if (onMessage) {
        onMessage({
          type: 'payment.updated',
          data: {
            jobId: 'job-1',
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (onDisconnect) {
        onDisconnect();
      }
    };
  }, [url, onMessage, onConnect, onDisconnect]);

  const sendMessage = (message: SocketMessage) => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage };
};