import { useEffect, useRef, useCallback } from 'react';
import { WS_BASE_URL } from '../types';
import type { ProgressUpdate } from '../types';
import { useTaskStore } from '../store/useTaskStore';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleProgressUpdate = useTaskStore((state) => state.handleProgressUpdate);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ProgressUpdate;
          if (data.type === 'progress') {
            handleProgressUpdate(data);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    } catch (e) {
      console.error('Failed to connect WebSocket:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, [handleProgressUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
