// src/components/setup/SetupScreen.jsx (Conceptual)
import { useState } from 'react';
import { useCpState } from '../../context/CpContext';

const SetupScreen = () => {
    // Default values for quick testing
    const [baseUrl, setBaseUrl] = useState("ws://localhost:3000");
    const [cpId, setCpId] = useState("CP_MANUAL_003");
    
    const { actions } = useCpState();

    const handleConnect = (e) => {
        e.preventDefault();
        if (baseUrl && cpId) {
            // This call updates the state and triggers useWebSocket
            actions.setConfig(baseUrl.trim(), cpId.trim());
        }
    };

    return (
        <form onSubmit={handleConnect}>
            <h2>🔌 Connect to CSMS Backend</h2>
            <p>Enter the URL and Charge Point ID to begin simulation.</p>
            <input 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)} 
                placeholder="WS URL (e.g., ws://localhost:3000)" 
                required 
            />
            <input 
                value={cpId} 
                onChange={(e) => setCpId(e.target.value)} 
                placeholder="Charge Point ID (e.g., CP_001)" 
                required 
            />
            <button type="submit">Connect & Start Simulator</button>
        </form>
    );
};

export default SetupScreen;