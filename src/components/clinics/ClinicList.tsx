import React, { useState, useMemo } from 'react';
import type { MedicalClinic } from '../../types/clinic';
import { formatCNPJ } from '../../utils/cnpj';
import {
  Building2,
  Stethoscope,
  Briefcase,
  Search,
  Plus,
  Edit2,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ClinicListProps {
  clinics: MedicalClinic[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (clinic: MedicalClinic) => void;
  onViewClinic: (clinic: MedicalClinic) => void;
  onToggleStatus: (clinicId: string, currentStatus: 'ATIVO' | 'INATIVO') => void;
}

export const ClinicList: React.FC<ClinicListProps> = ({
  clinics,
  onOpenCreateModal,
  onOpenEditModal,
  onViewClinic,
  onToggleStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ATIVO' | 'INATIVO'>('ALL');

  // Metrics
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter((c) => c.status === 'ATIVO').length;
  const totalDoctors = clinics.reduce((acc, c) => acc + (c.membersCount?.medicos || 0), 0);
  const totalSecretaries = clinics.reduce((acc, c) => acc + (c.membersCount?.secretarias || 0), 0);

  // Filtered clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        c.companyName.toLowerCase().includes(term) ||
        (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
        c.cnpj.includes(term) ||
        c.technicalResponsibleCrm.toLowerCase().includes(term) ||
        (c.technicalResponsibleName && c.technicalResponsibleName.toLowerCase().includes(term)) ||
        (c.city && c.city.toLowerCase().includes(term)) ||
        (c.specialties && c.specialties.some((s) => s.toLowerCase().includes(term)));

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clinics, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Clínicas</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalClinics}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeClinics} unidades ativas</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clínicas Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{activeClinics}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Operando no CRM</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Médicos Vinculados</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900">{totalDoctors}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Com CRM cadastrado</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Secretárias</span>
            <Briefcase className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-900">{totalSecretaries}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recepção & Atendimento</p>
        </div>
      </div>

      {/* Action / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Razão Social, Fantasia, CNPJ, CRM ou Especialidade..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({totalClinics})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ATIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'ATIVO'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativas ({activeClinics})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INATIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'INATIVO'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inativas ({totalClinics - activeClinics})
            </button>
          </div>
        </div>

        {/* Create Clinic Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Nova Clínica
        </button>
      </div>

      {/* Main Table / Grid */}
      {filteredClinics.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma clínica encontrada</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'Tente ajustar os filtros de busca para encontrar o registro desejado.'
              : 'Cadastre a primeira clínica médica no sistema puxando diretamente os dados pelo CNPJ.'}
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Clínica Médica
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Clínica & CNPJ</th>
                  <th className="py-3.5 px-4">Responsável Técnico</th>
                  <th className="py-3.5 px-4">Áreas de Atuação</th>
                  <th className="py-3.5 px-4">Corpo Clínico</th>
                  <th className="py-3.5 px-4">Localização</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClinics.map((clinic) => {
                  const doctors = clinic.membersCount?.medicos || 0;
                  const secretaries = clinic.membersCount?.secretarias || 0;

                  return (
                    <tr
                      key={clinic.id}
                      className="hover:bg-slate-50/70 transition group cursor-pointer"
                      onClick={() => onViewClinic(clinic)}
                    >
                      {/* Name & CNPJ */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[220px]">
                              {clinic.tradeName || clinic.companyName}
                            </p>
                            {clinic.tradeName && clinic.tradeName !== clinic.companyName && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                {clinic.companyName}
                              </p>
                            )}
                            <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                              {formatCNPJ(clinic.cnpj)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Technical Responsible */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="font-mono font-bold text-indigo-950 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-indigo-600" />
                            {clinic.technicalResponsibleCrm}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-1 truncate max-w-[160px]">
                            {clinic.technicalResponsibleName || 'Responsável não nominado'}
                          </p>
                        </div>
                      </td>

                      {/* Specialties */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {clinic.specialties.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium truncate"
                            >
                              {s}
                            </span>
                          ))}
                          {clinic.specialties.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-semibold">
                              +{clinic.specialties.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Members Count */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-medium">
                            <Stethoscope className="w-3 h-3" />
                            {doctors} {doctors === 1 ? 'Médico' : 'Médicos'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 font-medium">
                            <Briefcase className="w-3 h-3" />
                            {secretaries} {secretaries === 1 ? 'Secretária' : 'Secretárias'}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4">
                        <div className="text-slate-600 text-[11px] leading-tight">
                          <p className="font-medium text-slate-800">
                            {[clinic.city, clinic.state].filter(Boolean).join(' - ') || 'Brasil'}
                          </p>
                          {clinic.neighborhood && (
                            <p className="text-slate-400 truncate max-w-[140px]">
                              {clinic.neighborhood}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            clinic.status === 'ATIVO'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {clinic.status === 'ATIVO' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Ativa
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inativa
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewClinic(clinic)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                            title="Gerenciar Equipe e Detalhes"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Equipe
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEditModal(clinic)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="Editar dados cadastrais"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleStatus(clinic.id, clinic.status)}
                            className={`p-1.5 rounded-xl transition ${
                              clinic.status === 'ATIVO'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={clinic.status === 'ATIVO' ? 'Inativar clínica' : 'Ativar clínica'}
                          >
                            {clinic.status === 'ATIVO' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
