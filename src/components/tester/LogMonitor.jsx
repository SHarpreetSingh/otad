// src/components/tester/LogMonitor.jsx
import { useRef, useEffect } from "react";
import { useCpState } from "../../context/CpContext";

const LogMonitor = ({ cpId }) => {
  const { cpState } = useCpState();
  const logs = cpState.chargePoints[cpId]?.liveLogs || [];
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const getLogStyle = (log) => {
    const baseStyle = {
      fontSize: "12px",
      padding: "2px 0",
      borderBottom: "1px dotted #eee",
      lineHeight: "1.4",
    };

    if (log.direction === "ERROR") {
      return { ...baseStyle, color: "red", fontWeight: "bold" };
    }

    // 💡 Highlight SYSTEM logs (Scenario/Step Markers)
    if (log.direction === "SYSTEM") {
      const isSeparator =
        log.text.includes("--- Starting Scenario:") ||
        log.text.includes("--- Scenario PASSED:");
      const isStep = log.text.startsWith("Step:");

      if (isSeparator) {
        return {
          ...baseStyle,
          color: "#2196F3", // Blue color for start/end
          fontWeight: "bold",
          backgroundColor: "#E3F2FD",
          padding: "4px 8px",
        };
      }
      if (isStep) {
        return {
          ...baseStyle,
          color: "#00695C", // Teal color for step names
          fontWeight: "bold",
          backgroundColor: "#E0F2F1",
          padding: "4px 8px",
        };
      }

      return { ...baseStyle, color: "#333" }; // Default system message color
    }

    if (log.direction === "SENT") {
      return { ...baseStyle, color: "#FF9800" }; // Orange for Sent messages
    }

    if (log.direction === "RECV") {
      return { ...baseStyle, color: "#4CAF50" }; // Green for Received messages
    }

    return baseStyle;
  };

  return (
        <div style={{ marginTop: '20px' }}>
            <h3>Live Protocol Log</h3>
            <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', backgroundColor: '#fff', borderRadius: '4px' }}>
                {logs.map((log, index) => (
                    <div key={index} style={getLogStyle(log)}>
                        {log.text}
                    </div>
                ))}
                <div ref={logEndRef} /> {/* For auto-scrolling */}
            </div>
        </div>
    );
};

export default LogMonitor;
