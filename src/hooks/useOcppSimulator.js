// src/hooks/useOcppSimulator.js
import { useEffect, useRef, useCallback } from 'react';
import { useCpState } from '../context/CpContext';
import { useWebSocket } from './useWebSocket';
import axios from 'axios';

export const useOcppSimulator = () => {
    const lastStatusRef = useRef(null)
    const { cpState, actions } = useCpState();
    const { baseUrl, cpId } = cpState.config;

    // Map to hold Promises awaiting a CallResult (Type 3)
    const callPromises = useRef(new Map());
    const chargePointState = cpState.chargePoints[cpId];

    // Get communication tools from useWebSocket, passing user-defined config
    const handleNewWebSocketMessage = useCallback((message) => {
        // 💡 This is where you put the old logic from EFFECT 2.

        if (!cpId) return;

        const [type, messageId, actionOrPayload, errorDetails] = message;

        // Determine the action and payload based on message type for logging clarity
        const action = (type === 2) ? actionOrPayload : (callPromises.current.get(messageId)?.action || "Confirmation");

        // 2. Log the message (This is the only state update and is now triggered ONCE per WS event)
        actions.addLog(cpId, { direction: 'RECV', action: action, payload: message });

        // ... (Your processing logic, e.g., calling handleIncomingCSMSCommand) ...

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
<<<<<<< Updated upstream
=======
            // handleIncomingCSMSCommand(messageId, actionOrPayload, errorDetails);
>>>>>>> Stashed changes
            // Must respond immediately to simulate compliant CP behavior
            // We will implement handleIncomingCall later
            // handleIncomingCall(messageId, actionOrPayload, errorDetails); 
        }

        // 3. Handle Type 4 (CallError)
        // else if (type === 4) {
        //     const rejectedPromise = callPromises.current.get(messageId);
        //     if (rejectedPromise) {
        //         // REJECT the promise awaited by the test runner
        //         const errorCode = actionOrPayload; // OCPP Error Code
        //         const errorDescription = errorDetails; // OCPP Error Description
        //         rejectedPromise.reject(new Error(`CSMS Error (${errorCode}): ${errorDescription}`));
        //         callPromises.current.delete(messageId);
        //     }
        // }

    }, [cpId, actions, callPromises,]);

    const { isConnected, sendMessage } = useWebSocket(baseUrl, cpId, handleNewWebSocketMessage);

    // --- EFFECT 1: Update Global Connection Status ---
    useEffect(() => {
        if (!cpId) return

        const newStatus = isConnected ? 'Connected' : 'Disconnected';

        if (lastStatusRef.current === newStatus) {
            return;
        }

        actions.setConnectionStatus(cpId, newStatus);

        if (isConnected) {
            console.log(`WebSocket connected to ${baseUrl}/${cpId}`)
            actions.addLog(cpId, { direction: 'SYSTEM', text: `WebSocket connected to ${baseUrl}/${cpId}` });
        } else {
            actions.addLog(cpId, { direction: 'SYSTEM', text: `WebSocket disconnected.` });
        }

        lastStatusRef.current = newStatus;

        return () => {
            // This is called when the connection is lost, or the hook is re-triggered.
            // if (cpId) {
            // Optional: Log the fact that the simulator is shutting down or disconnecting
            // actions.addLog(cpId, { direction: 'SYSTEM', text: `WebSocket listener cleaned up.` });
            // }
            // If you had a timer (like Heartbeat), you would call clearInterval() here.
        };
    }, [
        isConnected, cpId, actions, baseUrl
    ]);

    const sendError = useCallback(
        (messageId,
            requestedAction, errorCode,
            description = "An internal simulator error occurred.", errorDetails = {}) => {

            // 1. Format the mandatory error description based on the code
            let errorDescription = description;
            if (errorCode === "NotImplemented") {
                errorDescription = `Action '${requestedAction}' is not supported by the simulator.`;
            }

            // 2. Build the Type 4 message array
            const errorMsg = JSON.stringify([
                4,
                messageId,
                errorCode,
                errorDescription,
                errorDetails
            ]);

            // 3. Log and Send the message immediately via the low-level utility
            actions.addLog(cpId, { direction: 'SENT_ERROR', action: requestedAction, payload: { errorCode, errorDescription } });
            sendMessage(errorMsg);

            // Note: We don't return a Promise because we are not waiting for a response here.

        }, [cpId, actions, sendMessage])

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

    const handleRemoteStart = useCallback((payload) => {
        const connectorId = payload.connectorId || 0; // 0 for all connectors or specific ID
        const idTag = payload.idTag;

        // 1. Check conditions (Is the connector available? Is the tag valid?)
        // In a simple simulator, you might just check availability.
        const connector = chargePointState.connectors.find(c => c.connectorId === connectorId);

        if (connector && connector.status === "Available" && idTag) {
            // 2. Update simulator state (e.g., set connector status to 'Preparing')
            actions.updateConnectorStatus(cpId, connectorId, 'Preparing');
            actions.addLog(cpId, { direction: 'SYSTEM', text: `RemoteStart ACCEPTED for Connector ${connectorId}` });

            sendOcppRequest("StatusNotification", {
                connectorId,
                status: "Preparing", // Send the new status
                errorCode: "NoError"
            });

            // 3. Return a successful confirmation status
            return { status: "Accepted" };
        } else {
            // 4. Return an error status
            actions.addLog(cpId, { direction: 'ERROR', text: `RemoteStart REJECTED: Connector ${connectorId} not Available.` });
            return { status: "Rejected" };
        }
    }, [cpId, chargePointState, actions, sendOcppRequest]);

    const handleIncomingCSMSCommand = useCallback((messageId, action, payload) => {
        actions.addLog(cpId, { direction: 'RECV', action, payload });

        let responsePayload;

        switch (action) {
            case 'RemoteStartTransaction':
                // 💡 Handle the core business logic (e.g., check connector availability)
                responsePayload = handleRemoteStart(payload);
                break;
            // case 'RemoteStopTransaction':
            //     responsePayload = handleRemoteStop(payload);
            //     break;
            // case 'GetConfiguration':
            //     // Need to return a list of keys and values from your internal config state
            //     responsePayload = handleGetConfiguration(payload);
            //     break;
            // ... (Add cases for ChangeConfiguration, UnlockConnector, etc.)
            default:
                // Send a ProtocolError if the message is unrecognized
                return sendError(messageId, action, "NotImplemented");
        }

        // After processing, send the required confirmation back to the CSMS (Type 3)
        sendMessage(JSON.stringify([3, messageId, responsePayload]));

    }, [cpId,
        actions,
        sendMessage,
        sendError,
        handleRemoteStart

    ]);

    // --- EFFECT 2: Process Incoming Messages (The Protocol Handler) ---

    // 💡 NEW: Function to fetch initial configuration via REST
    const fetchCpConfig = useCallback(async (currentCpId) => {
        try {
            // Assume your CSMS has a REST endpoint like /adminApi/config/<CP_MANUAL>
            // This endpoint must return data, e.g., { connectorCount: 4 }
            const apiUrl = baseUrl.replace('ws', 'http'); // Convert WS to HTTP
            const response = await axios.get(`${apiUrl}/adminApi/config/${currentCpId}`);

            // Assuming your backend responds with the number of connectors
            const connectorCount = response.data.connectorCount || 1;

            // Dynamically create the initial connector array (1-indexed)
            const initialConnectors = Array.from({ length: connectorCount }, (_, i) => ({
                connectorId: i + 1,
                status: "Available",
                currentTransactionId: null,
            }));

            // Update the global state with the dynamic data
            actions.updateConnectors(currentCpId, initialConnectors);
            actions.addLog(currentCpId, { direction: 'SYSTEM', text: `Fetched ${connectorCount} connectors from CSMS.` });

        } catch (error) {
            actions.addLog(currentCpId, { direction: 'ERROR', text: `Failed to fetch config from REST: ${error.message}` });
        }
    }, [baseUrl, actions]); // Dependency on baseUrl is needed for the API call

    // 💡 NEW: Function to perform the full boot sequence
    const bootAndConfigure = useCallback(async () => {
        if (!isConnected || !cpId) {
            actions.addLog(cpId, { direction: 'ERROR', text: "Cannot boot: WebSocket is not open." });
            return;
        }

        try {
            // 1. Send BootNotification and AWAIT the CSMS confirmation (Type 3)
            // actions.addLog(cpId, { direction: 'SYSTEM', text: "Starting OCPP Boot Notification sequence..." });

            const bootConf = await sendOcppRequest("BootNotification", {
                chargePointVendor: "SimV",
                chargePointModel: "TestModel",
                chargeBoxSerialNumber: cpId,
            });

            console.log("dd==>", bootConf.payload)

            // 2. Check the response status
            if (bootConf.payload.status === 'Accepted') {
                actions.addLog(cpId, {
                    direction: 'SYSTEM',
                    text: `Boot Accepted! Heartbeat Interval: ${bootConf.payload.heartbeatInterval}s`
                });

                // 3. Protocol Accepted: NOW fetch configuration via REST
                await fetchCpConfig(cpId);

                // 4. Start Heartbeat Timer (Placeholder for later implementation)
                // actions.setHeartbeatInterval(cpId, bootConf.payload.interval); 

            } else {
                actions.addLog(cpId, { direction: 'ERROR', text: `Boot Rejected: Status ${bootConf.payload.status}` });
            }
        } catch (error) {
            actions.addLog(cpId, { direction: 'ERROR', text: `Boot failed: ${error.message}` });
        }
    }, [isConnected, cpId, actions, sendOcppRequest, fetchCpConfig]);

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
    return {
        // Expose the core function for the test runner to use
        sendOcppRequest,
        // Expose the current status
        isConnected,
        // ... other helper functions will be exposed here
        bootAndConfigure
    };
};