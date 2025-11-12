// Example Scenario Definition (as previously shown)
export const ocppScenarios = [
  {
    name: "Scenario 1: Standard Transaction",
    steps: [
      // STEP 1: Set a required state (e.g., Connector 1 to Available)
      {
        action: "StatusNotification",
        payload: { connectorId: 1, status: "Available", errorCode: "NoError" },
        log: "Set Connector 1 Available",
      },
      {
        action: "Heartbeat",
        payload: {},
        log: "Sending manual Heartbeat to check for immediate CSMS acknowledgment.",
      },
      // // // STEP 2: Authorize
      {
        action: "Authorize",
        payload: { idTag: "TEST1234" },
        log: "Authorize User",
      },
      // // // STEP 3: Start Transaction
      {
        action: "StartTransaction",
        payload: {
          connectorId: 1,
          idTag: "TEST1234",
          meterStart: 100,
          timestamp: new Date().toISOString(),
        },
        log: "Start Transaction",
      },
      {
        action: "MeterValues",
        payload: {
          connectorId: 1,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValues: [
                {
                  value: "125", // energy reading (Math.random() * 10000).toFixed(0
                },
              ],
            },
          ],
        },
        log: "MeterValues",
      },

      // // STEP 4: Stop Transaction
      {
        action: "StopTransaction",
        payload: {
          meterStop: 200,
          idTag: "TEST1234",
          timestamp: new Date().toISOString(),
        },
        log: "Stop Transaction",
      },
    ],
  },
  {
    name: "Scenario 2: Remote Transaction",
    steps: [
      {
        action: "RemoteStartTransaction",
        payload: { connectorId: 1, idTag: "TEST1234" },
        log: "RemoteStartTransaction ",
      },
      {
        action: "StartTransaction",
        payload: {
          connectorId: 1,
          idTag: "TEST1234",
          meterStart: 100,
          timestamp: new Date().toISOString(),
        },
        log: "Start Transaction",
      },
      {
        action: "MeterValues",
        payload: {
          connectorId: 1,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValues: [
                {
                  value: "125", // energy reading (Math.random() * 10000).toFixed(0
                },
              ],
            },
          ],
        },
        log: "MeterValues",
      },
      {
        action: "RemoteStopTransaction",
        payload: { connectorId: 1, idTag: "TEST1234" },
        log: "RemoteStopTransaction Transaction",
      },

      // // STEP 4: Stop Transaction
      {
        action: "StopTransaction",
        payload: {
          connectorId: 1,
          meterStop: 200,
          idTag: "TEST1234",
          timestamp: new Date().toISOString(),
        },
        log: "Stop Transaction",
      },
    ],
  },
  {
    name: "Scenario 3: Configuration",
    steps: [
      {
        action: "StatusNotification",
        payload: { connectorId: 1, status: "Available", errorCode: "NoError" },
        log: "Set Connector 1 Available",
      },

      {
        action: "Heartbeat",
        payload: {},
        log: "Sending manual Heartbeat to check for immediate CSMS acknowledgment.",
      },
      {
        action: "GetConfiguration",
        payload: { key: "HeartbeatInterval" },
        log: "GetConfiguration.",
      },
      {
        action: "ChangeConfiguration",
        payload: { key: "HeartbeatInterval", value: 10 },
        log: "ChangeConfiguration.",
      },
    ],
  },
];
