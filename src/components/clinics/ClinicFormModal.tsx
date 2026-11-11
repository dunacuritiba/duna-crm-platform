import React, { useState, useEffect } from 'react';
import type { MedicalClinic, CreateClinicInput } from '../../types/clinic';
import { Modal } from '../common/Modal';
import {
  formatCNPJ,
  formatCEP,
  formatPhone,
  cleanNumeric,
  validateCNPJ,
  fetchCNPJ,
  fetchCEP,
} from '../../utils/cnpj';
import {
  Building2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

const SUGGESTED_SPECIALTIES = [
  'Clínica Geral',
  'Cardiologia',
  'Dermatologia',
  'Ginecologia e Obstetrícia',
  'Ortopedia e Traumatologia',
  'Pediatria',
  'Oftalmologia',
  'Endocrinologia',
  'Psiquiatria',
  'Neurologia',
  'Urologia',
  'Otorrinolaringologia',
  'Gastroenterologia',
  'Cirurgia Geral',
];

interface ClinicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateClinicInput) => Promise<void>;
  initialClinic?: MedicalClinic | null;
  isSubmitting?: boolean;
}

export const ClinicFormModal: React.FC<ClinicFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialClinic,
  isSubmitting = false,
}) => {
  const [cnpj, setCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [technicalResponsibleCrm, setTechnicalResponsibleCrm] = useState('');
  const [technicalResponsibleName, setTechnicalResponsibleName] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');

  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjSuccess, setCnpjSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClinic) {
      setCnpj(formatCNPJ(initialClinic.cnpj));
      setCompanyName(initialClinic.companyName);
      setTradeName(initialClinic.tradeName || '');
      setTechnicalResponsibleCrm(initialClinic.technicalResponsibleCrm);
      setTechnicalResponsibleName(initialClinic.technicalResponsibleName || '');
      setSpecialties(initialClinic.specialties || []);
      setPhone(initialClinic.phone ? formatPhone(initialClinic.phone) : '');
      setEmail(initialClinic.email || '');
      setZipCode(initialClinic.zipCode ? formatCEP(initialClinic.zipCode) : '');
      setStreet(initialClinic.street || '');
      setNumber(initialClinic.number || '');
      setComplement(initialClinic.complement || '');
      setNeighborhood(initialClinic.neighborhood || '');
      setCity(initialClinic.city || '');
      setState(initialClinic.state || '');
      setStatus(initialClinic.status);
      setCnpjError(null);
      setCnpjSuccess(null);
      setFormError(null);
    } else {
      // Reset
      setCnpj('');
      setCompanyName('');
      setTradeName('');
      setTechnicalResponsibleCrm('');
      setTechnicalResponsibleName('');
      setSpecialties(['Clínica Geral']);
      setCustomSpecialty('');
      setPhone('');
      setEmail('');
      setZipCode('');
      setStreet('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setState('');
      setStatus('ATIVO');
      setCnpjError(null);
      setCnpjSuccess(null);
      setFormError(null);
    }
  }, [initialClinic, isOpen]);

  // CNPJ Auto-lookup
  const handleLookupCNPJ = async () => {
    setCnpjError(null);
    setCnpjSuccess(null);
    const clean = cleanNumeric(cnpj);

    if (clean.length !== 14) {
      setCnpjError('Informe os 14 dígitos do CNPJ para realizar a consulta.');
      return;
    }

    if (!validateCNPJ(clean)) {
      setCnpjError('Número de CNPJ inválido segundo o dígito verificador.');
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const data = await fetchCNPJ(clean);
      setCompanyName(data.razaoSocial || companyName);
      if (data.nomeFantasia) setTradeName(data.nomeFantasia);
      if (data.cep) setZipCode(data.cep);
      if (data.logradouro) setStreet(data.logradouro);
      if (data.numero) setNumber(data.numero);
      if (data.complemento) setComplement(data.complemento);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.cidade) setCity(data.cidade);
      if (data.uf) setState(data.uf);
      if (data.telefone) setPhone(data.telefone);
      if (data.email) setEmail(data.email.toLowerCase());

      setCnpjSuccess(`Dados da empresa "${data.razaoSocial}" carregados com sucesso!`);
    } catch (err: any) {
      setCnpjError(err?.message || 'Falha ao consultar CNPJ. Preencha os campos manualmente.');
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  // CEP Auto-lookup
  const handleLookupCEP = async (cepValue: string) => {
    const clean = cleanNumeric(cepValue);
    if (clean.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const data = await fetchCEP(clean);
      if (data.logradouro) setStreet(data.logradouro);
      if (data.bairro) setNeighborhood(data.bairro);
      if (data.cidade) setCity(data.cidade);
      if (data.uf) setState(data.uf);
    } catch (err) {
      console.warn('CEP lookup error:', err);
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Specialty management
  const toggleSpecialty = (item: string) => {
    if (specialties.includes(item)) {
      setSpecialties(specialties.filter((s) => s !== item));
    } else {
      setSpecialties([...specialties, item]);
    }
  };

  const handleAddCustomSpecialty = () => {
    const trimmed = customSpecialty.trim();
    if (!trimmed) return;
    if (!specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
    }
    setCustomSpecialty('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCnpj = cleanNumeric(cnpj);
    if (cleanCnpj.length !== 14) {
      setFormError('CNPJ é obrigatório e deve ter 14 dígitos.');
      return;
    }

    if (!companyName.trim()) {
      setFormError('Razão Social / Nome da Clínica é obrigatório.');
      return;
    }

    if (!technicalResponsibleCrm.trim()) {
      setFormError('CRM do Responsável Técnico é obrigatório.');
      return;
    }

    if (specialties.length === 0) {
      setFormError('Selecione pelo menos uma área de atuação / especialidade.');
      return;
    }

    try {
      await onSubmit({
        cnpj: cleanCnpj,
        companyName: companyName.trim(),
        tradeName: tradeName.trim() || undefined,
        technicalResponsibleCrm: technicalResponsibleCrm.trim(),
        technicalResponsibleName: technicalResponsibleName.trim() || undefined,
        specialties,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        zipCode: zipCode ? cleanNumeric(zipCode) : undefined,
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim().toUpperCase() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Falha ao salvar clínica.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClinic ? 'Editar Clínica Médica' : 'Cadastrar Nova Clínica Médica'}
      subtitle={
        initialClinic
          ? 'Atualize os dados cadastrais, responsável técnico ou áreas de atuação'
          : 'Puxe os dados oficiais pelo CNPJ para autopreenchimento rápido ou insira manualmente'
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* CNPJ Lookup Bar */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-slate-50 border border-indigo-100 rounded-2xl">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              CNPJ da Clínica <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500 lowercase">
              consulta automática na Receita Federal
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={cnpj}
                onChange={(e) => {
                  setCnpj(formatCNPJ(e.target.value));
                  setCnpjError(null);
                  setCnpjSuccess(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupCNPJ();
                  }
                }}
                maxLength={18}
                placeholder="00.000.000/0000-00"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <button
              type="button"
              onClick={handleLookupCNPJ}
              disabled={isLoadingCnpj || cleanNumeric(cnpj).length !== 14}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isLoadingCnpj ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Buscando Dados...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Puxar pelo CNPJ
                </>
              )}
            </button>
          </div>

          {cnpjError && (
            <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {cnpjError}
            </p>
          )}

          {cnpjSuccess && (
            <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {cnpjSuccess}
            </p>
          )}
        </div>

        {/* Company Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Razão Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Clínica Médica Esperança Ltda."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Fantasia
            </label>
            <input
              type="text"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Ex: Centro Médico Saúde Plena"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>

        {/* Technical Responsible & CRM */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            Responsável Técnico Médico
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CRM do Responsável Técnico <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={technicalResponsibleCrm}
                onChange={(e) => setTechnicalResponsibleCrm(e.target.value.toUpperCase())}
                placeholder="Ex: CRM/SP 123456 ou 12345-PR"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Médico Responsável
              </label>
              <input
                type="text"
                value={technicalResponsibleName}
                onChange={(e) => setTechnicalResponsibleName(e.target.value)}
                placeholder="Ex: Dr. Roberto Alcantara"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Specialties / Areas of Practice */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>
              Áreas de Atuação / Especialidades <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {specialties.length} selecionada(s)
            </span>
          </label>

          {/* Quick Select Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {SUGGESTED_SPECIALTIES.map((spec) => {
              const selected = specialties.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {selected && <CheckCircle2 className="w-3 h-3" />}
                  {spec}
                </button>
              );
            })}
          </div>

          {/* Add custom specialty input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSpecialty();
                }
              }}
              placeholder="Adicionar outra área (Ex: Reumatologia, Nutrologia...)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
            <button
              type="button"
              onClick={handleAddCustomSpecialty}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          {/* Current selected list tags if custom ones added */}
          {specialties.some((s) => !SUGGESTED_SPECIALTIES.includes(s)) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {specialties
                .filter((s) => !SUGGESTED_SPECIALTIES.includes(s))
                .map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className="hover:text-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              E-mail Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@clinicamedica.com.br"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>

        {/* Address section */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Endereço da Unidade
            </span>
            {isLoadingCep && (
              <span className="text-[11px] font-normal text-indigo-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Buscando CEP...
              </span>
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">CEP</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => {
                  const val = formatCEP(e.target.value);
                  setZipCode(val);
                  if (cleanNumeric(val).length === 8) {
                    handleLookupCEP(val);
                  }
                }}
                maxLength={9}
                placeholder="00000-000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Logradouro (Rua / Av.)
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Avenida Paulista"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Conjunto 42"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bela Vista"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cidade / UF</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  className="flex-1 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  maxLength={2}
                  placeholder="SP"
                  className="w-12 px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase font-semibold text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Option */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Status da Clínica</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="clinic_status"
                value="ATIVO"
                checked={status === 'ATIVO'}
                onChange={() => setStatus('ATIVO')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Ativa
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="clinic_status"
                value="INATIVO"
                checked={status === 'INATIVO'}
                onChange={() => setStatus('INATIVO')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Inativa
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
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
                Salvando...
              </>
            ) : initialClinic ? (
              'Atualizar Clínica'
            ) : (
              'Cadastrar Clínica Médica'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
