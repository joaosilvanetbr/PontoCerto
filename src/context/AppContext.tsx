import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { AppState, AppAction } from '@/types';
import { loadState, saveState, clearAllData, createMockState } from '@/lib/data';

function appReducer(state: AppState, action: AppAction): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'ADD_ENTRY':
      newState = { ...state, entries: [...state.entries, action.payload] };
      break;
    case 'DELETE_ENTRY':
      newState = { ...state, entries: state.entries.filter(e => e.id !== action.payload) };
      break;
    case 'UPDATE_ENTRY':
      newState = {
        ...state,
        entries: state.entries.map(e =>
          e.id === action.payload.id
            ? { ...e, timestamp: action.payload.timestamp, date: action.payload.date }
            : e
        ),
      };
      break;
    case 'UPDATE_PROFILE':
      newState = { ...state, profile: { ...state.profile, ...action.payload } };
      break;
    case 'SET_AUTH':
      newState = { ...state, session: { ...state.session, isAuthenticated: action.payload, lastActive: Date.now() } };
      break;
    case 'UPDATE_LAST_ACTIVE':
      newState = { ...state, session: { ...state.session, lastActive: Date.now() } };
      break;
    case 'SHOW_TOAST':
      newState = { ...state, ui: { ...state.ui, toast: { ...action.payload, visible: true } } };
      break;
    case 'HIDE_TOAST':
      newState = { ...state, ui: { ...state.ui, toast: null } };
      break;
    case 'SET_ACTIVE_MODAL':
      newState = { ...state, ui: { ...state.ui, activeModal: action.payload } };
      break;
    case 'CLEAR_ALL_DATA': {
      clearAllData();
      const mock = createMockState();
      newState = { ...mock, ui: state.ui };
      break;
    }
    case 'LOAD_STATE':
      newState = action.payload;
      break;
    default:
      return state;
  }

  // Persist to localStorage (skip UI state)
  if (action.type !== 'SHOW_TOAST' && action.type !== 'HIDE_TOAST' && action.type !== 'SET_ACTIVE_MODAL') {
    saveState(newState);
  }

  return newState;
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, loadState());

  // Update last active on user interaction
  useEffect(() => {
    const handler = () => dispatch({ type: 'UPDATE_LAST_ACTIVE' });
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

// Toast helper
export function useToast() {
  const { dispatch } = useAppState();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, 2500);
  }, [dispatch]);

  return { showToast };
}
