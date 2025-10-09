'use client';

import React, { useState, useEffect } from 'react';
import { webSocketService } from '@/services/websocket';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(webSocketService.isConnected());
    };

    // Check connection status every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    // Listen for updates
    const unsubscribe = webSocketService.subscribe('jobUpdate', () => {
      setLastUpdate(new Date());
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
        {isConnected ? 'Live' : 'Offline'}
      </span>
      {lastUpdate && (
        <span className="text-gray-500">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
