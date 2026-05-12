import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import {
  getCalendarDays, getMonthName, getTodayString,
  calculateDayTotal, formatTime, formatDuration,
} from '@/lib/data';
import EntryEditor from '@/components/EntryEditor';
import type { TimeEntry } from '@/types';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function HistoryScreen() {
  const { state } = useAppState();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = getTodayString();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1));

  const getDayEntries = (day: number): TimeEntry[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return state.entries.filter(e => e.date === dateStr).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getDayStatus = (day: number): 'complete' | 'partial' | 'empty' => {
    const entries = getDayEntries(day);
    if (entries.length === 0) return 'empty';
    if (entries.length === 4) return 'complete';
    return 'partial';
  };

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedEntries = selectedDay ? getDayEntries(selectedDay) : [];
  const selectedTotal = selectedDay ? calculateDayTotal(state.entries, selectedDateStr!) : 0;

  const entryLabels: Record<TimeEntry['type'], string> = {
    'in': 'Entrada',
    'lunch-out': 'Saída Almoço',
    'lunch-in': 'Retorno Almoço',
    'out': 'Saída',
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 pt-5 pb-4"
      >
        <h1 className="text-[28px] font-bold text-app mb-2">Histórico</h1>
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-app-border/50">
            <ChevronLeft size={22} className="text-app-secondary" />
          </button>
          <span className="text-lg font-semibold text-app">{getMonthName(month, year)}</span>
          <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl active:bg-app-border/50">
            <ChevronRight size={22} className="text-app-secondary" />
          </button>
        </div>
      </motion.div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-app-muted py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const status = getDayStatus(day);
            const isSelected = selectedDay === day;

            return (
              <motion.button
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02, duration: 0.3 }}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors ${
                  isSelected
                    ? 'bg-emerald-500/15'
                    : status !== 'empty'
                    ? 'bg-app-highlight'
                    : 'bg-transparent'
                } ${isToday ? 'ring-1 ring-emerald-500' : ''}`}
              >
                <span className={`text-[13px] font-medium ${
                  isToday ? 'text-emerald-500' : isSelected ? 'text-emerald-500' : 'text-app'
                }`}>
                  {day}
                </span>
                {status !== 'empty' && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    status === 'complete' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                )}
                {status === 'empty' && (
                  <div className="w-1.5 h-1.5 rounded-full border border-app mt-1" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedDay(null)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative bg-app-card rounded-t-[20px] w-full max-h-[70vh] z-10"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-app-border rounded-full" />
              </div>

              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-app">
                      {selectedDay} de {getMonthName(month, year).split(' ')[0]}
                    </h3>
                    <p className="text-[11px] text-app-muted">
                      {selectedEntries.length === 0
                        ? 'Sem registros'
                        : selectedEntries.length === 4
                        ? 'Jornada completa'
                        : `${selectedEntries.length} registros`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-app-border"
                  >
                    <X size={16} className="text-app-secondary" />
                  </button>
                </div>

                {selectedEntries.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <img
                      src="/assets/empty-state.jpg"
                      alt="Sem registros"
                      className="w-24 h-24 rounded-xl object-cover mb-3 opacity-60"
                    />
                    <p className="text-[13px] text-app-muted">Sem registros neste dia</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEntries.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 bg-app rounded-xl p-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.type === 'lunch-out' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div className="flex-1">
                          <span className="text-[13px] text-app font-medium">
                            {entryLabels[entry.type]}
                          </span>
                        </div>
                        <span className="text-[15px] font-semibold text-app mr-1">
                          {formatTime(entry.timestamp)}
                        </span>
                        <EntryEditor
                          entryId={entry.id}
                          entryType={entryLabels[entry.type]}
                          timestamp={entry.timestamp}
                          date={entry.date}
                          compact
                        />
                      </div>
                    ))}

                    {selectedTotal > 0 && (
                      <div className="border-t border-app pt-3 flex items-center justify-between">
                        <span className="text-[11px] text-app-secondary">Total trabalhado</span>
                        <span className="text-lg font-semibold text-emerald-500">
                          {formatDuration(selectedTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
