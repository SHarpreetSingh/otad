// src/App.jsx
import React from 'react';
import { CpProvider, useCpState } from './context/CpContext';
import SetupScreen from './components/setup/SetupScreen'; 

import LogMonitor from "../src/components/tester/LogMonitor";

// 💡 IMPORT the Brain, even though we won't use its functions yet
import { useOcppSimulator } from './hooks/useOcppSimulator'; 

// --- Main App Component ---
const MainContent = () => {
    const { cpState } = useCpState();
    const { baseUrl, cpId } = cpState.config;

    // 💡 Hook the Brain here. It will start connecting when config is set!
    const { isConnected } = useOcppSimulator(); 

    if (!baseUrl || !cpId) {
        return <SetupScreen />;
    }

    // --- Display Connection Status (Test Output) ---
    const connectionStatus = isConnected ? '✅ CONNECTED' : '❌ DISCONNECTED';

    return (
        <div>
            <h1>OCPP Simulator Dashboard</h1>
            <p>Target: <strong>{cpId}</strong> via <strong>{baseUrl}</strong></p>
            <h2>Status: <span style={{ color: isConnected ? 'green' : 'red' }}>{connectionStatus}</span></h2>

            {/* 💡 Log Monitor Placeholder */}
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