import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Bell, Moon, FileText, LogOut, Lock, Shield, Pencil } from "lucide-react";
import { useAppState, useAuthMutations, useToast, useUserMutations } from "@/context/AppContext";
import { useTheme } from "@/providers/theme";

export default function ProfileScreen() {
  const { state, logout } = useAppState();
  const { changePassword } = useAuthMutations();
  const { updateUser } = useUserMutations();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [notificationsOn, setNotificationsOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("pontocerto_notifications") !== "false";
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editWorkStartTime, setEditWorkStartTime] = useState(state.profile.workStartTime);
  const [editWorkEndTime, setEditWorkEndTime] = useState(state.profile.workEndTime);
  const [editLunchDuration, setEditLunchDuration] = useState(String(state.profile.lunchDuration));
  const [editDailyTarget, setEditDailyTarget] = useState(String(state.profile.dailyTarget));

  const scheduleItems = [
    { key: "workStartTime", label: "Horario de Entrada", value: state.profile.workStartTime },
    { key: "workEndTime", label: "Horario de Saida", value: state.profile.workEndTime },
    { key: "lunchDuration", label: "Duracao do Almoco", value: `${state.profile.lunchDuration} min` },
    { key: "dailyTarget", label: "Meta Diaria", value: `${Math.floor(state.profile.dailyTarget)}h ${Math.round((state.profile.dailyTarget % 1) * 60)}min` },
  ];

  const toggleNotifications = async () => {
    const next = !notificationsOn;
    setNotificationsOn(next);
    localStorage.setItem("pontocerto_notifications", String(next));
    if (next && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Permissao de notificacao negada", "warning");
      }
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("As senhas nao coincidem", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("A nova senha deve ter no minimo 6 caracteres", "error");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Senha alterada com sucesso", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao alterar senha";
      showToast(message, "error");
    }
  };

  const openEditSchedule = () => {
    setEditWorkStartTime(state.profile.workStartTime);
    setEditWorkEndTime(state.profile.workEndTime);
    setEditLunchDuration(String(state.profile.lunchDuration));
    setEditDailyTarget(String(state.profile.dailyTarget));
    setShowEditSchedule(true);
  };

  const handleSaveSchedule = async () => {
    if (!state.profile.id) {
      showToast("Usuario nao identificado", "error");
      return;
    }

    const lunchDuration = parseInt(editLunchDuration, 10);
    const dailyTargetHours = parseFloat(editDailyTarget);

    if (!editWorkStartTime.match(/^\d{2}:\d{2}$/)) {
      showToast("Horario de entrada invalido", "error");
      return;
    }
    if (!editWorkEndTime.match(/^\d{2}:\d{2}$/)) {
      showToast("Horario de saida invalido", "error");
      return;
    }
    if (isNaN(lunchDuration) || lunchDuration < 15 || lunchDuration > 180) {
      showToast("Duracao do almoco deve ser entre 15 e 180 minutos", "error");
      return;
    }
    if (isNaN(dailyTargetHours) || dailyTargetHours < 1 || dailyTargetHours > 24) {
      showToast("Meta diaria invalida", "error");
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: state.profile.id,
        workStartTime: editWorkStartTime,
        workEndTime: editWorkEndTime,
        lunchDuration,
        dailyTarget: Math.round(dailyTargetHours * 60),
      });
      setShowEditSchedule(false);
      showToast("Jornada de trabalho atualizada", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar jornada";
      showToast(message, "error");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 pb-4">
        <h1 className="text-[28px] font-bold text-app">Perfil</h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Profile Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, delay: 0.1 }}
          className="bg-app-card rounded-2xl p-5 flex flex-col items-center mb-5"
        >
          <div className="relative mb-3">
            <img src={state.profile.avatar} alt={state.profile.name} className="w-16 h-16 rounded-full object-cover border-[3px] border-emerald-500" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-app-card flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-app">{state.profile.name}</h2>
          {state.profile.company && (
            <p className="text-[14px] text-app-secondary mt-0.5">{state.profile.company}</p>
          )}
          {state.profile.role && (
            <p className="text-[12px] text-app-muted mt-0.5">{state.profile.role}</p>
          )}
          <p className="text-[11px] text-app-muted mt-1">@{state.profile.username}</p>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4">
          <button onClick={() => setShowChangePassword(true)} className="w-full bg-app-card rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-app-border/50">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-emerald-500" />
              <span className="text-[15px] text-app">Alterar Senha</span>
            </div>
            <ChevronRight size={16} className="text-app-muted" />
          </button>
        </motion.div>

        {/* Work Schedule */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-app">Jornada de Trabalho</h3>
            <button
              onClick={openEditSchedule}
              className="flex items-center gap-1 text-emerald-500 text-sm active:opacity-70"
            >
              <Pencil size={14} />
              <span>Editar</span>
            </button>
          </div>
          <div className="space-y-2">
            {scheduleItems.map((item, idx) => (
              <motion.div
                key={item.key}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="w-full bg-app-card rounded-xl px-4 py-3.5 flex items-center justify-between"
              >
                <span className="text-[15px] text-app">{item.label}</span>
                <span className="text-[13px] text-app-secondary">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-5">
          <h3 className="text-base font-semibold text-app mb-3">Configuracoes</h3>
          <div className="space-y-2">
            <div className="bg-app-card rounded-xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-app-secondary" />
                <span className="text-[15px] text-app">Notificacoes</span>
              </div>
              <button onClick={toggleNotifications} className={`w-11 h-6 rounded-full transition-colors relative ${notificationsOn ? "bg-emerald-500" : "bg-app-border"}`}>
                <motion.div animate={{ x: notificationsOn ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 shadow-sm" />
              </button>
            </div>

            <div className="bg-app-card rounded-xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-app-secondary" />
                <span className="text-[15px] text-app">Modo Escuro</span>
              </div>
              <button onClick={toggleTheme} className={`w-11 h-6 rounded-full transition-colors relative ${theme === "dark" ? "bg-emerald-500" : "bg-app-border"}`}>
                <motion.div animate={{ x: theme === "dark" ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 shadow-sm" />
              </button>
            </div>

            <button
              onClick={() => {
                const csv = `data:text/csv;charset=utf-8,${encodeURIComponent("Data,Tipo,Horario\n" + state.entries.map((e) => `${e.date},${e.type},${new Date(e.timestamp).toLocaleTimeString("pt-BR")}`).join("\n"))}`;
                const link = document.createElement("a");
                link.href = csv;
                link.download = `ponto_completo_${new Date().toISOString().split("T")[0]}.csv`;
                link.click();
              }}
              className="w-full bg-app-card rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-app-border/50"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-app-secondary" />
                <span className="text-[15px] text-app">Exportar Todos os Dados</span>
              </div>
              <ChevronRight size={16} className="text-app-muted" />
            </button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 mb-4">
          <button onClick={logout} className="w-full bg-app-card rounded-xl px-4 py-4 flex items-center justify-center gap-3 active:bg-red-500/10 transition-colors">
            <LogOut size={18} className="text-red-500" />
            <span className="text-[15px] text-red-500 font-medium">Sair da Conta</span>
          </button>
        </motion.div>

        <div className="flex items-center gap-2 justify-center mb-4">
          <Shield size={12} className="text-emerald-500" />
          <span className="text-[11px] text-app-muted">Sessao segura - JWT protegido</span>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setShowChangePassword(false)}>
          <div className="bg-app-card rounded-2xl p-6 w-[85%] max-w-[320px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Lock size={18} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-app">Alterar Senha</h3>
            </div>
            <p className="text-[12px] text-app-muted mb-4">Digite sua senha atual e a nova senha</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Senha atual</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500 placeholder-app" placeholder="••••••" />
              </div>
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Nova senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500 placeholder-app" placeholder="Minimo 6 caracteres" />
              </div>
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Confirmar nova senha</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500 placeholder-app" placeholder="••••••" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 h-11 bg-app-border rounded-xl text-app font-medium text-sm">Cancelar</button>
              <button onClick={handleChangePassword} disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending} className="flex-1 h-11 bg-emerald-500 rounded-xl text-white font-medium text-sm disabled:opacity-50">
                {changePassword.isPending ? "..." : "Alterar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Schedule Modal */}
      {showEditSchedule && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setShowEditSchedule(false)}>
          <div className="bg-app-card rounded-2xl p-6 w-[85%] max-w-[320px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Pencil size={18} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-app">Editar Jornada</h3>
            </div>
            <p className="text-[12px] text-app-muted mb-4">Ajuste os horarios da sua jornada de trabalho</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Horario de Entrada</label>
                <input
                  type="time"
                  value={editWorkStartTime}
                  onChange={(e) => setEditWorkStartTime(e.target.value)}
                  className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Horario de Saida</label>
                <input
                  type="time"
                  value={editWorkEndTime}
                  onChange={(e) => setEditWorkEndTime(e.target.value)}
                  className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Duracao do Almoco (min)</label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={editLunchDuration}
                  onChange={(e) => setEditLunchDuration(e.target.value)}
                  className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[12px] text-app-secondary mb-1 block">Meta Diaria (horas)</label>
                <input
                  type="number"
                  step={0.1}
                  min={1}
                  max={24}
                  value={editDailyTarget}
                  onChange={(e) => setEditDailyTarget(e.target.value)}
                  className="w-full h-11 bg-app-input border border-app rounded-xl px-4 text-app text-[14px] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowEditSchedule(false)} className="flex-1 h-11 bg-app-border rounded-xl text-app font-medium text-sm">Cancelar</button>
              <button
                onClick={handleSaveSchedule}
                disabled={updateUser.isPending}
                className="flex-1 h-11 bg-emerald-500 rounded-xl text-white font-medium text-sm disabled:opacity-50"
              >
                {updateUser.isPending ? "..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
