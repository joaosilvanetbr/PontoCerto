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

  // Generate entries for the last 14 days (excluding today)
  for (let i = 14; i >= 1; i--) {
    const d = new Date(currentYear, currentMonth - 1, now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayOfWeek = d.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    // Clock in (8:00 - 8:15, some late entries)
    const inHour = Math.random() > 0.9 ? 8 : 8;
    const inMinute = Math.random() > 0.9 ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5);
    entries.push({
      id: generateId(),
      type: 'in',
      timestamp: createDateTimestamp(year, month, day, inHour, inMinute),
      date: dateStr,
    });

    // Lunch out (12:00 - 13:00)
    const lunchOutHour = 12 + Math.floor(Math.random() * 1);
    const lunchOutMin = Math.floor(Math.random() * 30);
    entries.push({
      id: generateId(),
      type: 'lunch-out',
      timestamp: createDateTimestamp(year, month, day, lunchOutHour, lunchOutMin),
      date: dateStr,
    });

    // Lunch in (13:00 - 14:00)
    const lunchInHour = 13 + Math.floor(Math.random() * 1);
    const lunchInMin = Math.floor(Math.random() * 15);
    entries.push({
      id: generateId(),
      type: 'lunch-in',
      timestamp: createDateTimestamp(year, month, day, lunchInHour, lunchInMin),
      date: dateStr,
    });

    // Clock out (17:00 - 18:30)
    const outHour = 17 + Math.floor(Math.random() * 2);
    const outMin = Math.floor(Math.random() * 30);
    entries.push({
      id: generateId(),
      type: 'out',
      timestamp: createDateTimestamp(year, month, day, outHour, outMin),
      date: dateStr,
    });
  }

  return entries;
}

export const MOCK_PROFILE: UserProfile = {
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
    session: {
      isAuthenticated: false,
      lastActive: Date.now(),
    },
    ui: {
      toast: null,
      activeModal: null,
    },
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

// Utility functions
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getClockStatus(entries: TimeEntry[], date: string): 'off' | 'working' | 'break' {
  const dayEntries = entries.filter(e => e.date === date).sort((a, b) => a.timestamp - b.timestamp);
  if (dayEntries.length === 0) return 'off';
  const last = dayEntries[dayEntries.length - 1];
  if (last.type === 'in') return 'working';
  if (last.type === 'lunch-out') return 'break';
  if (last.type === 'lunch-in') return 'working';
  return 'off';
}

export function calculateDayTotal(entries: TimeEntry[], date: string): number {
  const dayEntries = entries.filter(e => e.date === date).sort((a, b) => a.timestamp - b.timestamp);
  let total = 0;

  for (let i = 0; i < dayEntries.length - 1; i++) {
    const curr = dayEntries[i];
    const next = dayEntries[i + 1];
    if (curr.type === 'in' && next.type === 'lunch-out') {
      total += (next.timestamp - curr.timestamp) / 60000;
    }
    if (curr.type === 'lunch-in' && next.type === 'out') {
      total += (next.timestamp - curr.timestamp) / 60000;
    }
  }

  // If currently working, add time since clock in
  const last = dayEntries[dayEntries.length - 1];
  if (last && (last.type === 'in' || last.type === 'lunch-in') && date === getTodayString()) {
    total += (Date.now() - last.timestamp) / 60000;
  }

  return Math.round(total);
}

export function getNextEntryType(entries: TimeEntry[], date: string): TimeEntry['type'] | null {
  const dayEntries = entries.filter(e => e.date === date).sort((a, b) => a.timestamp - b.timestamp);
  if (dayEntries.length === 0) return 'in';
  if (dayEntries.length >= 4) return null;
  const last = dayEntries[dayEntries.length - 1];
  if (last.type === 'in') return 'lunch-out';
  if (last.type === 'lunch-out') return 'lunch-in';
  if (last.type === 'lunch-in') return 'out';
  return null;
}

export function getEntryLabel(type: TimeEntry['type']): string {
  const labels: Record<TimeEntry['type'], string> = {
    'in': 'Entrada',
    'lunch-out': 'Saída Almoço',
    'lunch-in': 'Retorno Almoço',
    'out': 'Saída',
  };
  return labels[type];
}

export function formatFullDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${days[date.getDay()]}, ${day} de ${months[date.getMonth()]}`;
}

export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function getWeekDays(): { label: string; date: string }[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days: { label: string; date: string }[] = [];
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ label: labels[i], date: ds });
  }
  return days;
}

export function getMonthName(month: number, year: number): string {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[month]} ${year}`;
}

export function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  // Next month padding to fill 42 cells (6 rows x 7 cols)
  while (days.length < 42) {
    days.push(null);
  }

  return days;
}

export function exportToCSV(entries: TimeEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  let csv = 'Data,Tipo,Hora\n';
  for (const entry of sorted) {
    const date = formatShortDate(entry.date);
    const time = formatTime(entry.timestamp);
    const label = getEntryLabel(entry.type);
    csv += `${date},${label},${time}\n`;
  }
  return csv;
}
