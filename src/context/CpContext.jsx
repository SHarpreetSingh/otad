/* eslint-disable react-refresh/only-export-components */
// src/context/CpContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// --- INITIAL STATE ---
const initialCpState = {
  // Config holds user input from the setup screen
  config: {
    baseUrl: null,
    cpId: null,
  },
  // Data for the active Charge Point (keyed by cpId once configured)
  chargePoints: {},
};

import { CpActions } from './CpActions';

// --- REDUCER ---
const cpReducer = (state, action) => {
  // console.log(action);
  const { cpId, payload } = action;
  // console.log(state, "payload", payload);

  switch (action.type) {
    case CpActions.SET_CONFIG:
      // eslint-disable-next-line no-case-declarations
      const newCpId = payload.cpId;
      if (!newCpId) return state;

      return {
        ...state,
        config: payload,
        // Initialize state for the new CP ID if it doesn't exist
        chargePoints: {
          ...state.chargePoints,
          [newCpId]: state.chargePoints[newCpId] || {
            connectionStatus: "Connecting",
            connectors: [
              {
                connectorId: 1,
                status: "Available",
                currentTransactionId: null,
              },
            ],
            liveLogs: [],
          },
        },
      };

    case CpActions.SET_CONNECTION_STATUS:
      return {
        ...state,
        chargePoints: {
          ...state.chargePoints,
          [cpId]: {
            ...state.chargePoints[cpId],
            connectionStatus: payload.status,
          },
        },
      };

    case CpActions.ADD_LOG_ENTRY:
      if (!cpId || !state.chargePoints[cpId]) return state;

      return {
        ...state,
        chargePoints: {
          ...state.chargePoints,
          [cpId]: {
            ...state.chargePoints[cpId],
            liveLogs: [...state.chargePoints[cpId].liveLogs, payload.log],
          },
        },
      };
    // ... other cases
    default:
      return state;
  }
};

// --- CONTEXT and PROVIDER ---
export const CpContext = createContext();

export const useCpState = () => useContext(CpContext);

export const CpProvider = ({ children }) => {
  const [cpState, dispatch] = useReducer(cpReducer, initialCpState);

  // Actions callable from any component
  const actions = {
    // Called by the SetupScreen to define the connection target
    setConfig: useCallback((baseUrl, cpId) => {
      dispatch({
        type: CpActions.SET_CONFIG,
        payload: { baseUrl, cpId },
      });
    }, []),

    // Called by useOcppSimulator to update status
    setConnectionStatus: useCallback((cpId, status) => {
      dispatch({
        type: CpActions.SET_CONNECTION_STATUS,
        cpId,
        payload: { status },
      });
    }, []),

    // Called by useOcppSimulator to update the real-time console
    addLog: useCallback((cpId, logEntry) => {
      dispatch({
        type: CpActions.ADD_LOG_ENTRY,
        cpId,
        payload: { log: logEntry },
      });
    }, []),
    // ... other action handlers will be added here
  };

  return (
    <CpContext.Provider value={{ cpState, actions, dispatch }}>
      {children}
    </CpContext.Provider>
  );
};
