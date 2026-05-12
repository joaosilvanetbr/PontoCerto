import type { AppState, AppAction } from '@/types';

export const initialState: AppState = {
  entries: [],
  profile: {
    id: 0,
    name: "",
    company: "",
    role: "",
    avatar: "/assets/avatar-user.jpg",
    username: "",
    workStartTime: "08:00",
    workEndTime: "17:00",
    lunchDuration: 60,
    dailyTarget: 8.8,
  },
  session: {
    isAuthenticated: false,
    lastActive: Date.now(),
    sessionLoading: false,
  },
  ui: {
    toast: null,
    activeModal: null,
  },
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ENTRIES":
      return { ...state, entries: action.payload };
    case "ADD_ENTRY":
      return { ...state, entries: [...state.entries, action.payload] };
    case "DELETE_ENTRY":
      return { ...state, entries: state.entries.filter((e) => String(e.id) !== action.payload) };
    case "UPDATE_ENTRY":
      return {
        ...state,
        entries: state.entries.map((e) =>
          String(e.id) === String(action.payload.id)
            ? { ...e, timestamp: action.payload.timestamp, date: action.payload.date }
            : e
        ),
      };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "SET_AUTH":
      return { ...state, session: { ...state.session, isAuthenticated: action.payload, lastActive: Date.now() } };
    case "UPDATE_LAST_ACTIVE":
      return { ...state, session: { ...state.session, lastActive: Date.now() } };
    case "SHOW_TOAST":
      return { ...state, ui: { ...state.ui, toast: { ...action.payload, visible: true } } };
    case "HIDE_TOAST":
      return { ...state, ui: { ...state.ui, toast: null } };
    case "SET_ACTIVE_MODAL":
      return { ...state, ui: { ...state.ui, activeModal: action.payload } };
    case "CLEAR_ALL_DATA":
      return {
        ...state,
        entries: [],
        session: { isAuthenticated: false, lastActive: Date.now(), sessionLoading: false },
      };
    case "LOAD_STATE":
      return action.payload;
    default:
      return state;
  }
}
