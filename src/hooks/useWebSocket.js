// src/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

// This hook manages the raw WebSocket connection lifecycle.
export const useWebSocket = (baseUrl, cpId) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const wsRef = useRef(null);

    const connect = useCallback(() => {
        if (!baseUrl || !cpId) return;

        // Use the user-provided config to build the connection URL
        const socketUrl = `${baseUrl}/${cpId}`;
        const ws = new WebSocket(socketUrl, ["ocpp1.6"]);

        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onerror = (e) => {
            console.error("WS Error:", e);
            setIsConnected(false);
        };
        
        ws.onmessage = (event) => {
            try {
                // Parse the raw JSON message from the backend
                setLastMessage(JSON.parse(event.data)); 
            } catch (e) {
                console.error("Failed to parse incoming message:", event.data);
                // Handle raw text messages or corrupted data if necessary
            }
        };

        wsRef.current = ws;
    }, [baseUrl, cpId]);

    useEffect(() => {
        // If the configuration exists, connect; otherwise, ensure disconnected
        if (baseUrl && cpId) {
            connect();
        }
        
        // Cleanup function: Closes the previous connection on unmount or dependency change
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [baseUrl, cpId, connect]);

    const sendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(message);
            return true;
        }
        console.warn("WebSocket not open. Cannot send message.");
        return false;
    }, []);

    return { isConnected, sendMessage, lastMessage };
};