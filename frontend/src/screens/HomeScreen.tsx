import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Coffee, Bell, CheckCircle2,
  Timer, TrendingUp, TrendingDown
} from 'lucide-react';
import { useAppState, useToast, useEntryMutations } from '@/context/AppContext';
import { useInterval } from '@/hooks/useInterval';
import EntryEditor from '@/components/EntryEditor';
import {
  getTodayString, getClockStatus, calculateDayTotal,
  getNextEntryType, formatTime, formatDuration,
  getWeekDays, formatFullDate, getMonthDateRange, isDateWithinRange,
} from '@/lib/data';
import type { TimeEntry } from '@/types';

const ENTRY_TYPES: TimeEntry['type'][] = ['in', 'lunch-out', 'lunch-in', 'out'];
const ENTRY_LABELS: Record<TimeEntry['type'], string> = {
  'in': 'Entrada',
  'lunch-out': 'Saída Almoço',
  'lunch-in': 'Retorno Almoço',
  'out': 'Saída',
};

export default function HomeScreen() {
  const { state } = useAppState();
  const { showToast } = useToast();
  const { createEntry } = useEntryMutations();
  const today = getTodayString();
  const [tick, setTick] = useState(0);

  const todayEntries = useMemo(
    () => state.entries.filter(e => e.date === today).sort((a, b) => a.timestamp - b.timestamp),
    [state.entries, today]
  );

  const status = useMemo(() => getClockStatus(state.entries, today), [state.entries, today]);
  const nextType = useMemo(() => getNextEntryType(state.entries, today), [state.entries, today]);
  const totalWorked = useMemo(() => calculateDayTotal(state.entries, today), [state.entries, today, tick]);

  // Live timer update every second
  useInterval(() => {
    if (status === 'working' || status === 'break') {
      setTick(t => t + 1);
    }
  }, 1000);

  const handleClockAction = useCallback(async () => {
    if (!nextType) {
      showToast('Jornada completa para hoje!', 'warning');
      return;
    }

    const now = Date.now();
    await createEntry.mutateAsync({
      type: nextType,
      timestamp: now,
      date: today,
    });

    const labels: Record<TimeEntry['type'], string> = {
      'in': 'Entrada registrada',
      'lunch-out': 'Saída para almoço registrada',
      'lunch-in': 'Retorno do almoço registrado',
      'out': 'Saída registrada',
    };
    showToast(`${labels[nextType]} às ${formatTime(now)}`, 'success');
  }, [nextType, today, createEntry, showToast]);

  // Live timer display
  const liveTimer = useMemo(() => {
    if (status !== 'working' && status !== 'break') return null;
    const lastEntry = todayEntries[todayEntries.length - 1];
    if (!lastEntry) return null;
    const elapsed = Math.floor((Date.now() - lastEntry.timestamp) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [status, todayEntries, tick]);

  // Progress ring calculation
  const progress = useMemo(() => {
    const targetMinutes = state.profile.dailyTarget * 60;
    return Math.min(totalWorked / targetMinutes, 1);
  }, [totalWorked, state.profile.dailyTarget]);

  const circumference = 2 * Math.PI * 85;
  const strokeDashoffset = circumference * (1 - progress);

  const weekDays = getWeekDays();
  const currentDateStr = formatFullDate(today);

  // Monthly overtime calculation
  const monthlyOvertime = useMemo(() => {
    const { start, end } = getMonthDateRange(new Date());
    const monthEntries = state.entries.filter((entry) => isDateWithinRange(entry.date, start, end));
    const uniqueDays = [...new Set(monthEntries.map(e => e.date))];
    let overtime = 0;
    for (const d of uniqueDays) {
      const dayTotal = calculateDayTotal(state.entries, d);
      if (dayTotal > state.profile.dailyTarget * 60) {
        overtime += dayTotal - state.profile.dailyTarget * 60;
      }
    }
    return overtime;
  }, [state.entries, state.profile.dailyTarget]);

  // Remaining hours this month
  const remainingHours = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const workDaysRemaining = Math.ceil((daysInMonth - currentDay) * 5 / 7);
    return workDaysRemaining * state.profile.dailyTarget * 60;
  }, [state.profile.dailyTarget]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-5 pt-5 pb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-app leading-tight">
              Bom dia, {state.profile.name.split(' ')[0]}
            </h1>
            <p className="text-[13px] text-app-secondary mt-0.5">{currentDateStr}</p>
          </div>
          <button className="relative w-10 h-10 flex items-center justify-center">
            <Bell size={22} className="text-app-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </motion.header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Clock Button */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="flex flex-col items-center mt-6 mb-8"
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className={`w-[220px] h-[220px] rounded-full ${
                status === 'off' && nextType ? 'animate-pulse-glow' : ''
              }`}
              style={{
                boxShadow: status === 'working'
                  ? '0 0 30px rgba(16, 185, 129, 0.3)'
                  : status === 'break'
                  ? '0 0 25px rgba(245, 158, 11, 0.3)'
                  : 'none',
              }}
            />

            {/* Progress ring */}
            <svg
              className="absolute inset-0 w-[220px] h-[220px] -rotate-90"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100" cy="100" r="85"
                fill="none"
                stroke="var(--app-border)"
                strokeWidth="4"
              />
              {status === 'working' && (
                <motion.circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </svg>

            {/* Button */}
            <motion.button
              whileTap={nextType ? { scale: 0.95 } : {}}
              onClick={handleClockAction}
              disabled={!nextType}
              className={`absolute top-[20px] left-[20px] w-[180px] h-[180px] rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                !nextType
                  ? 'bg-app-border cursor-not-allowed'
                  : status === 'off'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-400'
                  : status === 'working'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            >
              {status === 'off' && nextType && (
                <Play size={40} className="text-white fill-white" />
              )}
              {status === 'working' && liveTimer && (
                <div className="text-center">
                  <span className="text-[32px] font-bold text-white tracking-tight">{liveTimer}</span>
                  <p className="text-[11px] text-white/80 mt-1">Trabalhando</p>
                </div>
              )}
              {status === 'break' && liveTimer && (
                <div className="text-center">
                  <Coffee size={32} className="text-white mx-auto mb-1" />
                  <span className="text-[20px] font-semibold text-white">{liveTimer}</span>
                  <p className="text-[11px] text-white/80 mt-0.5">Intervalo</p>
                </div>
              )}
              {!nextType && status === 'off' && (
                <div className="text-center">
                  <CheckCircle2 size={36} className="text-app-muted mx-auto mb-1" />
                  <span className="text-[13px] font-medium text-app-secondary">Jornada Completa</span>
                </div>
              )}
            </motion.button>
          </div>

          <p className="text-[15px] font-semibold text-app mt-4">
            {!nextType
              ? 'Jornada Completa'
              : status === 'off'
              ? 'Bater Ponto'
              : status === 'working'
              ? 'Registrar Intervalo'
              : 'Retornar ao Trabalho'}
          </p>
        </motion.div>

        {/* Today's Timesheet Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-app-card rounded-2xl p-4 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-app">Hoje</h2>
            <span className="text-[11px] text-app-muted">{formatShortDatePT(today)}</span>
          </div>

          <div className="space-y-0">
            {ENTRY_TYPES.map((type, idx) => {
              const entry = todayEntries.find(e => e.type === type);
              const isLast = idx === ENTRY_TYPES.length - 1;
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="flex items-center"
                >
                  <span className={`w-[52px] text-[15px] font-semibold ${
                    entry ? 'text-app' : 'text-app-muted'
                  }`}>
                    {entry ? formatTime(entry.timestamp) : '--:--'}
                  </span>

                  <div className="flex flex-col items-center mx-3">
                    <div className={`w-2 h-2 rounded-full ${
                      entry
                        ? type === 'lunch-out'
                          ? 'bg-amber-500'
                          : type === 'out'
                          ? 'bg-app-muted'
                          : 'bg-emerald-500'
                        : 'border border-app bg-transparent'
                    }`} />
                    {!isLast && <div className="w-px h-6 bg-app-border" />}
                  </div>

                  <div className="flex items-center justify-between flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] ${
                        entry ? 'text-app' : 'text-app-muted'
                      }`}>
                        {ENTRY_LABELS[type]}
                      </span>
                      {entry && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                    </div>
                    {entry && (
                      <EntryEditor
                        entryId={entry.id}
                        entryType={ENTRY_LABELS[type]}
                        timestamp={entry.timestamp}
                        date={entry.date}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Total */}
          <div className="border-t border-app mt-3 pt-3 flex items-center justify-between">
            <span className="text-[11px] text-app-secondary tracking-wide">Total trabalhado</span>
            <span className="text-xl font-semibold text-emerald-500">
              {formatDuration(totalWorked)}
            </span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 mb-5 overflow-x-auto scrollbar-hide"
        >
          {[
            { icon: Timer, label: 'Hoje', value: formatDuration(totalWorked), color: 'text-app' },
            { icon: TrendingUp, label: 'Extras (mês)', value: formatDuration(monthlyOvertime), color: 'text-emerald-500' },
            { icon: TrendingDown, label: 'Restantes (mês)', value: formatDuration(remainingHours), color: 'text-amber-500' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className="bg-app-card rounded-xl px-4 py-3 flex items-center gap-2.5 shrink-0"
            >
              <stat.icon size={16} className={stat.color} />
              <div>
                <span className={`text-[13px] font-semibold ${stat.color}`}>{stat.value}</span>
                <p className="text-[11px] text-app-muted">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Week Preview */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-app-card rounded-2xl p-4"
        >
          <h2 className="text-lg font-semibold text-app mb-4">Esta Semana</h2>
          <div className="flex justify-between">
            {weekDays.map((wd) => {
              const dayTotal = calculateDayTotal(state.entries, wd.date);
              const isToday = wd.date === today;
              const progress = Math.min(dayTotal / (state.profile.dailyTarget * 60), 1);
              return (
                <div key={wd.date} className="flex flex-col items-center gap-2 flex-1">
                  <span className={`text-[11px] ${isToday ? 'text-emerald-500 font-semibold' : 'text-app-muted'}`}>
                    {wd.label}
                  </span>
                  <div className="w-10 h-1 bg-app-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] text-app-muted">
                    {dayTotal > 0 ? `${Math.floor(dayTotal / 60)}h` : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function formatShortDatePT(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
