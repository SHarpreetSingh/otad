// src/hooks/useOcppSimulator.js
import { useEffect, useRef, useCallback } from 'react';
import { useCpState } from '../context/CpContext';
import { useWebSocket } from './useWebSocket';

export const useOcppSimulator = () => {
    const { cpState, actions } = useCpState();
    const { baseUrl, cpId } = cpState.config;
    
    // Get communication tools from useWebSocket, passing user-defined config
    const { isConnected, sendMessage, lastMessage } = useWebSocket(baseUrl, cpId);
    
    // Map to hold Promises awaiting a CallResult (Type 3)
    const callPromises = useRef(new Map());

    // --- EFFECT 1: Update Global Connection Status ---
    useEffect(() => {
        if (cpId) {
            actions.setConnectionStatus(cpId, isConnected ? 'Connected' : 'Disconnected');
            if (isConnected) {
                actions.addLog(cpId, { direction: 'SYSTEM', text: `WebSocket connected to ${baseUrl}/${cpId}` });
            }
        }
    }, [isConnected, cpId, actions, baseUrl]);


    // --- EFFECT 2: Process Incoming Messages (The Protocol Handler) ---
    useEffect(() => {
        if (!lastMessage || !cpId) return;

        const [type, messageId, actionOrPayload, errorDetails] = lastMessage;
        
        actions.addLog(cpId, { direction: 'RECV', action: messageId, payload: lastMessage });

        // 1. Handle Type 3 (CallResult - CSMS Response to a CP Request)
        if (type === 3) {
            const resolver = callPromises.current.get(messageId);
            if (resolver) {
                // FULFILL the promise awaited by the test runner
                resolver.resolve({ payload: actionOrPayload });
                callPromises.current.delete(messageId);
            }
        } 
        
        // 2. Handle Type 2 (Call - CSMS Request to the CP Simulator)
        else if (type === 2) {
            // Must respond immediately to simulate compliant CP behavior
            // We will implement handleIncomingCall later
            // handleIncomingCall(messageId, actionOrPayload, errorDetails); 
        }
        
        // 3. Handle Type 4 (CallError)
        else if (type === 4) {
             const resolver = callPromises.current.get(messageId);
             if (resolver) {
                 resolver.reject(new Error(`OCPP Error from CSMS: ${errorDetails}`));
                 callPromises.current.delete(messageId);
             }
        }
    }, [lastMessage, cpId, actions]);

    // --- Core Logic: Send Request and Wait ---
    const sendOcppRequest = useCallback((action, payload) => {
        const messageId = Date.now().toString();
        const message = JSON.stringify([2, messageId, action, payload]);

        // Log the outgoing request
        actions.addLog(cpId, { direction: 'SENT', action, payload });

        return new Promise((resolve, reject) => {
            callPromises.current.set(messageId, { resolve, reject });
            sendMessage(message);
            
            // Timeout safety net
            setTimeout(() => {
                if (callPromises.current.has(messageId)) {
                    callPromises.current.delete(messageId);
                    reject(new Error(`Timeout waiting for ${action} confirmation.`));
                }
            }, 15000); 
        });
    }, [cpId, sendMessage, actions]);


    return {
        // Expose the core function for the test runner to use
        sendOcppRequest, 
        // Expose the current status
        isConnected,
        // ... other helper functions will be exposed here
    };
};