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
    const remoteApiUrl = `${apiUrl}/adminApi/chargers/${cpId}/remotestart`; // 💡adminApi/chargers/:cpId/remotestart

    const payload = {
      idTag: "TEST1234",
      connectorId: 1,
    };

    try {
      // Axios call to your backend's test endpoint
      await axios.post(remoteApiUrl, payload);

      
    } catch (error) {
      console.log("err in api", error);
      
    }
  };

  // Example component logic (where your buttons live)

  // Assume you expose the transaction ID via state or props:
  // const activeTransactionId = 12345; // Get the currently running transaction ID

  const simulateRemoteStop = async () => {
    const remoteApiUrl = `${apiUrl}/adminApi/chargers/${cpId}/remotestop`; // 💡adminApi/chargers/:cpId/remotestart

    try {
      const payload = {
        csTransactionId: 446,
      };
      // You must call the core function that sends a Type 2 Call (CSMS to CP)
      // Since this is a simulation (API Trigger), you are simulating the CSMS sending a command TO your CP.
      // We will call the function that handles Type 2 (Call) messages.

      await axios.post(remoteApiUrl, payload);
      console.log("Simulated: RemoteStopTransaction sent to CP.");
    } catch (error) {
      console.error("RemoteStop simulation failed:", error);
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

      {/* //2. CSMS Command Simulation (CSMS-Initiated Scenarios) */}
      {/* <h2>CSMS Command Simulation (API Trigger)</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={simulateRemoteStart}
          disabled={!isRunnerReady} // Disable if the CP isn't connected
          style={{ backgroundColor: "#4CAF50", color: "white", border: "none" }}
        >
          Simulate **RemoteStartTransaction**
        </button>
        <button
          onClick={simulateRemoteStop}
          disabled={!isRunnerReady } // Disable if no transaction is active
          style={{ backgroundColor: "#FF5733", color: "white", border: "none" }}
          title="Simulates CSMS sending a command to stop an active transaction."
        >
          Simulate **RemoteStopTransaction**
        </button>
      </div>
      <hr /> */}

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
