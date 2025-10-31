// src/components/tester/LogMonitor.jsx
import React from 'react';
import { useCpState } from '../../context/CpContext';

const LogMonitor = ({ cpId }) => {
    const { cpState } = useCpState();
    const logs = cpState.chargePoints[cpId]?.liveLogs || [];

    return (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll', backgroundColor: '#f9f9f9' }}>
            <h3>Live Protocol Log</h3>
            {logs.slice().reverse().map((log, index) => (
                // Displaying the log entry, focusing on the text/direction for clarity
                <div key={index} style={{ fontSize: '12px', color: log.direction === 'ERROR' ? 'red' : 'black' }}>
                    [{log.direction}] {log.text}
                </div>
            ))}
        </div>
    );
};

export default LogMonitor;