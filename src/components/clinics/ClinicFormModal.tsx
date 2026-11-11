import React, { useState, useEffect } from 'react';
import type {
  MedicalClinic,
  CreateClinicInput,
  CreateClinicUnitInput,
  ClinicContractStatus,
} from '../../types/clinic';
import { Modal } from '../common/Modal';
import { ClinicLogoUploader } from './ClinicLogoUploader';
import {
  formatCNPJ,
  formatCEP,
  formatPhone,
  cleanNumeric,
  validateCNPJ,
  fetchCNPJ,
  fetchCEP,
} from '../../utils/cnpj';
import { getLiveContractStatus, getContractStatusBadgeClass } from '../../utils/contract';
import {
  Building2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
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
  // Navigation section in modal
  const [formSection, setFormSection] = useState<'general' | 'units' | 'contract'>('general');

  // Basic Info
  const [cnpj, setCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [logo, setLogo] = useState('');
  const [technicalResponsibleCrm, setTechnicalResponsibleCrm] = useState('');
  const [technicalResponsibleName, setTechnicalResponsibleName] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');

  // Contract Info
  const [contractStatus, setContractStatus] = useState<ClinicContractStatus>('LEAD');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [contractNotes, setContractNotes] = useState('');

  // Units Info (Multiple branches)
  const [units, setUnits] = useState<CreateClinicUnitInput[]>([
    {
      name: 'Unidade Principal (Matriz)',
      isMain: true,
      phone: '',
      email: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      status: 'ATIVO',
    },
  ]);

  // Loading & Feedback
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingUnitCep, setIsLoadingUnitCep] = useState<number | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjSuccess, setCnpjSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClinic) {
      setCnpj(formatCNPJ(initialClinic.cnpj));
      setCompanyName(initialClinic.companyName);
      setTradeName(initialClinic.tradeName || '');
      setLogo(initialClinic.logo || '');
      setTechnicalResponsibleCrm(initialClinic.technicalResponsibleCrm);
      setTechnicalResponsibleName(initialClinic.technicalResponsibleName || '');
      setSpecialties(initialClinic.specialties || []);
      setPhone(initialClinic.phone ? formatPhone(initialClinic.phone) : '');
      setEmail(initialClinic.email || '');
      setStatus(initialClinic.status);
      setContractStatus(initialClinic.contractStatus || 'LEAD');
      setContractStartDate(initialClinic.contractStartDate || '');
      setContractEndDate(initialClinic.contractEndDate || '');
      setContractNotes(initialClinic.contractNotes || '');

      if (initialClinic.units && initialClinic.units.length > 0) {
        setUnits(
          initialClinic.units.map((u) => ({
            id: u.id,
            name: u.name,
            phone: u.phone ? formatPhone(u.phone) : '',
            email: u.email || '',
            zipCode: u.zipCode ? formatCEP(u.zipCode) : '',
            street: u.street || '',
            number: u.number || '',
            complement: u.complement || '',
            neighborhood: u.neighborhood || '',
            city: u.city || '',
            state: u.state || '',
            isMain: u.isMain,
            status: u.status,
          }))
        );
      } else {
        // Fallback main unit from clinic address
        setUnits([
          {
            name: 'Unidade Principal (Matriz)',
            isMain: true,
            phone: initialClinic.phone ? formatPhone(initialClinic.phone) : '',
            email: initialClinic.email || '',
            zipCode: initialClinic.zipCode ? formatCEP(initialClinic.zipCode) : '',
            street: initialClinic.street || '',
            number: initialClinic.number || '',
            complement: initialClinic.complement || '',
            neighborhood: initialClinic.neighborhood || '',
            city: initialClinic.city || '',
            state: initialClinic.state || '',
            status: 'ATIVO',
          },
        ]);
      }

      setCnpjError(null);
      setCnpjSuccess(null);
      setFormError(null);
      setFormSection('general');
    } else {
      // Reset
      setCnpj('');
      setCompanyName('');
      setTradeName('');
      setLogo('');
      setTechnicalResponsibleCrm('');
      setTechnicalResponsibleName('');
      setSpecialties(['Clínica Geral']);
      setCustomSpecialty('');
      setPhone('');
      setEmail('');
      setStatus('ATIVO');
      setContractStatus('LEAD');
      setContractStartDate('');
      setContractEndDate('');
      setContractNotes('');
      setUnits([
        {
          name: 'Unidade Principal (Matriz)',
          isMain: true,
          phone: '',
          email: '',
          zipCode: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          status: 'ATIVO',
        },
      ]);
      setCnpjError(null);
      setCnpjSuccess(null);
      setFormError(null);
      setFormSection('general');
    }
  }, [initialClinic, isOpen]);

  // Live computed contract status
  const liveContract = getLiveContractStatus(contractStatus, contractEndDate);

  // Auto-update contractStatus when contractEndDate changes
  const handleEndDateChange = (val: string) => {
    setContractEndDate(val);
    if (val) {
      const computed = getLiveContractStatus('CONTRATO_VIGENTE', val);
      setContractStatus(computed.status);
    }
  };

  // CNPJ Lookup with BrasilAPI
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
      if (data.telefone) setPhone(data.telefone);
      if (data.email) setEmail(data.email.toLowerCase());

      // Pre-fill main unit address
      setUnits((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[0] = {
            ...copy[0],
            phone: data.telefone || copy[0].phone,
            email: data.email || copy[0].email,
            zipCode: data.cep || copy[0].zipCode,
            street: data.logradouro || copy[0].street,
            number: data.numero || copy[0].number,
            complement: data.complemento || copy[0].complement,
            neighborhood: data.bairro || copy[0].neighborhood,
            city: data.cidade || copy[0].city,
            state: data.uf || copy[0].state,
          };
        }
        return copy;
      });

      setCnpjSuccess(`Dados oficiais de "${data.razaoSocial}" carregados com sucesso!`);
    } catch (err: any) {
      setCnpjError(err?.message || 'Falha ao consultar CNPJ. Preencha os campos manualmente.');
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  // Lookup CEP for a specific unit
  const handleLookupUnitCEP = async (unitIndex: number, cepValue: string) => {
    const clean = cleanNumeric(cepValue);
    if (clean.length !== 8) return;

    setIsLoadingUnitCep(unitIndex);
    try {
      const data = await fetchCEP(clean);
      setUnits((prev) => {
        const copy = [...prev];
        if (copy[unitIndex]) {
          copy[unitIndex] = {
            ...copy[unitIndex],
            zipCode: data.cep,
            street: data.logradouro || copy[unitIndex].street,
            neighborhood: data.bairro || copy[unitIndex].neighborhood,
            city: data.cidade || copy[unitIndex].city,
            state: data.uf || copy[unitIndex].state,
          };
        }
        return copy;
      });
    } catch (err) {
      console.warn('CEP lookup error:', err);
    } finally {
      setIsLoadingUnitCep(null);
    }
  };

  // Unit handlers
  const handleAddUnit = () => {
    const nextNumber = units.length + 1;
    setUnits([
      ...units,
      {
        name: `Unidade Filial ${nextNumber}`,
        isMain: false,
        phone: phone || '',
        email: email || '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        status: 'ATIVO',
      },
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    if (units.length <= 1) {
      alert('A clínica deve possuir pelo menos uma unidade cadastrada.');
      return;
    }
    const isRemovingMain = units[index].isMain;
    const filtered = units.filter((_, i) => i !== index);
    if (isRemovingMain && filtered.length > 0) {
      filtered[0].isMain = true;
    }
    setUnits(filtered);
  };

  const handleUpdateUnit = (index: number, field: keyof CreateClinicUnitInput, value: any) => {
    setUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSetMainUnit = (index: number) => {
    setUnits((prev) =>
      prev.map((u, i) => ({
        ...u,
        isMain: i === index,
      }))
    );
  };

  // Specialties
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
      setFormError('CNPJ é obrigatório e deve conter 14 dígitos numéricos.');
      setFormSection('general');
      return;
    }

    if (!companyName.trim()) {
      setFormError('Razão Social / Nome da Clínica é obrigatório.');
      setFormSection('general');
      return;
    }

    if (!technicalResponsibleCrm.trim()) {
      setFormError('CRM do Responsável Técnico é obrigatório.');
      setFormSection('general');
      return;
    }

    if (units.length === 0 || !units[0].name.trim()) {
      setFormError('Cadastre pelo menos uma unidade de atendimento com nome válido.');
      setFormSection('units');
      return;
    }

    // Main address from primary unit
    const mainUnit = units.find((u) => u.isMain) || units[0];

    try {
      await onSubmit({
        cnpj: cleanCnpj,
        companyName: companyName.trim(),
        tradeName: tradeName.trim() || undefined,
        logo: logo || undefined,
        technicalResponsibleCrm: technicalResponsibleCrm.trim(),
        technicalResponsibleName: technicalResponsibleName.trim() || undefined,
        specialties,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        zipCode: mainUnit.zipCode ? cleanNumeric(mainUnit.zipCode) : undefined,
        street: mainUnit.street?.trim() || undefined,
        number: mainUnit.number?.trim() || undefined,
        complement: mainUnit.complement?.trim() || undefined,
        neighborhood: mainUnit.neighborhood?.trim() || undefined,
        city: mainUnit.city?.trim() || undefined,
        state: mainUnit.state?.trim().toUpperCase() || undefined,
        status,
        contractStatus: liveContract.status,
        contractStartDate: contractStartDate || undefined,
        contractEndDate: contractEndDate || undefined,
        contractNotes: contractNotes.trim() || undefined,
        units: units.map((u) => ({
          ...u,
          name: u.name.trim(),
          zipCode: u.zipCode ? cleanNumeric(u.zipCode) : undefined,
          phone: u.phone ? cleanNumeric(u.phone) : undefined,
          email: u.email?.trim().toLowerCase() || undefined,
          state: u.state?.trim().toUpperCase() || undefined,
        })),
      });
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Falha ao salvar clínica médica.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClinic ? 'Editar Clínica Médica' : 'Cadastrar Nova Clínica Médica'}
      subtitle="Dados cadastrais por CNPJ, logotipo, unidades de atendimento e vigência de contrato"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{formError}</span>
          </div>
        )}

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFormSection('general')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              formSection === 'general'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Dados & Logotipo
          </button>

          <button
            type="button"
            onClick={() => setFormSection('units')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              formSection === 'units'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Unidades de Atendimento ({units.length})
          </button>

          <button
            type="button"
            onClick={() => setFormSection('contract')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              formSection === 'contract'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Status de Contrato
            <span
              className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${getContractStatusBadgeClass(
                liveContract.status
              )}`}
            >
              {liveContract.label}
            </span>
          </button>
        </div>

        {/* SECTION 1: GENERAL & LOGO */}
        {formSection === 'general' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Logo Uploader */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Logotipo Oficial da Clínica
              </label>
              <ClinicLogoUploader
                logo={logo}
                onChange={setLogo}
                clinicName={tradeName || companyName}
              />
            </div>

            {/* CNPJ Auto-lookup Bar */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-slate-50 border border-indigo-100 rounded-2xl">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  CNPJ da Clínica <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  consulta oficial na Receita
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
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

            {/* Razão Social e Nome Fantasia */}
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Responsável Técnico & CRM */}
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
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition uppercase"
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
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Especialidades / Áreas de Atuação */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>
                  Áreas de Atuação / Especialidades <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {specialties.length} selecionada(s)
                </span>
              </label>

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
                  placeholder="Outra área (Ex: Reumatologia, Nutrologia...)"
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

            {/* Contato Central */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Telefone / WhatsApp Geral
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  E-mail Institucional Geral
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@clinicamedica.com.br"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: MULTIPLE UNITS */}
        {formSection === 'units' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Unidades e Locais de Atendimento
                </h4>
                <p className="text-[11px] text-sky-800 mt-0.5">
                  Cadastre as filiais ou polos desta clínica para direcionar médicos e agendamentos de pacientes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddUnit}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Outra Unidade
              </button>
            </div>

            {/* Units Cards list */}
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {units.map((unit, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border transition ${
                    unit.isMain
                      ? 'bg-white border-indigo-200 ring-2 ring-indigo-500/10 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {unit.name || `Unidade ${index + 1}`}
                      </span>
                      {unit.isMain && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          Matriz Principal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!unit.isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetMainUnit(index)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition"
                        >
                          Definir como Matriz
                        </button>
                      )}
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remover esta unidade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nome da Unidade / Filial <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={unit.name}
                        onChange={(e) => handleUpdateUnit(index, 'name', e.target.value)}
                        placeholder="Ex: Unidade Centro, Filial Sul..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Telefone da Unidade
                      </label>
                      <input
                        type="text"
                        value={unit.phone || ''}
                        onChange={(e) =>
                          handleUpdateUnit(index, 'phone', formatPhone(e.target.value))
                        }
                        placeholder="(00) 00000-0000"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>

                  {/* Address fields for this unit */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                          <span>CEP</span>
                          {isLoadingUnitCep === index && (
                            <span className="text-[10px] text-indigo-600 flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Buscando...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={unit.zipCode || ''}
                          onChange={(e) => {
                            const val = formatCEP(e.target.value);
                            handleUpdateUnit(index, 'zipCode', val);
                            if (cleanNumeric(val).length === 8) {
                              handleLookupUnitCEP(index, val);
                            }
                          }}
                          maxLength={9}
                          placeholder="00000-000"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Logradouro (Rua, Avenida...)
                        </label>
                        <input
                          type="text"
                          value={unit.street || ''}
                          onChange={(e) => handleUpdateUnit(index, 'street', e.target.value)}
                          placeholder="Av. Brasil"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Número
                        </label>
                        <input
                          type="text"
                          value={unit.number || ''}
                          onChange={(e) => handleUpdateUnit(index, 'number', e.target.value)}
                          placeholder="100"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Complemento
                        </label>
                        <input
                          type="text"
                          value={unit.complement || ''}
                          onChange={(e) => handleUpdateUnit(index, 'complement', e.target.value)}
                          placeholder="Sala 204"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={unit.neighborhood || ''}
                          onChange={(e) => handleUpdateUnit(index, 'neighborhood', e.target.value)}
                          placeholder="Centro"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cidade / UF
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={unit.city || ''}
                            onChange={(e) => handleUpdateUnit(index, 'city', e.target.value)}
                            placeholder="Curitiba"
                            className="flex-1 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                          />
                          <input
                            type="text"
                            value={unit.state || ''}
                            onChange={(e) =>
                              handleUpdateUnit(index, 'state', e.target.value.toUpperCase())
                            }
                            maxLength={2}
                            placeholder="PR"
                            className="w-12 px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase font-semibold text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: CONTRACT STATUS & DATES */}
        {formSection === 'contract' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Status Live Preview Header */}
            <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-sky-50/40 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Status Vigente Calculado
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold border ${getContractStatusBadgeClass(
                      liveContract.status
                    )}`}
                  >
                    {liveContract.label}
                  </span>
                  {liveContract.daysRemaining !== null && (
                    <span className="text-xs text-slate-500 font-medium">
                      {liveContract.daysRemaining > 0
                        ? `${liveContract.daysRemaining} dias restantes de vigência`
                        : liveContract.daysRemaining === 0
                        ? 'Contrato expira hoje'
                        : `Vencido há ${Math.abs(liveContract.daysRemaining)} dias`}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <p>
                  O status &quot;A Vencer&quot; é ativado automaticamente quando faltam{' '}
                  <strong>30 dias ou menos</strong> para a data final.
                </p>
              </div>
            </div>

            {/* Contract Stage Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fase Comercial / Status Contratual <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'LEAD', label: 'Lead', desc: 'Em prospecção inicial' },
                  { id: 'EM_NEGOCIACAO', label: 'Em Negociação', desc: 'Proposta enviada' },
                  { id: 'CONTRATO_NEGADO', label: 'Contrato Negado', desc: 'Recusado ou cancelado' },
                  { id: 'CONTRATO_VIGENTE', label: 'Contrato Vigente', desc: 'Ativo e regular' },
                  { id: 'CONTRATO_A_VENCER', label: 'Contrato a Vencer', desc: 'Menos de 30 dias' },
                  { id: 'CONTRATO_VENCIDO', label: 'Contrato Vencido', desc: 'Expirado' },
                ].map((item) => {
                  const isSelected = contractStatus === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContractStatus(item.id as ClinicContractStatus)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{item.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contract Dates */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Vigência do Contrato
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Início da Vigência
                  </label>
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Data Final de Vigência (Vencimento)</span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      atualiza status auto
                    </span>
                  </label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Contract Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Observações de Contrato & Negociação
              </label>
              <textarea
                value={contractNotes}
                onChange={(e) => setContractNotes(e.target.value)}
                rows={3}
                placeholder="Detalhes adicionais sobre o contrato, cláusulas de renovação ou negociações em andamento..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
              />
            </div>
          </div>
        )}

        {/* Global Clinic Operational Status */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Acesso à Plataforma CRM</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="clinic_global_status"
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
                name="clinic_global_status"
                value="INATIVO"
                checked={status === 'INATIVO'}
                onChange={() => setStatus('INATIVO')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Inativa
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            {units.length} unidade(s) configurada(s)
          </div>

          <div className="flex items-center gap-3">
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
                  Salvando Clínica...
                </>
              ) : initialClinic ? (
                'Salvar Alterações'
              ) : (
                'Finalizar Cadastro da Clínica'
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
