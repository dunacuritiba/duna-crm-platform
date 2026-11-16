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
} from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  currentUser?: User;
  onOpenCreateModal: () => void;
  onViewTicket: (ticket: Ticket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  onOpenCreateModal,
  onViewTicket,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus | 'SLA_RISK'>('ALL');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
        (t.creator?.name || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'SLA_RISK') {
        const sla = calculateSlaInfo(t.slaDeadline, t.createdAt);
        return (sla.status === 'AT_RISK' || sla.status === 'EXPIRED') && t.status !== 'RESOLVIDO' && t.status !== 'FECHADO';
      }
      return t.status === statusFilter;
    });
  }, [tickets, search, statusFilter]);

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'ABERTO':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Aberto
          </span>
        );
      case 'EM_ANDAMENTO':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Em Andamento
          </span>
        );
      case 'AGUARDANDO_USUARIO':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            Aguardando
          </span>
        );
      case 'RESOLVIDO':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolvido
          </span>
        );
      case 'FECHADO':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Fechado
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICA':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            CRÍTICA
          </span>
        );
      case 'ALTA':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            ALTA
          </span>
        );
      case 'MEDIA':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            MÉDIA
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            BAIXA
          </span>
        );
    }
  };

  const renderSlaBadge = (ticket: Ticket) => {
    if (ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Concluído
        </span>
      );
    }

    const sla = calculateSlaInfo(ticket.slaDeadline, ticket.createdAt);

    if (sla.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          {sla.remainingText}
        </span>
      );
    }

    if (sla.status === 'AT_RISK') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {sla.remainingText}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {sla.remainingText}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por #código, título, tag (#bug) ou solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>

          {/* New Ticket Button */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Abrir Chamado
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtros:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({tickets.length})
          </button>

          <button
            onClick={() => setStatusFilter('ABERTO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'ABERTO'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Abertos ({tickets.filter((t) => t.status === 'ABERTO').length})
          </button>

          <button
            onClick={() => setStatusFilter('EM_ANDAMENTO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'EM_ANDAMENTO'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Em Andamento ({tickets.filter((t) => t.status === 'EM_ANDAMENTO').length})
          </button>

          <button
            onClick={() => setStatusFilter('RESOLVIDO')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              statusFilter === 'RESOLVIDO'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolvidos ({tickets.filter((t) => t.status === 'RESOLVIDO').length})
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'SLA_RISK' ? 'ALL' : 'SLA_RISK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              statusFilter === 'SLA_RISK'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            SLA em Risco / Vencido
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6 whitespace-nowrap">Chamado / Título</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Prioridade</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">SLA Restante</th>
                <th className="py-3.5 px-6 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <LifeBuoy className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
                    Nenhum chamado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onViewTicket(ticket)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Number & Title */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            {ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition truncate max-w-sm">
                            {ticket.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span>Por {ticket.creator?.name || 'Membro'}</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                          {ticket.tags && ticket.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {ticket.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="text-[10px] text-slate-500">
                                    #{t}
                                  </span>
                                ))}
                                {ticket.tags.length > 2 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{ticket.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {renderPriorityBadge(ticket.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(ticket.status)}
                    </td>

                    {/* SLA countdown */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {renderSlaBadge(ticket)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
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
        {filteredTickets.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            Nenhum chamado encontrado.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onViewTicket(ticket)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  {ticket.ticketNumber}
                </span>
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
