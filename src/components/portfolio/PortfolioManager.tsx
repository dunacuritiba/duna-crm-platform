import React, { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type { MedicalClinic } from '../../types/clinic';
import { getLiveContractStatus, getContractStatusBadgeClass } from '../../utils/contract';
import { saveAttendantPortfolio } from '../../services/portfolioService';
import {
  Briefcase,
  Users,
  Building2,
  Headphones,
  Search,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface PortfolioManagerProps {
  users: User[];
  clinics: MedicalClinic[];
  onOpenPortfolioModal: (attendant: User) => void;
  onGoToUsers: () => void;
  onGoToSchedule: () => void;
  onRefresh: () => Promise<void>;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  users,
  clinics,
  onOpenPortfolioModal,
  onGoToUsers,
  onGoToSchedule,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [assigningClinicId, setAssigningClinicId] = useState<string | null>(null);

  // Attendants list (users with role ATENDENTE)
  const attendants = useMemo(() => {
    return users.filter((u) => u.role === 'ATENDENTE' && u.status === 'ATIVO');
  }, [users]);

  // Portfolio metrics
  const metrics = useMemo(() => {
    const totalClinics = clinics.length;
    const assignedClinics = clinics.filter((c) => !!c.assignedAttendantId).length;
    const unassignedClinics = totalClinics - assignedClinics;
    const totalAttendants = attendants.length;

    return { totalClinics, assignedClinics, unassignedClinics, totalAttendants };
  }, [clinics, attendants]);

  // Unassigned clinics
  const unassignedClinicsList = useMemo(() => {
    return clinics.filter((c) => !c.assignedAttendantId);
  }, [clinics]);

  // Quick single assign handler
  const handleQuickAssign = async (clinicId: string, attendantId: string) => {
    if (!attendantId) return;
    try {
      setAssigningClinicId(clinicId);
      // Fetch current clinics for that attendant and add this one
      const currentIds = clinics
        .filter((c) => c.assignedAttendantId === attendantId)
        .map((c) => c.id);
      const newIds = Array.from(new Set([...currentIds, clinicId]));

      await saveAttendantPortfolio(attendantId, newIds);
      await onRefresh();
    } catch (err) {
      console.error('Erro na atribuição rápida:', err);
    } finally {
      setAssigningClinicId(null);
    }
  };

  // Filtered attendants
  const filteredAttendants = useMemo(() => {
    return attendants.filter((att) => {
      const matchSearch =
        att.name.toLowerCase().includes(search.toLowerCase()) ||
        att.email.toLowerCase().includes(search.toLowerCase()) ||
        (att.department && att.department.toLowerCase().includes(search.toLowerCase()));

      return matchSearch;
    });
  }, [attendants, search]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Gestão de Carteiras de Clientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Distribuição, acompanhamento e balanceamento de clínicas médicas entre os atendentes da equipe.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToUsers}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <Users className="w-4 h-4" />
          Gerenciar Equipe de Atendimento
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total de Clínicas
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalClinics}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Clientes cadastrados no CRM</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Distribuídas na Carteira
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics.assignedClinics}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Com atendente responsável</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
            Sem Atendente
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{metrics.unassignedClinics}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Aguardando atribuição</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
            Equipe de Atendimento
          </span>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{metrics.totalAttendants}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Atendentes ativos</p>
        </div>
      </div>

      {/* Section: Unassigned Clinics Action Bar */}
      {unassignedClinicsList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-sm font-bold text-amber-950">
              {unassignedClinicsList.length} clínica(s) sem atendente atribuído
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            Distribua rapidamente as clínicas abaixo para a carteira de um atendente para que ele possa gerenciar os agendamentos e contatos:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
            {unassignedClinicsList.map((clinic) => (
              <div
                key={clinic.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <p
                    className="font-bold text-xs text-slate-800 truncate"
                    title={clinic.tradeName || clinic.companyName}
                  >
                    {clinic.tradeName || clinic.companyName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{clinic.cnpj}</p>
                </div>

                <select
                  disabled={assigningClinicId === clinic.id || attendants.length === 0}
                  onChange={(e) => handleQuickAssign(clinic.id, e.target.value)}
                  defaultValue=""
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 focus:outline-none cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <option value="" disabled>
                    + Atribuir Atendente
                  </option>
                  {attendants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar atendente por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
          />
        </div>

        <button
          onClick={onGoToSchedule}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
        >
          <Calendar className="w-3.5 h-3.5" />
          Ver Agendas dos Clientes
        </button>
      </div>

      {/* Attendant Portfolio Cards */}
      {filteredAttendants.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Headphones className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum atendente cadastrado na equipe
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Para criar carteiras de atendimento, edite os usuários existentes na aba "Gestão de Usuários" e defina o papel como <strong>Equipe de Atendimento</strong>.
          </p>
          <button
            onClick={onGoToUsers}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Ir para Gestão de Usuários
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAttendants.map((attendant) => {
            const attendantClinics = clinics.filter(
              (c) =>
                c.assignedAttendantId === attendant.id ||
                attendant.assignedClinicIds?.includes(c.id)
            );

            return (
              <div
                key={attendant.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-amber-300 transition"
              >
                <div>
                  {/* Attendant Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={attendant.avatar}
                        alt={attendant.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{attendant.name}</h4>
                        <p className="text-xs text-slate-400">{attendant.email}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                          <Headphones className="w-2.5 h-2.5 text-amber-600" />
                          {attendant.department || 'Atendimento'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-700">
                        {attendantClinics.length}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {attendantClinics.length === 1 ? 'cliente' : 'clientes'}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Clinics Preview Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Clínicas na Carteira ({attendantClinics.length})
                    </p>

                    {attendantClinics.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                        Nenhuma clínica atribuída a este atendente ainda.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {attendantClinics.map((c) => {
                          const live = getLiveContractStatus(c.contractStatus, c.contractEndDate);
                          return (
                            <div
                              key={c.id}
                              className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="font-semibold text-slate-800 truncate">
                                  {c.tradeName || c.companyName}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getContractStatusBadgeClass(
                                  live.status
                                )}`}
                              >
                                {live.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPortfolioModal(attendant)}
                    className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    Distribuir / Editar Carteira ({attendantClinics.length})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
