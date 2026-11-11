import React, { useState, useMemo } from 'react';
import type { MedicalClinic } from '../../types/clinic';
import { formatCNPJ } from '../../utils/cnpj';
import { getLiveContractStatus, getContractStatusBadgeClass } from '../../utils/contract';
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
  MapPin,
  FileText,
  Clock,
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
  const [contractFilter, setContractFilter] = useState<'ALL' | 'VIGENTE' | 'A_VENCER' | 'LEAD'>('ALL');

  // Metrics
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter((c) => c.status === 'ATIVO').length;
  const totalDoctors = clinics.reduce((acc, c) => acc + (c.membersCount?.medicos || 0), 0);
  const totalUnits = clinics.reduce((acc, c) => acc + (c.units?.length || 1), 0);

  // Filtered clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const term = search.toLowerCase().trim();
      const live = getLiveContractStatus(c.contractStatus, c.contractEndDate);

      const matchesSearch =
        !term ||
        c.companyName.toLowerCase().includes(term) ||
        (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
        c.cnpj.includes(term) ||
        c.technicalResponsibleCrm.toLowerCase().includes(term) ||
        (c.technicalResponsibleName && c.technicalResponsibleName.toLowerCase().includes(term)) ||
        (c.city && c.city.toLowerCase().includes(term)) ||
        (c.specialties && c.specialties.some((s) => s.toLowerCase().includes(term))) ||
        (c.units && c.units.some((u) => u.name.toLowerCase().includes(term) || (u.city && u.city.toLowerCase().includes(term))));

      let matchesContract = true;
      if (contractFilter === 'VIGENTE') {
        matchesContract = live.status === 'CONTRATO_VIGENTE';
      } else if (contractFilter === 'A_VENCER') {
        matchesContract = live.status === 'CONTRATO_A_VENCER' || live.status === 'CONTRATO_VENCIDO';
      } else if (contractFilter === 'LEAD') {
        matchesContract = live.status === 'LEAD' || live.status === 'EM_NEGOCIACAO';
      }

      return matchesSearch && matchesContract;
    });
  }, [clinics, search, contractFilter]);

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
          <p className="text-[11px] text-slate-400 mt-0.5">{activeClinics} operando no CRM</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unidades / Filiais</span>
            <MapPin className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-700">{totalUnits}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Locais para agendamento</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Médicos Vinculados</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900">{totalDoctors}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Corpo clínico ativo</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contratos Vigentes</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {
              clinics.filter((c) => {
                const l = getLiveContractStatus(c.contractStatus, c.contractEndDate);
                return l.status === 'CONTRATO_VIGENTE';
              }).length
            }
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {
              clinics.filter((c) => {
                const l = getLiveContractStatus(c.contractStatus, c.contractEndDate);
                return l.status === 'CONTRATO_A_VENCER';
              }).length
            }{' '}
            a vencer
          </p>
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
              placeholder="Buscar por Clínica, Fantasia, CNPJ, CRM, Cidade ou Unidade..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-2xs"
            />
          </div>

          {/* Contract Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setContractFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                contractFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({totalClinics})
            </button>
            <button
              type="button"
              onClick={() => setContractFilter('VIGENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                contractFilter === 'VIGENTE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vigentes
            </button>
            <button
              type="button"
              onClick={() => setContractFilter('A_VENCER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                contractFilter === 'A_VENCER'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A Vencer / Vencidas
            </button>
            <button
              type="button"
              onClick={() => setContractFilter('LEAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                contractFilter === 'LEAD'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leads / Em Negociação
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

      {/* Main Table */}
      {filteredClinics.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma clínica encontrada</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search || contractFilter !== 'ALL'
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
                  <th className="py-3.5 px-4 sm:px-6">Clínica & Logo</th>
                  <th className="py-3.5 px-4">Responsável Técnico</th>
                  <th className="py-3.5 px-4">Unidades / Atendimento</th>
                  <th className="py-3.5 px-4">Contrato & Vigência</th>
                  <th className="py-3.5 px-4">Corpo Clínico</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClinics.map((clinic) => {
                  const doctors = clinic.membersCount?.medicos || 0;
                  const secretaries = clinic.membersCount?.secretarias || 0;
                  const unitCount = clinic.units?.length || 1;
                  const liveContract = getLiveContractStatus(clinic.contractStatus, clinic.contractEndDate);

                  return (
                    <tr
                      key={clinic.id}
                      className="hover:bg-slate-50/70 transition group cursor-pointer"
                      onClick={() => onViewClinic(clinic)}
                    >
                      {/* Name, Logo & CNPJ */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {clinic.logo ? (
                            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <img
                                src={clinic.logo}
                                alt={clinic.companyName}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}

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
                            {clinic.technicalResponsibleName || 'Responsável técnico'}
                          </p>
                        </div>
                      </td>

                      {/* Units */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 border border-sky-100 text-sky-800 rounded-md font-semibold text-[11px]">
                            <MapPin className="w-3 h-3 text-sky-600" />
                            {unitCount} {unitCount === 1 ? 'Unidade' : 'Unidades'}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[170px]">
                            {[clinic.city, clinic.state].filter(Boolean).join(' - ') || 'Brasil'}
                          </p>
                        </div>
                      </td>

                      {/* Contract & Validity */}
                      <td className="py-4 px-4">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getContractStatusBadgeClass(
                              liveContract.status
                            )}`}
                          >
                            {liveContract.label}
                          </span>
                          {clinic.contractEndDate && (
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Vigência:{' '}
                              {new Date(clinic.contractEndDate + 'T00:00:00').toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Members Count */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
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

                      {/* Operational Status */}
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
                            title="Gerenciar Equipe, Unidades e Detalhes"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Gerenciar
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEditModal(clinic)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="Editar dados cadastrais e unidades"
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
