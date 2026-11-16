import React, { useState, useEffect } from 'react';
import type { Lead, CreateLeadInput, LeadStatus, LeadTemperature, LeadSource, LeadType } from '../../types/lead';
import { Modal } from '../common/Modal';
import { formatCNPJ, formatPhone, cleanNumeric, fetchCNPJ } from '../../utils/cnpj';
import {
  UserCheck,
  Building2,
  Search,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  User,
  Calendar,
  DollarSign,
  Flame,
  Globe,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateLeadInput) => Promise<void>;
  initialLead?: Lead | null;
  isSubmitting?: boolean;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialLead,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [leadType, setLeadType] = useState<LeadType>('CLINICA');
  const [status, setStatus] = useState<LeadStatus>('NOVO');
  const [temperature, setTemperature] = useState<LeadTemperature>('MORNO');
  const [source, setSource] = useState<LeadSource>('OUTBOUND');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [lossReason, setLossReason] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjSuccess, setCnpjSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLead) {
      setName(initialLead.name);
      setCompanyName(initialLead.companyName || '');
      setTradeName(initialLead.tradeName || '');
      setContactName(initialLead.contactName || '');
      setContactRole(initialLead.contactRole || '');
      setEmail(initialLead.email || '');
      setPhone(initialLead.phone ? formatPhone(initialLead.phone) : '');
      setCnpj(initialLead.cnpj ? formatCNPJ(initialLead.cnpj) : '');
      setCity(initialLead.city || '');
      setState(initialLead.state || '');
      setLeadType(initialLead.leadType);
      setStatus(initialLead.status);
      setTemperature(initialLead.temperature);
      setSource(initialLead.source);
      setEstimatedValue(initialLead.estimatedValue !== undefined ? String(initialLead.estimatedValue) : '');
      setLossReason(initialLead.lossReason || '');
      setNextFollowUp(initialLead.nextFollowUp || '');
      setNotes(initialLead.notes || '');
      setErrorMsg(null);
      setCnpjError(null);
      setCnpjSuccess(null);
    } else {
      setName('');
      setCompanyName('');
      setTradeName('');
      setContactName('');
      setContactRole('');
      setEmail('');
      setPhone('');
      setCnpj('');
      setCity('');
      setState('');
      setLeadType('CLINICA');
      setStatus('NOVO');
      setTemperature('MORNO');
      setSource('OUTBOUND');
      setEstimatedValue('');
      setLossReason('');
      setNextFollowUp('');
      setNotes('');
      setErrorMsg(null);
      setCnpjError(null);
      setCnpjSuccess(null);
    }
  }, [initialLead, isOpen]);

  // Optional CNPJ Auto-fill for Lead
  const handleLookupCNPJ = async () => {
    setCnpjError(null);
    setCnpjSuccess(null);
    const clean = cleanNumeric(cnpj);
    if (clean.length !== 14) {
      setCnpjError('Informe os 14 dígitos do CNPJ.');
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const data = await fetchCNPJ(clean);
      if (!name) setName(data.nomeFantasia || data.razaoSocial);
      setCompanyName(data.razaoSocial);
      if (data.nomeFantasia) setTradeName(data.nomeFantasia);
      if (data.cidade) setCity(data.cidade);
      if (data.uf) setState(data.uf);
      if (data.telefone && !phone) setPhone(data.telefone);
      if (data.email && !email) setEmail(data.email.toLowerCase());
      setCnpjSuccess(`Dados de "${data.razaoSocial}" carregados!`);
    } catch (err: any) {
      setCnpjError(err?.message || 'Falha ao buscar CNPJ.');
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('O nome do lead / estabelecimento é obrigatório.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        tradeName: tradeName.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactRole: contactRole.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        phone: phone ? cleanNumeric(phone) : undefined,
        cnpj: cnpj ? cleanNumeric(cnpj) : undefined,
        city: city.trim() || undefined,
        state: state.trim().toUpperCase() || undefined,
        leadType,
        status,
        temperature,
        source,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue.replace(',', '.')) : undefined,
        lossReason: status === 'PERDIDO' ? lossReason.trim() : undefined,
        nextFollowUp: nextFollowUp || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao salvar lead.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialLead ? 'Editar Lead / Oportunidade' : 'Cadastrar Novo Lead'}
      subtitle="Cadastre uma instituição ou médico prospect para acompanhamento no funil comercial"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Basic Identification */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Identificação do Prospect / Estabelecimento
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Nome do Lead / Clínica <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica CardioVida ou Dr. André Pediatra"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Tipo de Estabelecimento
              </label>
              <select
                value={leadType}
                onChange={(e) => setLeadType(e.target.value as LeadType)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option value="CLINICA">Clínica Médica</option>
                <option value="CONSULTORIO">Consultório Individual</option>
                <option value="HOSPITAL">Hospital / Day Clinic</option>
                <option value="LABORATORIO">Laboratório / Imagem</option>
                <option value="OUTRO">Outro Estabelecimento</option>
              </select>
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                CNPJ (Opcional na fase de lead)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => {
                    setCnpj(formatCNPJ(e.target.value));
                    setCnpjError(null);
                  }}
                  maxLength={18}
                  placeholder="00.000.000/0000-00"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
                <button
                  type="button"
                  onClick={handleLookupCNPJ}
                  disabled={isLoadingCnpj || cleanNumeric(cnpj).length !== 14}
                  className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition disabled:opacity-50 shrink-0 flex items-center justify-center"
                  title="Puxar dados oficiais pelo CNPJ"
                >
                  {isLoadingCnpj ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {cnpjError && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {cnpjError}
            </p>
          )}

          {cnpjSuccess && (
            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {cnpjSuccess}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Curitiba"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">Estado (UF)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="PR"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs uppercase font-semibold text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Decisor & Contatos */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            Decisor / Pessoa de Contato
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Nome do Responsável
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: Dra. Camila Rocha"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Cargo / Função
              </label>
              <input
                type="text"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="Ex: Diretora Médica / Sócia"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@clinica.com.br"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Funil & Qualificação Comercial */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3.5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Qualificação Comercial & Funil
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Estágio do Funil <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option value="NOVO">Novo Lead</option>
                <option value="CONTATO_REALIZADO">Contato Realizado</option>
                <option value="QUALIFICADO">Qualificado</option>
                <option value="PROPOSTA_ENVIADA">Proposta Enviada</option>
                <option value="NEGOCIACAO">Em Negociação</option>
                <option value="CONVERTIDO">Convertido (Ganho)</option>
                <option value="PERDIDO">Perdido / Desqualificado</option>
              </select>
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Temperatura
              </label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option value="FRIO">Frio (Pouco interesse)</option>
                <option value="MORNO">Morno (Interesse moderado)</option>
                <option value="QUENTE">Quente (Alta intenção)</option>
              </select>
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Origem / Canal
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option value="OUTBOUND">Prospecção Ativa (Outbound)</option>
                <option value="INDICACAO">Indicação</option>
                <option value="GOOGLE">Google / Tráfego Pago</option>
                <option value="REDES_SOCIAIS">Redes Sociais</option>
                <option value="EVENTO">Congresso / Evento</option>
                <option value="SITE">Site / Landing Page</option>
                <option value="WHATSAPP">WhatsApp Direto</option>
                <option value="OUTRO">Outro Canal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Valor Estimado da Oportunidade (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="Ex: 1500.00"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Próximo Follow-up / Retorno
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {status === 'PERDIDO' && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Motivo da Perda / Desqualificação
              </label>
              <input
                type="text"
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="Ex: Preço elevado, já possui outro sistema ou sem interesse..."
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Histórico / Notas da Negociação
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anotações de ligações, reuniões, necessidades clínicas ou termos conversados..."
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando Lead...
              </>
            ) : initialLead ? (
              'Atualizar Lead'
            ) : (
              'Cadastrar Lead'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
