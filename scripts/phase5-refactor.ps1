param(
    [switch]$WhatIf = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

function Backup-File {
    param($Path)
    if ($WhatIf) { return }
    $backup = "$Path.bak"
    if (-not (Test-Path $backup) -and (Test-Path $Path)) {
        Copy-Item -LiteralPath $Path -Destination $backup -Force
        Write-Host "  Backup: $backup" -ForegroundColor Gray
    }
}

function Write-File {
    param($Path, $Content)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Escrever $Path" -ForegroundColor Yellow
        return
    }
    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

# ============================================================
# FASE 5: REFATORACAO
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 5 - REFATORACAO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- 5.1: Separar data.ts - criar mock.ts ---
Write-Host "`n[5.1] Separando dados mock de utilitarios..." -ForegroundColor Cyan

# Criar src/lib/mock.ts com os dados mock
Write-File -Path "$root\src\lib\mock.ts" -Content @'
import type { TimeEntry, UserProfile, AppState } from '@/types';

const LS_KEYS = {
  ENTRIES: 'ponto_entries',
  PROFILE: 'ponto_profile',
  SESSION: 'ponto_session',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function createDateTimestamp(year: number, month: number, day: number, hour: number, minute: number): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function createMockEntries(): TimeEntry[] {
  const entries: TimeEntry[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  for (let i = 14; i >= 1; i--) {
    const d = new Date(currentYear, currentMonth - 1, now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    const inHour = Math.random() > 0.9 ? 8 : 8;
    const inMinute = Math.random() > 0.9 ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5);
    entries.push({ id: generateId(), type: 'in', timestamp: createDateTimestamp(year, month, day, inHour, inMinute), date: dateStr });

    const lunchOutHour = 12 + Math.floor(Math.random() * 1);
    const lunchOutMin = Math.floor(Math.random() * 30);
    entries.push({ id: generateId(), type: 'lunch-out', timestamp: createDateTimestamp(year, month, day, lunchOutHour, lunchOutMin), date: dateStr });

    const lunchInHour = 13 + Math.floor(Math.random() * 1);
    const lunchInMin = Math.floor(Math.random() * 15);
    entries.push({ id: generateId(), type: 'lunch-in', timestamp: createDateTimestamp(year, month, day, lunchInHour, lunchInMin), date: dateStr });

    const outHour = 17 + Math.floor(Math.random() * 2);
    const outMin = Math.floor(Math.random() * 30);
    entries.push({ id: generateId(), type: 'out', timestamp: createDateTimestamp(year, month, day, outHour, outMin), date: dateStr });
  }
  return entries;
}

export const MOCK_PROFILE: UserProfile = {
  id: 0,
  name: 'Carlos Eduardo',
  company: 'Tech Solutions Brasil',
  role: 'Desenvolvedor Full Stack',
  avatar: '/assets/avatar-user.jpg',
  username: '',
  workStartTime: '08:00',
  workEndTime: '17:00',
  lunchDuration: 60,
  dailyTarget: 8.8,
};

export function createMockState(): AppState {
  return {
    entries: createMockEntries(),
    profile: MOCK_PROFILE,
    session: { isAuthenticated: false, lastActive: Date.now() },
    ui: { toast: null, activeModal: null },
  };
}

export function loadState(): AppState {
  try {
    const entriesJson = localStorage.getItem(LS_KEYS.ENTRIES);
    const profileJson = localStorage.getItem(LS_KEYS.PROFILE);
    const sessionJson = localStorage.getItem(LS_KEYS.SESSION);
    if (!entriesJson || !profileJson) {
      const mock = createMockState();
      saveState(mock);
      return mock;
    }
    return {
      entries: JSON.parse(entriesJson),
      profile: JSON.parse(profileJson),
      session: sessionJson ? JSON.parse(sessionJson) : { isAuthenticated: false, lastActive: Date.now() },
      ui: { toast: null, activeModal: null },
    };
  } catch {
    const mock = createMockState();
    saveState(mock);
    return mock;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(LS_KEYS.ENTRIES, JSON.stringify(state.entries));
    localStorage.setItem(LS_KEYS.PROFILE, JSON.stringify(state.profile));
    localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(state.session));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function clearAllData(): void {
  localStorage.removeItem(LS_KEYS.ENTRIES);
  localStorage.removeItem(LS_KEYS.PROFILE);
  localStorage.removeItem(LS_KEYS.SESSION);
}
'@

# Agora remover essas funcoes de data.ts
Write-Host "  Atualizando data.ts (removendo mock functions)..." -ForegroundColor Gray
$dataTsPath = "$root\src\lib\data.ts"
$dataContent = Get-Content -LiteralPath $dataTsPath -Raw

# Remover LS_KEYS
$dataContent = $dataContent -replace '(?s)^const LS_KEYS[\s\S]*?\};', ''
# Remover generateId
$dataContent = $dataContent -replace '(?s)^function generateId[\s\S]*?\}\s*', ''
# Remover createDateTimestamp
$dataContent = $dataContent -replace '(?s)^function createDateTimestamp[\s\S]*?\}\s*', ''
# Remover createMockEntries
$dataContent = $dataContent -replace '(?s)^function createMockEntries[\s\S]*?\}\s*', ''
# Remover MOCK_PROFILE
$dataContent = $dataContent -replace '(?s)^export const MOCK_PROFILE[\s\S]*?\};', ''
# Remover createMockState
$dataContent = $dataContent -replace '(?s)^export function createMockState[\s\S]*?\}\s*', ''
# Remover loadState
$dataContent = $dataContent -replace '(?s)^export function loadState[\s\S]*?\}\s*', ''
# Remover saveState
$dataContent = $dataContent -replace '(?s)^export function saveState[\s\S]*?\}\s*', ''
# Remover clearAllData
$dataContent = $dataContent -replace '(?s)^export function clearAllData[\s\S]*?\}\s*', ''
# Limpar linhas vazias extras
$dataContent = $dataContent -replace '\n{3,}', "`n`n"

if (-not $WhatIf) {
    Backup-File -Path $dataTsPath
    [System.IO.File]::WriteAllText($dataTsPath, $dataContent.Trim() + "`n", [System.Text.UTF8]::new($false))
    Write-Host "  OK: data.ts limpo (apenas funcoes utilitarias)" -ForegroundColor Green
}

# --- 5.2: Refatorar AppContext.tsx - Extrair reducer ---
Write-Host "`n[5.2] Extraindo appReducer para arquivo separado..." -ForegroundColor Cyan

Write-File -Path "$root\src\context\appReducer.ts" -Content @'
import type { AppState, AppAction, TimeEntry } from '@/types';

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
      return { ...state, entries: [], session: { isAuthenticated: false, lastActive: Date.now() } };
    case "LOAD_STATE":
      return action.payload;
    default:
      return state;
  }
}
'@

# Atualizar AppContext.tsx para importar de appReducer
Write-Host "  Atualizando AppContext.tsx..." -ForegroundColor Gray
$appCtxPath = "$root\src\context\AppContext.tsx"
Backup-File -Path $appCtxPath

$newAppCtx = @'
import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/utils/trpc";
import { appReducer, initialState } from "./appReducer";
import type { AppState, AppAction, TimeEntry } from "@/types";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
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

  const { data: userData } = trpc.auth.me.useQuery(undefined, {
    enabled: state.session.isAuthenticated,
  });
  useEffect(() => {
    if (userData) {
      dispatch({
        type: "UPDATE_PROFILE",
        payload: {
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
  }, [userData]);

  const { data: entriesData } = trpc.entry.list.useQuery(
    {},
    { enabled: state.session.isAuthenticated }
  );
  useEffect(() => {
    if (entriesData) {
      const mapped: TimeEntry[] = entriesData.map(
        (e: { id: number | string; type: TimeEntry["type"]; timestamp: number; date: string }) => ({
          ...e,
          id: String(e.id),
        })
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
  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      utils.invalidate();
    },
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
'@
if (-not $WhatIf) {
    [System.IO.File]::WriteAllText($appCtxPath, $newAppCtx, [System.Text.UTF8]::new($false))
    Write-Host "  OK: AppContext.tsx refatorado (reducer extraido)" -ForegroundColor Green
}

# --- 5.3: Atualizar vite.config.ts removendo kimi-plugin ---
Write-Host "`n[5.3] Removendo kimi-plugin-inspect-react do vite.config.ts..." -ForegroundColor Cyan
$viteCfgPath = "$root\vite.config.ts"
$viteContent = Get-Content -LiteralPath $viteCfgPath -Raw
$viteContent = $viteContent -replace "import \{ inspectAttr \} from 'kimi-plugin-inspect-react'\s*", ''
$viteContent = $viteContent -replace "inspectAttr\(\),\s*", ''
if (-not $WhatIf) {
    Backup-File -Path $viteCfgPath
    [System.IO.File]::WriteAllText($viteCfgPath, $viteContent, [System.Text.UTF8]::new($false))
    Write-Host "  OK: kimi-plugin removido do vite.config.ts" -ForegroundColor Green
}

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 5 CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nProximos passos:" -ForegroundColor Yellow
Write-Host "  1. Verificar se as importacoes estao corretas (npm run check)" -ForegroundColor White
Write-Host "  2. Rodar npm install" -ForegroundColor White
