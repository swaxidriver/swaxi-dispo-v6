import { createContext, useContext, useReducer, useEffect } from 'react';
import { generateShiftTemplates } from '../utils/shifts';

const ShiftContext = createContext();

const initialState = {
  shifts: [],
  applications: [],
  notifications: [],
  filters: {
    timeRange: 'all',
    status: 'all',
    location: 'all'
  }
};

function shiftReducer(state, action) {
  switch (action.type) {
    case 'INIT_SHIFTS':
      return {
        ...state,
        shifts: action.payload
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
    default:
      return state;
  }
}

export function ShiftProvider({ children }) {
  const [state, dispatch] = useReducer(shiftReducer, initialState);

  // Auto-generate shifts 10 days in advance
  useEffect(() => {
    const today = new Date();
    const generatedShifts = generateShiftTemplates(today, 10);
    dispatch({ type: 'INIT_SHIFTS', payload: generatedShifts });
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    localStorage.setItem('swaxi-dispo-state', JSON.stringify(state));
  }, [state]);

  return (
    <ShiftContext.Provider value={{ state, dispatch }}>
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
