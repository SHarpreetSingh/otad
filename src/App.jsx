// src/App.jsx
import React from "react";
import { CpProvider, useCpState } from "./context/CpContext";
import SetupScreen from "./components/setup/SetupScreen";

import LogMonitor from "../src/components/tester/LogMonitor";

// 💡 IMPORT the Brain, even though we won't use its functions yet
// import { useOcppSimulator } from "./hooks/useOcppSimulator";
import { useCpLifecycle } from "./hooks/useCpLifecycle";
import { useTestRunner } from "./hooks/useTestRunner";
import axios from "axios";

// --- Main App Component ---
const MainContent = () => {
  const { scenarios, runScenario, isRunnerReady } = useTestRunner();
  const { cpState } = useCpState();
  const { baseUrl, cpId } = cpState.config;

  // 💡 Hook the Brain here. It will start connecting when config is set!
  //   const { isConnected } = useOcppSimulator();

  useCpLifecycle();

  if (!baseUrl || !cpId) {
    return <SetupScreen />;
  }

  const apiUrl = baseUrl.replace("ws", "http"); // Convert WS to HTTP

  // Example component logic inside MainContent.jsx

  const simulateRemoteStart = async () => {
    const { cpId } = cpState.config;
    const remoteApiUrl = `${apiUrl}/adminApi/chargers/${cpId}/remotestart`; // 💡adminApi/chargers/:cpId/remotestart

    const payload = {
      idTag: "TEST1234",
      connectorId: 1,
    };

    // actions.addLog(cpId, {
    //   direction: "SYSTEM",
    //   text: `Attempting to trigger RemoteStart via API...`,
    // });

    try {
      // Axios call to your backend's test endpoint
      const response = await axios.post(remoteApiUrl, payload);

      // actions.addLog(cpId, {
      //   direction: "SYSTEM",
      //   text: `RemoteStart command successfully sent to backend for dispatch.`,
      // });
    } catch (error) {
      console.log("err in api", error);
      // actions.addLog(cpId, {
      //   direction: "ERROR",
      //   text: `API call failed: ${error.message}`,
      // });
    }
  };

  // --- Display Connection Status (Test Output) ---
  //   const connectionStatus = isConnected ? "✅ CONNECTED" : "❌ DISCONNECTED";

  return (
    <div style={{ padding: "20px" }}>
      {/* ... (existing headers, status, etc.) ... */}

      <h2>Test Runner Controls</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        {scenarios.map((scenarioName) => (
          <button
            key={scenarioName}
            // 💡 Click Handler: Calls runScenario with the selected name
            onClick={() => runScenario(scenarioName, cpId)}
            // Button is disabled until the simulator is connected and booted
            disabled={!isRunnerReady}
          >
            Run: **{scenarioName}**
          </button>
        ))}
      </div>

      {/* 2. CSMS Command Simulation (CSMS-Initiated Scenarios)
      <h2>CSMS Command Simulation (API Trigger)</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={simulateRemoteStart}
          disabled={!isRunnerReady} // Disable if the CP isn't connected
          style={{ backgroundColor: "#4CAF50", color: "white", border: "none" }}
        >
          Simulate **RemoteStartTransaction**
        </button>
        <button disabled={true} title="Not Implemented Yet">
          Simulate RemoteStop
        </button>
      </div>
      <hr />
      
      */}

      <LogMonitor cpId={cpId} />
    </div>
  );
};

// --- The Provider Wrapper ---
const App = () => (
  <CpProvider>
    <MainContent />
  </CpProvider>
);

export default App;
