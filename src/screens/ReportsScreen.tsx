import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import {
  calculateDayTotal, formatDuration, getTodayString,
  exportToCSV, getWeekDays,
} from '@/lib/data';

export default function ReportsScreen() {
  const { state } = useAppState();
  const [period, setPeriod] = useState<'semana' | 'mes'>('mes');
  const today = getTodayString();

  const stats = useMemo(() => {
    const now = new Date();
    let filteredEntries = state.entries;

    if (period === 'semana') {
      const weekDays = getWeekDays();
      const startDate = weekDays[0].date;
      const endDate = weekDays[4].date;
      filteredEntries = state.entries.filter(e => e.date >= startDate && e.date <= endDate);
    } else {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filteredEntries = state.entries.filter(e => e.date.startsWith(monthPrefix));
    }

    const uniqueDays = [...new Set(filteredEntries.map(e => e.date))];
    let totalWorked = 0;
    let overtime = 0;
    let workDays = 0;

    for (const date of uniqueDays) {
      const dayTotal = calculateDayTotal(state.entries, date);
      totalWorked += dayTotal;
      workDays++;
      if (dayTotal > state.profile.dailyTarget * 60) {
        overtime += dayTotal - state.profile.dailyTarget * 60;
      }
    }

    const targetTotal = workDays * state.profile.dailyTarget * 60;
    const remaining = Math.max(0, targetTotal - totalWorked);

    return { totalWorked, overtime, remaining, workDays };
  }, [state.entries, state.profile.dailyTarget, period]);

  const barChartData = useMemo(() => {
    const now = new Date();
    let days: { label: string; date: string }[] = [];

    if (period === 'semana') {
      days = getWeekDays();
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'];
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          days.push({ label: labels[i - 1], date: ds });
        }
      }
      // Limit to 10 bars for readability
      days = days.slice(0, 10);
    }

    return days.map(d => {
      const total = calculateDayTotal(state.entries, d.date);
      const overtime = Math.max(0, total - state.profile.dailyTarget * 60);
      return { ...d, total, overtime };
    });
  }, [state.entries, state.profile.dailyTarget, period]);

  const maxHours = useMemo(() => {
    return Math.max(...barChartData.map(d => d.total / 60), state.profile.dailyTarget);
  }, [barChartData, state.profile.dailyTarget]);

  const handleExportCSV = () => {
    const csv = exportToCSV(state.entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ponto_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const csv = exportToCSV(state.entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const file = new File([blob], `ponto_${today}.csv`, { type: 'text/csv' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Relatório de Ponto' });
      } catch {
        handleExportCSV();
      }
    } else {
      handleExportCSV();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 pt-5 pb-4"
      >
        <h1 className="text-[28px] font-bold text-[#F1F5F9] mb-3">Relatórios</h1>
        <div className="flex bg-[#1E293B] rounded-xl p-1">
          {(['semana', 'mes'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors ${
                period === p
                  ? 'bg-emerald-500 text-white'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {p === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1E293B] rounded-2xl p-4 mb-5"
        >
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Resumo do Período</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Horas Trabalhadas', value: formatDuration(stats.totalWorked), icon: TrendingUp, color: 'text-[#F1F5F9]' },
              { label: 'Horas Extras', value: formatDuration(stats.overtime), icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Horas a Trabalhar', value: formatDuration(stats.remaining), icon: TrendingDown, color: 'text-amber-500' },
              { label: 'Dias Trabalhados', value: `${stats.workDays}`, icon: TrendingUp, color: 'text-[#F1F5F9]' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-[#0F172A] rounded-xl p-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon size={12} className={stat.color} />
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wide">{stat.label}</span>
                </div>
                <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1E293B] rounded-2xl p-4 mb-5"
        >
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Horas por Dia</h2>
          <div className="relative">
            {/* Target line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-[#64748B] z-10"
              style={{ bottom: `${(state.profile.dailyTarget / maxHours) * 120}px` }}
            />

            <div className="flex items-end gap-2 h-[140px]">
              {barChartData.map((d, idx) => {
                const height = Math.max((d.total / 60 / maxHours) * 120, 4);
                const overtimeHeight = Math.max((d.overtime / 60 / maxHours) * 120, 0);
                return (
                  <motion.div
                    key={d.date}
                    className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                  >
                    <div className="w-full flex justify-center" style={{ height: 120 }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height }}
                        transition={{ duration: 0.5, delay: 0.3 + idx * 0.05, ease: 'easeOut' }}
                        className="w-5 rounded-t-md relative"
                        style={{
                          background: d.overtime > 0
                            ? `linear-gradient(to top, #10B981 ${height - overtimeHeight}px, #F59E0B ${overtimeHeight}px)`
                            : '#10B981',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-[#64748B] mt-1 truncate max-w-full">
                      {d.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-3">Exportar</h2>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex-1 bg-[#1E293B] rounded-xl p-4 flex items-center gap-3 active:bg-[#334155] transition-colors"
            >
              <FileText size={20} className="text-emerald-500" />
              <div className="text-left">
                <span className="text-[13px] font-semibold text-[#F1F5F9] block">Exportar CSV</span>
                <span className="text-[11px] text-[#64748B]">Download do arquivo</span>
              </div>
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-[#1E293B] rounded-xl p-4 flex items-center gap-3 active:bg-[#334155] transition-colors"
            >
              <Share2 size={20} className="text-emerald-500" />
              <div className="text-left">
                <span className="text-[13px] font-semibold text-[#F1F5F9] block">Compartilhar</span>
                <span className="text-[11px] text-[#64748B]">Enviar relatório</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
