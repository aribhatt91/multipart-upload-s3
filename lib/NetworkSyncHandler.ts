/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
import { useUploadStore } from './store'; // Your Zustand store
import Logger from './logger';

export function NetworkSyncHandler() {
  const { managers } = useUploadStore();

  useEffect(() => {
    const handleOffline = () => {
      Logger.warn('Network connection lost. Pausing all active uploads.');
      
      // Loop through all managers in Zustand and pause them
      Object.values(managers).forEach((manager: any) => {
        if (manager && typeof manager.pause === 'function') {
          manager.pause();
        }
      });
    };

    const handleOnline = () => {
      Logger.info('Network connection restored.');
      // Optional: You could auto-resume here, 
      // but GDrive usually waits for user confirmation or a "Retry" click.
    };

    // Listen for connection changes
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Support for Network Information API (Detecting 4G -> 3G shifts)
    // Note: This is experimental but supported in most modern browsers
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        const conn = (navigator as any).connection;
        Logger.log(`Network change detected: ${conn.effectiveType}`);
        
        // If the connection becomes too slow (e.g., 'slow-2g'), consider pausing
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          handleOffline();
        }
      });
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [managers]);

  return null; // Logic-only component
}