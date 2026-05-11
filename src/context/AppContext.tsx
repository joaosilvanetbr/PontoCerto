import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { trpc } from '@/providers/trpc';
import type { AppState, AppAction, TimeEntry } from '@/types';

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload };
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'DELETE_ENTRY':
      return { ...state, entries: state.entries.filter(e => String(e.id) !== action.payload) };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e =>
          String(e.id) === String(action.payload.id)
            ? { ...e, timestamp: action.payload.timestamp, date: action.payload.date }
            : e
        ),
      };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'SET_AUTH':
      return { ...state, session: { ...state.session, isAuthenticated: action.payload, lastActive: Date.now() } };
    case 'UPDATE_LAST_ACTIVE':
      return { ...state, session: { ...state.session, lastActive: Date.now() } };
    case 'SHOW_TOAST':
      return { ...state, ui: { ...state.ui, toast: { ...action.payload, visible: true } } };
    case 'HIDE_TOAST':
      return { ...state, ui: { ...state.ui, toast: null } };
    case 'SET_ACTIVE_MODAL':
      return { ...state, ui: { ...state.ui, activeModal: action.payload } };
    case 'CLEAR_ALL_DATA':
      return {
        ...state,
        entries: [],
        profile: {
          name: '',
          company: '',
          role: '',
          avatar: '',
          pin: '1234',
          workStartTime: '08:00',
          workEndTime: '17:00',
          lunchDuration: 60,
          dailyTarget: 8.8,
        },
      };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  entries: [],
  profile: {
    name: 'Carlos Eduardo',
    company: 'Tech Solutions Brasil',
    role: 'Desenvolvedor Full Stack',
    avatar: '/assets/avatar-user.jpg',
    pin: '1234',
    workStartTime: '08:00',
    workEndTime: '17:00',
    lunchDuration: 60,
    dailyTarget: 8.8,
  },
  session: {
    isAuthenticated: true,
    lastActive: Date.now(),
  },
  ui: {
    toast: null,
    activeModal: null,
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sync entries from backend
  const { data: entriesData } = trpc.entry.list.useQuery({ userId: 1 });
  useEffect(() => {
    if (entriesData) {
      const mapped: TimeEntry[] = entriesData.map((e: { id: number | string; type: TimeEntry['type']; timestamp: number; date: string }) => ({
        ...e,
        id: String(e.id),
      }));
      dispatch({ type: 'SET_ENTRIES', payload: mapped });
    }
  }, [entriesData]);

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

export function useEntryMutations() {
  const utils = trpc.useUtils();
  const createEntry = trpc.entry.create.useMutation({
    onSuccess: () => utils.entry.list.invalidate(),
  });
  const updateEntry = trpc.entry.update.useMutation({
    onSuccess: () => utils.entry.list.invalidate(),
  });
  const deleteEntry = trpc.entry.delete.useMutation({
    onSuccess: () => utils.entry.list.invalidate(),
  });
  return { createEntry, updateEntry, deleteEntry };
}

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
