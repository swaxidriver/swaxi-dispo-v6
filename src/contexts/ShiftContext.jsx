import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { generateShiftTemplates } from '../utils/shifts';
import { sharePointService } from '../services/sharePointService';

const ShiftContext = createContext();

const initialState = {
  shifts: [],
  applications: [],
  notifications: [],
  filters: {
    timeRange: 'all',
    status: 'all',
    location: 'all'
  },
  dataSource: 'localStorage', // 'localStorage' | 'sharePoint'
  isOnline: false,
  lastSync: null
};

function shiftReducer(state, action) {
  switch (action.type) {
    case 'INIT_SHIFTS':
      return {
        ...state,
        shifts: action.payload
      };
    case 'SET_DATA_SOURCE':
      return {
        ...state,
        dataSource: action.payload.source,
        isOnline: action.payload.isOnline,
        lastSync: new Date()
      };
    case 'ADD_SHIFT':
      return {
        ...state,
        shifts: [...state.shifts, action.payload]
      };
    case 'UPDATE_SHIFT':
      return {
        ...state,
        shifts: state.shifts.map(shift =>
          shift.id === action.payload.id ? action.payload : shift
        )
      };
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [...state.applications, action.payload]
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    case 'SYNC_STATUS':
      return {
        ...state,
        lastSync: action.payload.timestamp,
        isOnline: action.payload.isOnline
      };
    default:
      return state;
  }
}

export function ShiftProvider({ children }) {
  const [state, dispatch] = useReducer(shiftReducer, initialState);

  // Hybrid data loading - tries SharePoint first, falls back to localStorage
  const loadShifts = async () => {
    try {
      // Check if SharePoint is available
      const isSharePointOnline = await sharePointService.isSharePointAvailable();
      
      if (isSharePointOnline) {
        console.log('🟢 SharePoint detected - loading from SharePoint');
        const shifts = await sharePointService.getShifts();
        dispatch({ type: 'INIT_SHIFTS', payload: shifts });
        dispatch({ 
          type: 'SET_DATA_SOURCE', 
          payload: { source: 'sharePoint', isOnline: true }
        });
      } else {
        console.log('🟡 SharePoint not available - using localStorage');
        const today = new Date();
        const generatedShifts = generateShiftTemplates(today, 10);
        dispatch({ type: 'INIT_SHIFTS', payload: generatedShifts });
        dispatch({ 
          type: 'SET_DATA_SOURCE', 
          payload: { source: 'localStorage', isOnline: false }
        });
      }
    } catch (error) {
      console.log('⚠️ Error loading from SharePoint, falling back to localStorage:', error);
      const today = new Date();
      const generatedShifts = generateShiftTemplates(today, 10);
      dispatch({ type: 'INIT_SHIFTS', payload: generatedShifts });
      dispatch({ 
        type: 'SET_DATA_SOURCE', 
        payload: { source: 'localStorage', isOnline: false }
      });
    }
  };

  // Auto-load shifts on mount
  useEffect(() => {
    loadShifts();
  }, []);

  // Auto-save to localStorage (backup)
  useEffect(() => {
    localStorage.setItem('swaxi-dispo-state', JSON.stringify(state));
  }, [state]);

  // Hybrid create shift function
  const createShift = async (shiftData) => {
    try {
      if (state.isOnline) {
        // Try SharePoint first
        const newShift = await sharePointService.createShift(shiftData);
        dispatch({ type: 'ADD_SHIFT', payload: newShift });
        await sharePointService.logAudit('SHIFT_CREATED', { shiftId: newShift.id });
        return newShift;
      } else {
        // Fallback to localStorage
        const newShift = {
          ...shiftData,
          id: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        dispatch({ type: 'ADD_SHIFT', payload: newShift });
        return newShift;
      }
    } catch (error) {
      console.error('Error creating shift:', error);
      // Always fallback to localStorage
      const newShift = {
        ...shiftData,
        id: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dispatch({ type: 'ADD_SHIFT', payload: newShift });
      return newShift;
    }
  };

  // Test SharePoint connection
  const testConnection = async () => {
    const isOnline = await sharePointService.isSharePointAvailable();
    dispatch({ 
      type: 'SYNC_STATUS', 
      payload: { isOnline, timestamp: new Date() }
    });
    return isOnline;
  };

  return (
    <ShiftContext.Provider value={{ 
      state, 
      dispatch, 
      loadShifts,
      createShift,
      testConnection
    }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShifts() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShifts must be used within a ShiftProvider');
  }
  return context;
}
