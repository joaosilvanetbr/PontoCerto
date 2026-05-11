import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Bell, Moon, FileText, LogOut, Lock, Shield } from "lucide-react";
import { useAppState, useAuthMutations, useToast } from "@/context/AppContext";

export default function ProfileScreen() {
  const { state, logout } = useAppState();
  const { changePassword } = useAuthMutations();
  const { showToast } = useToast();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const scheduleItems = [
    { key: "workStartTime", label: "Horario de Entrada", value: state.profile.workStartTime },
    { key: "workEndTime", label: "Horario de Saida", value: state.profile.workEndTime },
    { key: "lunchDuration", label: "Duracao do Almoco", value: `${state.profile.lunchDuration} min` },
    { key: "dailyTarget", label: "Meta Diaria", value: `${Math.floor(state.profile.dailyTarget)}h ${Math.round((state.profile.dailyTarget % 1) * 60)}min` },
  ];

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
      const result = await changePassword.mutateAsync({ currentPassword, newPassword });
      if (result.token) {
        localStorage.setItem("pontocerto_token", result.token);
      }
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

  return (
    <div className="flex flex-col h-full">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-5 pb-4">
        <h1 className="text-[28px] font-bold text-[#F1F5F9]">Perfil</h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-4">
        {/* Profile Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, delay: 0.1 }}
          className="bg-[#1E293B] rounded-2xl p-5 flex flex-col items-center mb-5"
        >
          <div className="relative mb-3">
            <img src={state.profile.avatar} alt={state.profile.name} className="w-16 h-16 rounded-full object-cover border-[3px] border-emerald-500" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#1E293B] flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-[#F1F5F9]">{state.profile.name}</h2>
          {state.profile.company && (
            <p className="text-[14px] text-[#94A3B8] mt-0.5">{state.profile.company}</p>
          )}
          {state.profile.role && (
            <p className="text-[12px] text-[#64748B] mt-0.5">{state.profile.role}</p>
          )}
          <p className="text-[11px] text-[#475569] mt-1">@{state.profile.username}</p>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4">
          <button onClick={() => setShowChangePassword(true)} className="w-full bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-[#334155]">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-emerald-500" />
              <span className="text-[15px] text-[#F1F5F9]">Alterar Senha</span>
            </div>
            <ChevronRight size={16} className="text-[#64748B]" />
          </button>
        </motion.div>

        {/* Work Schedule */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-5">
          <h3 className="text-base font-semibold text-[#F1F5F9] mb-3">Jornada de Trabalho</h3>
          <div className="space-y-2">
            {scheduleItems.map((item, idx) => (
              <motion.div
                key={item.key}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="w-full bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between"
              >
                <span className="text-[15px] text-[#F1F5F9]">{item.label}</span>
                <span className="text-[13px] text-[#94A3B8]">{item.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-5">
          <h3 className="text-base font-semibold text-[#F1F5F9] mb-3">Configuracoes</h3>
          <div className="space-y-2">
            <div className="bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-[#94A3B8]" />
                <span className="text-[15px] text-[#F1F5F9]">Notificacoes</span>
              </div>
              <button onClick={() => setNotificationsOn(!notificationsOn)} className={`w-11 h-6 rounded-full transition-colors relative ${notificationsOn ? "bg-emerald-500" : "bg-[#334155]"}`}>
                <motion.div animate={{ x: notificationsOn ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 shadow-sm" />
              </button>
            </div>

            <div className="bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-[#94A3B8]" />
                <span className="text-[15px] text-[#F1F5F9]">Modo Escuro</span>
              </div>
              <div className="w-11 h-6 rounded-full bg-emerald-500 relative">
                <div className="w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 right-0.75 shadow-sm" />
              </div>
            </div>

            <button
              onClick={() => {
                const csv = `data:text/csv;charset=utf-8,${encodeURIComponent("Data,Tipo,Horario\n" + state.entries.map((e) => `${e.date},${e.type},${new Date(e.timestamp).toLocaleTimeString("pt-BR")}`).join("\n"))}`;
                const link = document.createElement("a");
                link.href = csv;
                link.download = `ponto_completo_${new Date().toISOString().split("T")[0]}.csv`;
                link.click();
              }}
              className="w-full bg-[#1E293B] rounded-xl px-4 py-3.5 flex items-center justify-between active:bg-[#334155]"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[#94A3B8]" />
                <span className="text-[15px] text-[#F1F5F9]">Exportar Todos os Dados</span>
              </div>
              <ChevronRight size={16} className="text-[#64748B]" />
            </button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 mb-4">
          <button onClick={logout} className="w-full bg-[#1E293B] rounded-xl px-4 py-4 flex items-center justify-center gap-3 active:bg-red-500/10 transition-colors">
            <LogOut size={18} className="text-red-500" />
            <span className="text-[15px] text-red-500 font-medium">Sair da Conta</span>
          </button>
        </motion.div>

        <div className="flex items-center gap-2 justify-center mb-4">
          <Shield size={12} className="text-emerald-500" />
          <span className="text-[11px] text-[#64748B]">Sessao segura - JWT protegido</span>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setShowChangePassword(false)}>
          <div className="bg-[#1E293B] rounded-2xl p-6 w-[85%] max-w-[320px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Lock size={18} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-[#F1F5F9]">Alterar Senha</h3>
            </div>
            <p className="text-[12px] text-[#64748B] mb-4">Digite sua senha atual e a nova senha</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-[#94A3B8] mb-1 block">Senha atual</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-xl px-4 text-[#F1F5F9] text-[14px] focus:outline-none focus:border-emerald-500" placeholder="••••••" />
              </div>
              <div>
                <label className="text-[12px] text-[#94A3B8] mb-1 block">Nova senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-xl px-4 text-[#F1F5F9] text-[14px] focus:outline-none focus:border-emerald-500" placeholder="Minimo 6 caracteres" />
              </div>
              <div>
                <label className="text-[12px] text-[#94A3B8] mb-1 block">Confirmar nova senha</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-11 bg-[#0F172A] border border-[#334155] rounded-xl px-4 text-[#F1F5F9] text-[14px] focus:outline-none focus:border-emerald-500" placeholder="••••••" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 h-11 bg-[#334155] rounded-xl text-[#F1F5F9] font-medium text-sm">Cancelar</button>
              <button onClick={handleChangePassword} disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending} className="flex-1 h-11 bg-emerald-500 rounded-xl text-white font-medium text-sm disabled:opacity-50">
                {changePassword.isPending ? "..." : "Alterar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
