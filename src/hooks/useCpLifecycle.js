// src/hooks/useCpLifecycle.js
import { useEffect, useRef } from 'react';
import { useOcppSimulator } from './useOcppSimulator';

// This hook manages the single-run activation sequence (BootNotification, etc.)
export const useCpLifecycle = () => {
    // Access the core simulator functions and connection status
    const { isConnected, bootAndConfigure } = useOcppSimulator(); 
    
    // Use a ref to prevent the boot sequence from being called multiple times
    const hasBooted = useRef(false);

    useEffect(() => {
        // Condition:
        // 1. WebSocket must be open.
        // 2. The sequence must not have run before.
        if (isConnected && !hasBooted.current) {
            hasBooted.current = true; 
            
            // 💡 Call the sequence
            bootAndConfigure();

            // NOTE: If the connection drops, you'll need logic to reset hasBooted.current = false 
            // in another useEffect that monitors isConnected changes.
        }
    }, [isConnected, bootAndConfigure]);
};