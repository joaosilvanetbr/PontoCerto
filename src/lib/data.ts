import type { TimeEntry } from '@/types';

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
