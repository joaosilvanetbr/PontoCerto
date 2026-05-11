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
