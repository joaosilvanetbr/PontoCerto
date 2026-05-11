export type TimeEntryType = 'in' | 'lunch-out' | 'lunch-in' | 'out';
export type ClockStatus = 'off' | 'working' | 'break';

export interface TimeEntry {
  id: string | number;
  type: TimeEntryType;
  timestamp: number;
  date: string;
}

export interface UserProfile {
  name: string;
  company: string;
  role: string;
  avatar: string;
  pin: string;
  workStartTime: string;
  workEndTime: string;
  lunchDuration: number;
  dailyTarget: number;
}

export interface SessionState {
  isAuthenticated: boolean;
  lastActive: number;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  visible: boolean;
}

export interface UIState {
  toast: ToastState | null;
  activeModal: string | null;
}

export interface AppState {
  entries: TimeEntry[];
  profile: UserProfile;
  session: SessionState;
  ui: UIState;
}

export type AppAction =
  | { type: 'SET_ENTRIES'; payload: TimeEntry[] }
  | { type: 'ADD_ENTRY'; payload: TimeEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'UPDATE_ENTRY'; payload: { id: string | number; timestamp: number; date: string } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_AUTH'; payload: boolean }
  | { type: 'UPDATE_LAST_ACTIVE' }
  | { type: 'SHOW_TOAST'; payload: Omit<ToastState, 'visible'> }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_ACTIVE_MODAL'; payload: string | null }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'LOAD_STATE'; payload: AppState };
