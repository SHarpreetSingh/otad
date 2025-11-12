// Inside src/hooks/useTestRunner.js
import React, {
    useCallback,
} from "react";

import { useOcppSimulator } from "./useOcppSimulator";
import { ocppScenarios } from "../data/ocppScenarios";
import { useCpState } from '../context/CpContext';
import axios from "axios";

export const useTestRunner = () => {
    const { sendOcppRequest, isConnected } = useOcppSimulator();
    const { actions, cpState } = useCpState();

    const runScenario = useCallback(async (scenarioName, cpId) => {
        if (!isConnected) {
            actions.addLog(cpId, { direction: 'ERROR', text: `Scenario failed: Not connected to CSMS.` });
            return;
        }

        const scenario = ocppScenarios.find(s => s.name === scenarioName);
        if (!scenario) {
            actions.addLog(cpId, { direction: 'ERROR', text: `Scenario "${scenarioName}" not found.` });
            return;
        }

        actions.addLog(cpId, { direction: 'SYSTEM', text: `--- Starting Scenario: ${scenario.name} ---` });
        let passed = true;
        let currentTransactionId = null;

        for (const step of scenario.steps) {
            let conf = null;
            let apiResponse = null;
            let requestPayload = { ...step.payload }; // Clone the payload for modification
            const apiUrl = "http://localhost:3000"; // Define this once outside the loop if possible

            try {
                actions.addLog(cpId, { direction: 'SYSTEM', text: `Step: ${step.log}` });

                if (
                    (step.action === "MeterValues" ||
                        step.action === "StopTransaction" ||
                        step.action === "RemoteStopTransaction") &&
                    currentTransactionId
                ) {
                    requestPayload.transactionId = currentTransactionId;
                    // NOTE: csTransactionId is likely an internal backend detail, use transactionId for OCPP

                    actions.addLog(cpId, { direction: 'SYSTEM', text: `  -> Injecting Transaction ID: ${currentTransactionId}` });
                } else if (step.action === "StatusNotification"
                    || step.action === "Heartbeat" || step.action === "Authorize") {
                    // Log when these non-transactional messages are processed
                    actions.addLog(cpId, { direction: 'SYSTEM', text: `  -> Sending Non-Transactional Message: ${step.action}` });
                }

                if (step.action === "RemoteStartTransaction" || step.action === "RemoteStopTransaction") {

                    const endpoint = step.action.toLowerCase().replace('transaction', ''); // e.g., 'remotestart' or 'remotestop'

                    // 2. Construct the dynamic URL
                    const remoteApiUrl = `${apiUrl}/adminApi/chargers/${cpId}/${endpoint}`;

                    actions.addLog(cpId, { direction: 'SYSTEM', text: `  -> Calling API for ${step.action}` });

                    apiResponse = await axios.post(remoteApiUrl, requestPayload);

                    // Placeholder for conf needed for the final status check
                    conf = { payload: { status: (apiResponse.status === 200 || apiResponse.status === 202) ? 'Accepted' : 'Rejected' } };

                } else if (step.action === "StartTransaction" || step.action === "StopTransaction"
                    || step.action === "MeterValues" || step.action === "StatusNotification" ||
                    step.action === "Heartbeat"  || step.action === "Authorize") {
                    conf = await sendOcppRequest(step.action, requestPayload);
                }

                if (step.action === "StartTransaction" && conf?.payload?.transactionId) {
                    currentTransactionId = conf.payload.transactionId;
                    const connectorIdToUpdate = requestPayload.connectorId;
                    
                    const currentConnectors = cpState.chargePoints[cpId]?.connectors || [];

                    const updatedConnectors = currentConnectors.map(conn => {
                        if (conn.connectorId === connectorIdToUpdate) {
                            return { ...conn, status: 'Charging', currentTransactionId, idTag: step.payload.idTag };
                        }
                        return conn;
                    });

                    actions.updateConnectors(cpId, updatedConnectors);
                    actions.addLog(cpId, { direction: 'SYSTEM', text: `  -> Transaction ${currentTransactionId} started on Connector ${connectorIdToUpdate}.` });
                }

                // console.log(step.action,cpState.chargePoints,conf.payload.idTagInfo )
                if (step.action === "StopTransaction" && conf && conf.payload.idTagInfo.status.toLowerCase() !== 'rejected') {
                    // Status transition back to Available after successful confirmation
                    const currentConnectors = cpState.chargePoints[cpId]?.connectors || [];
                    const transactionIdToClear = requestPayload.transactionId;

                    const updatedConnectors = currentConnectors.map(conn => {
                        if (conn.currentTransactionId === transactionIdToClear) {
                            return { ...conn, status: 'Available', currentTransactionId: null, idTag: null };
                        }
                        return conn;
                    });

                    actions.updateConnectors(cpId, updatedConnectors);
                    actions.addLog(cpId, { direction: 'SYSTEM', text: `Transaction ${requestPayload.transactionId} officially ended. Status reset to Available.` });
                    currentTransactionId = null; // Clear the tracked ID
                }

                if (conf && conf.payload.status && conf.payload.status.toLowerCase() === 'rejected') {
                    actions.addLog(cpId, { direction: 'ERROR', text: `${step.action} REJECTED by CSMS. Stopping scenario.` });
                    passed = false;
                    break;
                }

                if (apiResponse && (apiResponse.status !== 200 && apiResponse.status !== 202)) {
                    actions.addLog(cpId, { direction: 'ERROR', text: `${step.action} API FAILED (Status ${apiResponse.status}). Stopping scenario.` });
                    passed = false;
                    break;
                }

            } catch (error) {
                // Catches errors like WebSocket closure or protocol error
                actions.addLog(cpId, { direction: 'ERROR', text: `Scenario failed at ${step.action}: ${error.message}` });
                passed = false;
                break;
            }
        }

        const resultText = passed ? 'PASSED' : 'FAILED';
        actions.addLog(cpId, { direction: 'SYSTEM', text: `--- Scenario ${resultText}: ${scenario.name} ---` });
    }, [isConnected,     // Needed to check if connection is active
        sendOcppRequest, // Needed to send messages (wrapped in useCallback in useOcppSimulator)
        actions,
        cpState.chargePoints
    ]);

    return {
        scenarios: ocppScenarios.map(s => s.name),
        runScenario,
        isRunnerReady: isConnected,
    };
};