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

  // 💡 Hook the Brain here. It will start connecting when config is set!
//   const { isConnected } = useOcppSimulator();

  useCpLifecycle();

  if (!baseUrl || !cpId) {
    return <SetupScreen />;
  }

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
