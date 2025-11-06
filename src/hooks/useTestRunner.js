// Inside src/hooks/useTestRunner.js
import React, {
    useCallback,
} from "react";

import { useOcppSimulator } from "./useOcppSimulator";
import { ocppScenarios } from "../data/ocppScenarios";
import { useCpState } from '../context/CpContext';


export const useTestRunner = () => {
    const { sendOcppRequest, isConnected } = useOcppSimulator();
    const { actions } = useCpState();

    // ... dependencies (useCpState, useOcppSimulator, ocppScenarios) ...

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

        // ... (connection check, scenario lookup, logging start) ...
        for (const step of scenario.steps) {
            try {
                actions.addLog(cpId, { direction: 'SYSTEM', text: `Step: ${step.log}` });
                let requestPayload = { ...step.payload }; // Clone the payload for modification
                if (
                    (step.action === "StopTransaction" || step.action === "MeterValues") &&
                    currentTransactionId) {
                    requestPayload.transactionId = currentTransactionId;
                    actions.addLog(cpId, { direction: 'SYSTEM', text: `  -> Injecting Transaction ID: ${currentTransactionId}` });
                }

                // 💡 CRITICAL: The AWAIT keyword ensures sequential execution 💡
                const conf = await sendOcppRequest(step.action, requestPayload);
                console.log("conf==>", conf)

                if (step.action === "StartTransaction") {
                    currentTransactionId = conf.payload.transactionId;
                    actions.addLog(cpId, { direction: 'SYSTEM', text: `  -> Transaction Started. ID captured: ${currentTransactionId}` });
                }
                // console.log("currentTransactionId", currentTransactionId)

                // console.log("logg", conf)

                // Check for rejection status in the confirmation response
                if (conf.payload.status && conf.payload.status.toLowerCase() === 'rejected') {
                    actions.addLog(cpId, { direction: 'ERROR', text: `${step.action} REJECTED by CSMS. Stopping scenario.` });
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
        actions
    ]);

    return {
        scenarios: ocppScenarios.map(s => s.name),
        runScenario,
        isRunnerReady: isConnected,
    };
};