// Example Scenario Definition (as previously shown)
export const ocppScenarios = [
  {
    name: "Scenario 1: Standard Transaction",
    steps: [
      // STEP 1: Set a required state (e.g., Connector 1 to Available)
      { action: "StatusNotification", payload: { connectorId: 1, status: "Available", errorCode: "NoError" }, log: "Set Connector 1 Available" },
      {
        action: "Heartbeat",
        payload: {},
        log: "Sending manual Heartbeat to check for immediate CSMS acknowledgment."
      },
      // STEP 2: Authorize
      { action: "Authorize", payload: { idTag: "TEST1234" }, log: "Authorize User" },
      // STEP 3: Start Transaction
      { action: "StartTransaction", payload: { connectorId: 1, idTag: "TEST1234", meterStart: 100, timestamp: new Date().toISOString() }, log: "Start Transaction" },
      {
        action: "MeterValues", payload: {
          connectorId: 1,
          meterValue: [{
            "timestamp": new Date().toISOString(),
            "sampledValues": [{
              "value": "125", // energy reading (Math.random() * 10000).toFixed(0
            }]
          }],
        }, log: "MeterValues"
      },


      // STEP 4: Stop Transaction
      { action: "StopTransaction", payload: { meterStop: 200, idTag: "TEST1234", timestamp: new Date().toISOString() }, log: "Stop Transaction" },
    ],
  },
  // ... more scenarios
];