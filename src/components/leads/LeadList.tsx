import React, { useState, useMemo } from 'react';
import type { Lead, LeadStatus, LeadTemperature } from '../../types/lead';
import {
  getLeadStatusBadgeClass,
  getLeadTemperatureLabel,
  getLeadTemperatureBadgeClass,
  getLeadTypeLabel,
} from '../../utils/lead';
import {
  UserCheck,
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Flame,
  DollarSign,
  Calendar,
  LayoutGrid,
  List,
  TrendingUp,
  User,
} from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (lead: Lead) => void;
  onViewLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => Promise<void>;
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
}

const KANBAN_STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'NOVO', label: 'Novos Leads', color: 'border-blue-400' },
  { id: 'CONTATO_REALIZADO', label: 'Contato Realizado', color: 'border-purple-400' },
  { id: 'QUALIFICADO', label: 'Qualificados', color: 'border-sky-400' },
  { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: 'border-indigo-400' },
  { id: 'NEGOCIACAO', label: 'Em Negociação', color: 'border-amber-400' },
  { id: 'CONVERTIDO', label: 'Ganhos / Convertidos', color: 'border-emerald-400' },
];

export const LeadList: React.FC<LeadListProps> = ({
  leads,
  onOpenCreateModal,
  onOpenEditModal,
  onViewLead,
  onDeleteLead,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [temperatureFilter, setTemperatureFilter] = useState<'ALL' | LeadTemperature>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeadStatus>('ALL');

  // Metrics
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.temperature === 'QUENTE').length;
  const inNegotiation = leads.filter((l) => l.status === 'NEGOCIACAO' || l.status === 'PROPOSTA_ENVIADA').length;
  const wonLeads = leads.filter((l) => l.status === 'CONVERTIDO').length;
  const pipelineValue = leads
    .filter((l) => l.status !== 'PERDIDO')
    .reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        l.name.toLowerCase().includes(term) ||
        (l.companyName && l.companyName.toLowerCase().includes(term)) ||
        (l.contactName && l.contactName.toLowerCase().includes(term)) ||
        (l.city && l.city.toLowerCase().includes(term)) ||
        (l.cnpj && l.cnpj.includes(term)) ||
        (l.email && l.email.toLowerCase().includes(term)) ||
        (l.phone && l.phone.includes(term));

      const matchesTemp = temperatureFilter === 'ALL' || l.temperature === temperatureFilter;
      const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;

      return matchesSearch && matchesTemp && matchesStatus;
    });
  }, [leads, search, temperatureFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Leads</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalLeads}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{wonLeads} convertidos em clientes</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads Quentes</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{hotLeads}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Alta intenção de contratação</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Negociação</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{inNegotiation}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Propostas em andamento</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Estimado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            R$ {pipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Potencial em prospecção</p>
        </div>
      </div>

      {/* Action / Search & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="lead-search-input"
              name="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Lead, Clínica, Decisor, Cidade ou CNPJ..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition shadow-2xs"
            />
          </div>

          {/* Temperature Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setTemperatureFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                temperatureFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTemperatureFilter('QUENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                temperatureFilter === 'QUENTE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 Quentes ({hotLeads})
            </button>
            <button
              type="button"
              onClick={() => setTemperatureFilter('MORNO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                temperatureFilter === 'MORNO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mornos
            </button>
            <button
              type="button"
              onClick={() => setTemperatureFilter('FRIO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                temperatureFilter === 'FRIO'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Frios
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs self-start sm:self-auto">
            <select
              id="lead-status-filter"
              name="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos os Estágios</option>
              <option value="NOVO">Novos</option>
              <option value="CONTATO_REALIZADO">Contato Realizado</option>
              <option value="QUALIFICADO">Qualificados</option>
              <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
              <option value="NEGOCIACAO">Em Negociação</option>
              <option value="CONVERTIDO">Convertidos</option>
              <option value="PERDIDO">Perdidos</option>
            </select>
          </div>
        </div>

        {/* View Switcher & Create Lead Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visão Funil / Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visão Tabela / Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* VIEW 1: KANBAN PIPELINE */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
          {KANBAN_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
            const stageTotalValue = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl flex flex-col max-h-[640px]"
              >
                {/* Stage Header */}
                <div className={`p-3 border-t-4 ${stage.color} bg-white rounded-t-2xl border-b border-slate-100`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageTotalValue > 0 && (
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      R$ {stageTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                  )}
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl my-2">
                      Nenhum lead nesta fase
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => onViewLead(lead)}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs hover:border-indigo-300 transition cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                            {lead.name}
                          </p>
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase shrink-0 ${getLeadTemperatureBadgeClass(
                              lead.temperature
                            )}`}
                          >
                            {lead.temperature === 'QUENTE' ? '🔥 Quente' : lead.temperature}
                          </span>
                        </div>

                        {lead.contactName && (
                          <p className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.contactName}</span>
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>{lead.city || 'Brasil'}</span>
                          {lead.estimatedValue !== undefined && (
                            <span className="font-bold text-emerald-700">
                              R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>

                        {lead.nextFollowUp && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-medium bg-indigo-50/70 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3 h-3" />
                            Retorno: {new Date(lead.nextFollowUp + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABLE LIST */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nenhum lead encontrado</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Não localizamos nenhum prospect com os filtros informados.
              </p>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar Lead
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[920px] table-fixed">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-6 text-left whitespace-nowrap">Lead / Instituição</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap">Pessoa Decisora</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap">Estágio</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap">Temperatura</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap">Valor Estimado</th>
                    <th className="py-3.5 px-4 text-left whitespace-nowrap">Localização</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 transition group cursor-pointer"
                      onClick={() => onViewLead(lead)}
                    >
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[240px]">
                              {lead.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                              {getLeadTypeLabel(lead.leadType)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-slate-800 truncate max-w-[180px]">
                            {lead.contactName || 'Não especificado'}
                          </p>
                          {lead.contactRole && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {lead.contactRole}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          id={`lead-status-${lead.id}`}
                          name="status"
                          value={lead.status}
                          onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-[10px] font-bold rounded-full px-2.5 py-1 border cursor-pointer focus:outline-none transition-colors whitespace-nowrap ${getLeadStatusBadgeClass(
                            lead.status
                          )}`}
                          title="Clique para alterar status"
                        >
                          <option value="NOVO">Novo Lead</option>
                          <option value="CONTATO_REALIZADO">Contato Realizado</option>
                          <option value="QUALIFICADO">Qualificado</option>
                          <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
                          <option value="NEGOCIACAO">Em Negociação</option>
                          <option value="CONVERTIDO">Convertido ★</option>
                          <option value="PERDIDO">Perdido</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getLeadTemperatureBadgeClass(
                            lead.temperature
                          )}`}
                        >
                          <Flame className="w-3 h-3 text-amber-500" />
                          {getLeadTemperatureLabel(lead.temperature)}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800">
                          {lead.estimatedValue !== undefined
                            ? `R$ ${lead.estimatedValue.toLocaleString('pt-BR')}`
                            : '-'}
                        </p>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-slate-600">
                          {[lead.city, lead.state].filter(Boolean).join(' - ') || 'Brasil'}
                        </p>
                      </td>

                      <td
                        className="py-4 px-4 sm:px-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewLead(lead)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition"
                          >
                            Ver Lead
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEditModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            title="Editar Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja remover o lead "${lead.name}"?`)) {
                                onDeleteLead(lead.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Excluir Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
