import React, { useState, useMemo } from 'react';
import type { Ticket, TicketStatus } from '../../types/ticket';
import type { User } from '../../types/user';
import { calculateSlaInfo } from '../../utils/sla';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Eye,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  currentUser?: User;
  onOpenCreateModal: () => void;
  onViewTicket: (ticket: Ticket) => void;
  viewedMentionTicketIds?: Record<string, string>;
  onMarkAllMentionsAsViewed?: () => void;
}

type TicketSortField = 'ticketNumber' | 'title' | 'priority' | 'status' | 'slaDeadline' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  currentUser,
  onOpenCreateModal,
  onViewTicket,
  viewedMentionTicketIds = {},
  onMarkAllMentionsAsViewed,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus | 'SLA_RISK' | 'MENTIONED'>('ALL');
  const [sortField, setSortField] = useState<TicketSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: TicketSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isUnviewedMention = (t: Ticket) => {
    if (!currentUser?.id || !t.mentionedUserIds?.includes(currentUser.id)) return false;
    if (t.status === 'RESOLVIDO' || t.status === 'FECHADO') return false;
    const viewedAt = viewedMentionTicketIds[t.id];
    if (!viewedAt) return true;
    const ticketTime = new Date(t.updatedAt || t.createdAt).getTime();
    return ticketTime > new Date(viewedAt).getTime();
  };

  const totalMentionedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return tickets.filter(
      (t) => t.status !== 'RESOLVIDO' && t.status !== 'FECHADO' && t.mentionedUserIds?.includes(currentUser.id)
    ).length;
  }, [tickets, currentUser?.id]);

  const unreadMentionCount = useMemo(() => {
    return tickets.filter((t) => isUnviewedMention(t)).length;
  }, [tickets, currentUser?.id, viewedMentionTicketIds]);

  // Top KPI Metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'ABERTO').length;
    const inProgress = tickets.filter((t) => t.status === 'EM_ANDAMENTO').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVIDO' || t.status === 'FECHADO').length;

    const atRiskOrExpired = tickets.filter((t) => {
      if (t.status === 'RESOLVIDO' || t.status === 'FECHADO') return false;
      const sla = calculateSlaInfo(t.slaDeadline, t.createdAt);
      return sla.status === 'AT_RISK' || sla.status === 'EXPIRED';
    }).length;

    return { total, open, inProgress, resolved, atRiskOrExpired };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
        (t.creator?.name || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'MENTIONED') {
        return t.mentionedUserIds?.includes(currentUser?.id || '');
      }
      if (statusFilter === 'SLA_RISK') {
        const sla = calculateSlaInfo(t.slaDeadline, t.createdAt);
        return (sla.status === 'AT_RISK' || sla.status === 'EXPIRED') && t.status !== 'RESOLVIDO' && t.status !== 'FECHADO';
      }
      return t.status === statusFilter;
    });
  }, [tickets, search, statusFilter, currentUser?.id]);

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'ticketNumber') {
        comparison = a.ticketNumber.localeCompare(b.ticketNumber);
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'priority') {
        const priorityOrder: Record<string, number> = {
          CRITICA: 4,
          ALTA: 3,
          MEDIA: 2,
          BAIXA: 1,
        };
        comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      } else if (sortField === 'status') {
        const statusOrder: Record<string, number> = {
          ABERTO: 1,
          EM_ANDAMENTO: 2,
          AGUARDANDO_USUARIO: 3,
          RESOLVIDO: 4,
          FECHADO: 5,
        };
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      } else if (sortField === 'slaDeadline') {
        comparison = new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredTickets, sortField, sortDirection]);

  const renderSortIcon = (field: TicketSortField) => {
    const isSorted = sortField === field;
    return (
      <span className="inline-flex items-center ml-1 text-slate-400 group-hover:text-indigo-600 transition-colors">
        {!isSorted && <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />}
        {isSorted && sortDirection === 'asc' && <ArrowUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
        {isSorted && sortDirection === 'desc' && <ArrowDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
      </span>
    );
  };

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'ABERTO':
        return (
          <span className="inline-flex items-center justify-center w-28 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Aberto
          </span>
        );
      case 'EM_ANDAMENTO':
        return (
          <span className="inline-flex items-center justify-center w-28 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Em Andamento
          </span>
        );
      case 'AGUARDANDO_USUARIO':
        return (
          <span className="inline-flex items-center justify-center w-28 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            Aguardando
          </span>
        );
      case 'RESOLVIDO':
        return (
          <span className="inline-flex items-center justify-center w-28 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolvido
          </span>
        );
      case 'FECHADO':
        return (
          <span className="inline-flex items-center justify-center w-28 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Fechado
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICA':
        return (
          <span className="inline-flex items-center justify-center w-20 text-[10px] font-extrabold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 tracking-wider">
            CRÍTICA
          </span>
        );
      case 'ALTA':
        return (
          <span className="inline-flex items-center justify-center w-20 text-[10px] font-bold px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 tracking-wider">
            ALTA
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center justify-center w-20 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 tracking-wider">
            MÉDIA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-20 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 tracking-wider">
            BAIXA
          </span>
        );
    }
  };

  const renderSlaBadge = (ticket: Ticket) => {
    if (ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO') {
      return (
        <span className="inline-flex items-center justify-center w-36 gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Concluído</span>
        </span>
      );
    }

    const sla = calculateSlaInfo(ticket.slaDeadline, ticket.createdAt);

    if (sla.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center justify-center w-36 gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span className="truncate">{sla.remainingText}</span>
        </span>
      );
    }

    if (sla.status === 'AT_RISK') {
      return (
        <span className="inline-flex items-center justify-center w-36 gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="truncate">{sla.remainingText}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center w-36 gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span className="truncate">{sla.remainingText}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Chamados</span>
            <LifeBuoy className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics.resolved} finalizados / fechados</p>
        </div>

        {/* Card 2: Em Atendimento */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Atendimento</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-700">{metrics.open + metrics.inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{metrics.open} abertos • {metrics.inProgress} em curso</p>
        </div>

        {/* Card 3: SLA em Risco */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Crítico / Risco</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{metrics.atRiskOrExpired}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Prazo expirando ou vencido</p>
        </div>

        {/* Card 4: Marcados para Você */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Marcados para Mim</span>
            <span className="font-mono text-sm font-black text-amber-600">@</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{totalMentionedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {unreadMentionCount > 0 ? (
              <span className="text-amber-600 font-bold">{unreadMentionCount} nova(s) pendente(s)</span>
            ) : (
              'Todas visualizadas'
            )}
          </p>
        </div>
      </div>

      {/* Top Banner / Actions & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="ticket-search"
              name="search"
              type="text"
              placeholder="Buscar por #código, título, tag (#bug) ou solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>

          {/* New Ticket Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Abrir Chamado
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({tickets.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ABERTO')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'ABERTO'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Abertos ({tickets.filter((t) => t.status === 'ABERTO').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('EM_ANDAMENTO')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'EM_ANDAMENTO'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Em Andamento ({tickets.filter((t) => t.status === 'EM_ANDAMENTO').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('RESOLVIDO')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'RESOLVIDO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolvidos ({tickets.filter((t) => t.status === 'RESOLVIDO' || t.status === 'FECHADO').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'SLA_RISK' ? 'ALL' : 'SLA_RISK')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === 'SLA_RISK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            SLA em Risco / Vencido
          </button>

          {currentUser && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'MENTIONED' ? 'ALL' : 'MENTIONED')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === 'MENTIONED'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="font-black text-xs">@</span>
                Marcados para Mim
                {unreadMentionCount > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      statusFilter === 'MENTIONED' ? 'bg-amber-800 text-white' : 'bg-amber-500 text-white shadow-2xs'
                    }`}
                    title={`${unreadMentionCount} nova(s) marcação(ões) não visualizada(s)`}
                  >
                    {unreadMentionCount} novo(s)
                  </span>
                ) : totalMentionedCount > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
                      statusFilter === 'MENTIONED' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {totalMentionedCount}
                  </span>
                ) : null}
              </button>

              {statusFilter === 'MENTIONED' && unreadMentionCount > 0 && onMarkAllMentionsAsViewed && (
                <button
                  type="button"
                  onClick={onMarkAllMentionsAsViewed}
                  className="px-2.5 py-1.5 rounded-lg font-medium text-amber-800 hover:text-amber-950 hover:bg-amber-100 transition flex items-center gap-1 border border-amber-200 text-xs whitespace-nowrap"
                  title="Marcar todas as marcações como visualizadas"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  Marcar vistas
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[840px] table-fixed">
            <colgroup>
              <col className="w-auto" />
              <col className="w-32" />
              <col className="w-40" />
              <col className="w-48" />
              <col className="w-28" />
            </colgroup>
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6 text-left whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('title')}
                    className={`inline-flex items-center gap-1.5 font-semibold transition group ${
                      sortField === 'title' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Ordenar por Título / Chamado"
                  >
                    <span>Chamado / Título</span>
                    {renderSortIcon('title')}
                  </button>
                </th>
                <th className="py-3 px-4 text-left whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('priority')}
                    className={`inline-flex items-center gap-1.5 font-semibold transition group ${
                      sortField === 'priority' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Ordenar por Prioridade"
                  >
                    <span>Prioridade</span>
                    {renderSortIcon('priority')}
                  </button>
                </th>
                <th className="py-3 px-4 text-left whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className={`inline-flex items-center gap-1.5 font-semibold transition group ${
                      sortField === 'status' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Ordenar por Status"
                  >
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-3 px-4 text-left whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('slaDeadline')}
                    className={`inline-flex items-center gap-1.5 font-semibold transition group ${
                      sortField === 'slaDeadline' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Ordenar por SLA Restante"
                  >
                    <span>SLA Restante</span>
                    {renderSortIcon('slaDeadline')}
                  </button>
                </th>
                <th className="py-3 px-6 text-right whitespace-nowrap">
                  <span className="font-semibold text-slate-500">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <LifeBuoy className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
                    Nenhum chamado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                sortedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onViewTicket(ticket)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Number & Title */}
                    <td className="py-4 px-6 text-left">
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 shrink-0">
                            {ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition truncate min-w-0">
                            {ticket.title}
                          </span>
                          {currentUser?.id && ticket.mentionedUserIds?.includes(currentUser.id) && (
                            isUnviewedMention(ticket) ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs shrink-0 animate-pulse"
                                title="Você foi marcado neste chamado e ainda não visualizou"
                              >
                                <span className="font-black text-[9px]">@</span>
                                Nova Marcação
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0"
                                title="Você está marcado neste chamado (já visualizado)"
                              >
                                <span className="font-bold text-[9px] text-amber-600">@</span>
                                Marcado
                              </span>
                            )
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span>Por {ticket.creator?.name || 'Membro'}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                          {ticket.tags && ticket.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {ticket.tags.slice(0, 3).map((t) => (
                                  <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    #{t}
                                  </span>
                                ))}
                                {ticket.tags.length > 3 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{ticket.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4 text-left whitespace-nowrap align-middle">
                      {renderPriorityBadge(ticket.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-left whitespace-nowrap align-middle">
                      {renderStatusBadge(ticket.status)}
                    </td>

                    {/* SLA countdown */}
                    <td className="py-4 px-4 text-left whitespace-nowrap align-middle">
                      {renderSlaBadge(ticket)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTicket(ticket);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedTickets.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            Nenhum chamado encontrado.
          </div>
        ) : (
          sortedTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onViewTicket(ticket)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    {ticket.ticketNumber}
                  </span>
                  {currentUser?.id && ticket.mentionedUserIds?.includes(currentUser.id) && (
                    isUnviewedMention(ticket) ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs animate-pulse"
                        title="Você foi marcado neste chamado e ainda não visualizou"
                      >
                        <span className="font-black text-[9px]">@</span>
                        Nova Marcação
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                        title="Você está marcado neste chamado (já visualizado)"
                      >
                        <span className="font-bold text-[9px] text-amber-600">@</span>
                        Marcado
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {renderPriorityBadge(ticket.priority)}
                  {renderStatusBadge(ticket.status)}
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-800 leading-snug">{ticket.title}</h3>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div className="text-slate-500 truncate">
                  Por {ticket.creator?.name || 'Membro'}
                </div>
                <div>{renderSlaBadge(ticket)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
