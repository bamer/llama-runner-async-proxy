import { useEffect, useRef, useState } from 'react';
import { wsService } from '../services/websocket';
import { useMetricsStore } from '../store';

export const useWebSocket = () => {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = async () => {
      try {
        await wsService.connect();
        setIsConnected(true);
        wsRef.current = wsService.socket;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      wsService.disconnect();
      setIsConnected(false);
    };
  }, []);

  return { socket: wsRef.current, isConnected };
};

export const useMetrics = () => {
  const metrics = useMetricsStore((state) => state.metrics);
  const metricsHistory = useMetricsStore((state) => state.metricsHistory);
  const updateMetrics = useMetricsStore((state) => state.updateMetrics);

  return {
    metrics,
    metricsHistory,
    updateMetrics,
  };
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

export const useTheme = () => {
  const [theme, setThemeState] = useLocalStorage(
    'theme',
    'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return [theme, setThemeState];
};

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  return { data, loading, error };
};
