import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/utils/trpc";
import type { AppState, AppAction, TimeEntry } from "@/types";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function appReducer(state: AppState, action: AppAction): AppState {
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
    case "SET_SESSION_LOADED":
      return { ...state, session: { ...state.session, sessionLoading: false } };
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

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
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
    sessionLoading: true,
  },
  ui: {
    toast: null,
    activeModal: null,
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem("pontocerto_auth");
    dispatch({ type: "SET_AUTH", payload: false });
    dispatch({ type: "CLEAR_ALL_DATA" });
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!state.session.isAuthenticated) return;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT_MS);
    };

    resetTimeout();

    const events = ["click", "touchstart", "keydown"];
    events.forEach((e) => window.addEventListener(e, resetTimeout));

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimeout));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.session.isAuthenticated, logout]);

  const { data: userData, isFetched } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (!isFetched) return;
    if (userData) {
      dispatch({ type: "SET_AUTH", payload: true });
      dispatch({
        type: "UPDATE_PROFILE",
        payload: {
          id: userData.id,
          name: userData.name,
          company: userData.company,
          role: userData.role,
          avatar: userData.avatar || "/assets/avatar-user.jpg",
          username: userData.username,
          workStartTime: userData.workStartTime,
          workEndTime: userData.workEndTime,
          lunchDuration: userData.lunchDuration,
          dailyTarget: userData.dailyTarget / 60,
        },
      });
    }
    dispatch({ type: "SET_SESSION_LOADED" });
  }, [isFetched, userData]);

  const { data: entriesData } = trpc.entry.list.useQuery(
    {},
    { enabled: state.session.isAuthenticated }
  );
  useEffect(() => {
    if (entriesData) {
      const mapped: TimeEntry[] = entriesData.map(
        (e) => ({ ...e, id: String(e.id) })
      );
      dispatch({ type: "SET_ENTRIES", payload: mapped });
    }
  }, [entriesData]);

  return (
    <AppContext.Provider value={{ state, dispatch, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
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

export function useAuthMutations() {
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const register = trpc.auth.register.useMutation();
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => utils.invalidate(),
  });
  return { login, register, changePassword };
}

export function useUserMutations() {
  const utils = trpc.useUtils();
  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  return { updateUser };
}

export function useToast() {
  const { dispatch } = useAppState();

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      dispatch({ type: "SHOW_TOAST", payload: { message, type } });
      setTimeout(() => {
        dispatch({ type: "HIDE_TOAST" });
      }, 2500);
    },
    [dispatch]
  );

  return { showToast };
}
