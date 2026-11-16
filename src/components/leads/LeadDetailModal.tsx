import React, { useState } from 'react';
import type { Lead, LeadStatus } from '../../types/lead';
import { Modal } from '../common/Modal';
import { formatCNPJ, formatPhone } from '../../utils/cnpj';
import {
  getLeadStatusLabel,
  getLeadStatusBadgeClass,
  getLeadTemperatureLabel,
  getLeadTemperatureBadgeClass,
  getLeadSourceLabel,
  getLeadTypeLabel,
} from '../../utils/lead';
import {
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Flame,
  Globe,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => Promise<void>;
  onUpdateStatus: (leadId: string, status: LeadStatus, lossReason?: string) => Promise<void>;
  onConvertToClinic: (lead: Lead, technicalCrm: string) => Promise<void>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onConvertToClinic,
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [showConvertPrompt, setShowConvertPrompt] = useState(false);
  const [technicalCrm, setTechnicalCrm] = useState('');
  const [lossReasonInput, setLossReasonInput] = useState('');
  const [showLossPrompt, setShowLossPrompt] = useState(false);

  if (!lead) return null;

  const handleStatusChange = async (nextStatus: LeadStatus) => {
    if (nextStatus === 'PERDIDO') {
      setShowLossPrompt(true);
      return;
    }
    if (nextStatus === 'CONVERTIDO') {
      setShowConvertPrompt(true);
      return;
    }
    await onUpdateStatus(lead.id, nextStatus);
  };

  const handleConfirmLoss = async () => {
    await onUpdateStatus(lead.id, 'PERDIDO', lossReasonInput.trim() || undefined);
    setShowLossPrompt(false);
    setLossReasonInput('');
  };

  const handleConfirmConvert = async () => {
    if (!technicalCrm.trim()) {
      alert('Informe o CRM do Responsável Técnico para cadastrar a clínica.');
      return;
    }
    setIsConverting(true);
    try {
      await onConvertToClinic(lead, technicalCrm.trim());
      setShowConvertPrompt(false);
      onClose();
    } finally {
      setIsConverting(false);
    }
  };

  const cleanPhone = lead.phone?.replace(/\D/g, '') || '';
  const waUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.name}
      subtitle={`${getLeadTypeLabel(lead.leadType)} • Lead Cadastrado no Pipeline Comercial`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-sky-50/40 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800 truncate">{lead.name}</h3>
              {lead.companyName && lead.companyName !== lead.name && (
                <p className="text-xs text-slate-500 font-medium truncate">{lead.companyName}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getLeadStatusBadgeClass(
                    lead.status
                  )}`}
                >
                  {getLeadStatusLabel(lead.status)}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getLeadTemperatureBadgeClass(
                    lead.temperature
                  )}`}
                >
                  <Flame className="w-3 h-3 text-amber-500" />
                  {getLeadTemperatureLabel(lead.temperature)}
                </span>

                {lead.cnpj && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {formatCNPJ(lead.cnpj)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onEdit(lead)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Deseja realmente remover o lead "${lead.name}"?`)) {
                  onDelete(lead.id);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Excluir Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Funnel Progress Selector Bar */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Avançar Estágio do Funil
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'NOVO', label: 'Novo' },
              { id: 'CONTATO_REALIZADO', label: 'Contato' },
              { id: 'QUALIFICADO', label: 'Qualificado' },
              { id: 'PROPOSTA_ENVIADA', label: 'Proposta' },
              { id: 'NEGOCIACAO', label: 'Negociação' },
              { id: 'CONVERTIDO', label: 'Convertido ★' },
              { id: 'PERDIDO', label: 'Perdido' },
            ].map((st) => {
              const isActive = lead.status === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStatusChange(st.id as LeadStatus)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Convert to Clinic Banner (Actionable!) */}
        {lead.status !== 'CONVERTIDO' && !lead.convertedClinicId ? (
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Negociação Concluída?
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Converta este lead em uma Clínica Médica cadastrada na plataforma com 1 clique.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConvertPrompt(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-4 h-4" /> Converter em Clínica
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Lead já convertido com sucesso em Clínica Médica ativa!</span>
          </div>
        )}

        {/* Decisor & Contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" /> Pessoa de Contato / Decisor
            </span>
            <p className="text-sm font-bold text-slate-800">
              {lead.contactName || 'Não especificado'}
            </p>
            {lead.contactRole && (
              <p className="text-xs text-indigo-700 font-medium">{lead.contactRole}</p>
            )}
            <p className="text-xs text-slate-500">
              Localização: {[lead.city, lead.state].filter(Boolean).join(' - ') || 'Não informada'}
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-600" /> Canais de Comunicação
            </span>

            {lead.phone ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  {formatPhone(lead.phone)}
                </span>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition inline-flex items-center gap-1"
                  >
                    WhatsApp <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Telefone não cadastrado</p>
            )}

            {lead.email ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-800 truncate max-w-[180px]">{lead.email}</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition inline-flex items-center gap-1"
                >
                  E-mail <Mail className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400">E-mail não cadastrado</p>
            )}
          </div>
        </div>

        {/* Commercial Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-emerald-600" /> Valor Estimado
            </span>
            <p className="text-sm font-bold text-slate-800">
              {lead.estimatedValue !== undefined
                ? `R$ ${lead.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Não estimado'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3 text-indigo-600" /> Canal de Origem
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {getLeadSourceLabel(lead.source)}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-indigo-600" /> Próximo Retorno
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {lead.nextFollowUp
                ? new Date(lead.nextFollowUp + 'T00:00:00').toLocaleDateString('pt-BR')
                : 'Não agendado'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Cadastrado em
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Loss Reason if PERDIDO */}
        {lead.status === 'PERDIDO' && lead.lossReason && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-0.5">
              Motivo da Perda
            </span>
            <p className="text-xs text-rose-900 leading-relaxed">{lead.lossReason}</p>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Notas & Histórico
            </span>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
              {lead.notes}
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Convert to Clinic Prompt Modal */}
      {showConvertPrompt && (
        <Modal
          isOpen={showConvertPrompt}
          onClose={() => setShowConvertPrompt(false)}
          title="Converter Lead em Clínica Médica"
          subtitle={`A instituição "${lead.name}" será cadastrada oficialmente no CRM`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 leading-relaxed">
              O lead será transferido automaticamente para o <strong>Módulo de Clínicas Médicas</strong>, com status inicial <strong>Contrato Vigente/Em Negociação</strong>.
            </div>

            {!lead.cnpj && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                Aviso: Este lead não possui CNPJ preenchido. É recomendável cadastrar o CNPJ para emissão e dados oficiais.
              </div>
            )}

            <div>
              <label htmlFor="lead-convert-technical-crm" className="block text-xs font-semibold text-slate-700 mb-1">
                CRM do Responsável Técnico <span className="text-rose-500">*</span>
              </label>
              <input
                id="lead-convert-technical-crm"
                name="technicalCrm"
                type="text"
                required
                value={technicalCrm}
                onChange={(e) => setTechnicalCrm(e.target.value.toUpperCase())}
                placeholder="Ex: CRM/SP 123456"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConvertPrompt(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                disabled={isConverting || !technicalCrm.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {isConverting ? 'Convertendo...' : 'Confirmar e Criar Clínica'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Loss Reason Prompt Modal */}
      {showLossPrompt && (
        <Modal
          isOpen={showLossPrompt}
          onClose={() => setShowLossPrompt(false)}
          title="Marcar Lead como Perdido"
          subtitle="Informe o motivo para histórico e análise de conversão"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="lead-loss-reason-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo da Perda
              </label>
              <input
                id="lead-loss-reason-input"
                name="lossReason"
                type="text"
                value={lossReasonInput}
                onChange={(e) => setLossReasonInput(e.target.value)}
                placeholder="Ex: Preço elevado, optou pelo concorrente ou sem orçamento..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLossPrompt(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLoss}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
