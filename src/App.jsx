// src/App.jsx
import React from "react";
import { CpProvider, useCpState } from "./context/CpContext";
import SetupScreen from "./components/setup/SetupScreen";

import LogMonitor from "../src/components/tester/LogMonitor";

// 💡 IMPORT the Brain, even though we won't use its functions yet
// import { useOcppSimulator } from "./hooks/useOcppSimulator";
import { useCpLifecycle } from "./hooks/useCpLifecycle";
import { useTestRunner } from "./hooks/useTestRunner";

// --- Main App Component ---
const MainContent = () => {
  const { scenarios, runScenario, isRunnerReady } = useTestRunner();
  const { cpState } = useCpState();
  const { baseUrl, cpId } = cpState.config;

  useCpLifecycle();

  if (!baseUrl || !cpId) {
    return <SetupScreen />;
  }

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
