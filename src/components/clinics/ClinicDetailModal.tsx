import React, { useState } from 'react';
import type { MedicalClinic, ClinicMember, CreateClinicMemberInput } from '../../types/clinic';
import { Modal } from '../common/Modal';
import { ClinicMemberModal } from './ClinicMemberModal';
import { formatCNPJ, formatCEP, formatPhone } from '../../utils/cnpj';
import { formatCPF } from '../../utils/cpf';
import {
  Building2,
  Stethoscope,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  Award,
} from 'lucide-react';

interface ClinicDetailModalProps {
  clinic: MedicalClinic | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClinic: (clinic: MedicalClinic) => void;
  onToggleClinicStatus: (clinicId: string, currentStatus: 'ATIVO' | 'INATIVO') => Promise<void>;
  onCreateMember: (input: CreateClinicMemberInput) => Promise<void>;
  onUpdateMember: (id: string, updates: Partial<CreateClinicMemberInput>) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onToggleMemberStatus: (id: string, currentStatus: 'ATIVO' | 'INATIVO') => Promise<void>;
}

export const ClinicDetailModal: React.FC<ClinicDetailModalProps> = ({
  clinic,
  isOpen,
  onClose,
  onEditClinic,
  onToggleClinicStatus,
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
  onToggleMemberStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'team'>('team');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'ALL' | 'MEDICO' | 'SECRETARIA'>('ALL');

  // Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<ClinicMember | null>(null);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  if (!clinic) return null;

  const members = clinic.members || [];
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.crm && m.crm.toLowerCase().includes(memberSearch.toLowerCase())) ||
      (m.specialty && m.specialty.toLowerCase().includes(memberSearch.toLowerCase()));

    const matchesRole = memberRoleFilter === 'ALL' || m.role === memberRoleFilter;
    return matchesSearch && matchesRole;
  });

  const doctorsCount = members.filter((m) => m.role === 'MEDICO').length;
  const secretariesCount = members.filter((m) => m.role === 'SECRETARIA').length;

  const handleOpenAddMember = () => {
    setSelectedMemberForEdit(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: ClinicMember) => {
    setSelectedMemberForEdit(member);
    setIsMemberModalOpen(true);
  };

  const handleMemberSubmit = async (input: CreateClinicMemberInput) => {
    setIsSubmittingMember(true);
    try {
      if (selectedMemberForEdit) {
        await onUpdateMember(selectedMemberForEdit.id, input);
      } else {
        await onCreateMember(input);
      }
      setIsMemberModalOpen(false);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleDeleteMember = async (member: ClinicMember) => {
    if (window.confirm(`Deseja remover "${member.name}" da equipe da clínica?`)) {
      await onDeleteMember(member.id);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={clinic.tradeName || clinic.companyName}
        subtitle={`CNPJ: ${formatCNPJ(clinic.cnpj)} • Gestão da Unidade e Corpo Clínico`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Top Banner / Quick Info */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-sky-50/40 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800 truncate">
                  {clinic.companyName}
                </h3>
                {clinic.tradeName && clinic.tradeName !== clinic.companyName && (
                  <p className="text-xs text-slate-500 font-medium">Nome Fantasia: {clinic.tradeName}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      clinic.status === 'ATIVO'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {clinic.status === 'ATIVO' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Unidade Ativa
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Inativa
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    CNPJ: {formatCNPJ(clinic.cnpj)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onEditClinic(clinic)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                Editar Clínica
              </button>
              <button
                type="button"
                onClick={() => onToggleClinicStatus(clinic.id, clinic.status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  clinic.status === 'ATIVO'
                    ? 'border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100'
                }`}
              >
                {clinic.status === 'ATIVO' ? 'Inativar' : 'Reativar'}
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Equipe & Profissionais ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Dados Cadastrais & Endereço
            </button>
          </div>

          {/* TAB 1: TEAM (MÉDICOS E SECRETÁRIAS) */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              {/* Header with Stats & Add Member button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" /> {doctorsCount} Médico(s)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> {secretariesCount} Secretária(s)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddMember}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Médico / Secretária
                </button>
              </div>

              {/* Filter / Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Buscar profissional por nome, CRM ou especialidade..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMemberRoleFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      memberRoleFilter === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberRoleFilter('MEDICO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      memberRoleFilter === 'MEDICO'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Médicos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberRoleFilter('SECRETARIA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      memberRoleFilter === 'SECRETARIA'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Secretárias
                  </button>
                </div>
              </div>

              {/* Members List */}
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Nenhum profissional cadastrado</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {members.length === 0
                      ? 'Adicione médicos e secretárias que fazem parte desta clínica médica.'
                      : 'Nenhum profissional corresponde aos filtros de busca.'}
                  </p>
                  {members.length === 0 && (
                    <button
                      type="button"
                      onClick={handleOpenAddMember}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Profissional
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {filteredMembers.map((member) => {
                    const isDoctor = member.role === 'MEDICO';
                    return (
                      <div
                        key={member.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                          member.status === 'ATIVO'
                            ? 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                            : 'bg-slate-50/70 border-slate-200 text-slate-400 opacity-80'
                        }`}
                      >
                        <div>
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isDoctor
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-sky-100 text-sky-700'
                                }`}
                              >
                                {isDoctor ? (
                                  <Stethoscope className="w-4 h-4" />
                                ) : (
                                  <Briefcase className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {member.name}
                                </p>
                                <span
                                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                    isDoctor
                                      ? 'bg-indigo-50 text-indigo-700'
                                      : 'bg-sky-50 text-sky-700'
                                  }`}
                                >
                                  {isDoctor ? 'Médico(a)' : 'Secretária'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                member.status === 'ATIVO'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {member.status}
                            </span>
                          </div>

                          {/* Doctor specific CRM badge */}
                          {isDoctor && (
                            <div className="mb-2 p-2 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
                              <span className="font-mono font-bold text-indigo-900 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-indigo-600" />
                                {member.crm || 'CRM não informado'}
                              </span>
                              {member.specialty && (
                                <span className="text-[11px] text-indigo-700 font-medium truncate max-w-[140px]">
                                  {member.specialty}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Member contact details */}
                          <div className="space-y-1 text-[11px] text-slate-600">
                            <p className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </p>
                            {member.phone && (
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatPhone(member.phone)}</span>
                              </p>
                            )}
                            {member.cpf && (
                              <p className="font-mono text-slate-400 text-[10px]">
                                CPF: {formatCPF(member.cpf)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card bottom actions */}
                        <div className="flex items-center justify-end gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => onToggleMemberStatus(member.id, member.status)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title={member.status === 'ATIVO' ? 'Inativar' : 'Ativar'}
                          >
                            {member.status === 'ATIVO' ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditMember(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLINIC DETAILS & ADDRESS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Technical Responsible Section */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  Responsável Técnico da Unidade
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">CRM Responsável</p>
                    <p className="text-sm font-mono font-bold text-indigo-950">
                      {clinic.technicalResponsibleCrm}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Médico Responsável</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {clinic.technicalResponsibleName || 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specialties / Areas of Practice */}
              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Áreas de Atuação Médica
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {clinic.specialties && clinic.specialties.length > 0 ? (
                    clinic.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                      >
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Nenhuma especialidade registrada</span>
                  )}
                </div>
              </div>

              {/* Address Section */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  Endereço Cadastrado
                </span>
                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-semibold text-slate-900">
                    {[clinic.street, clinic.number].filter(Boolean).join(', ')}
                    {clinic.complement ? ` - ${clinic.complement}` : ''}
                  </p>
                  <p>
                    {[clinic.neighborhood, clinic.city, clinic.state].filter(Boolean).join(' • ')}
                  </p>
                  {clinic.zipCode && (
                    <p className="font-mono text-slate-500">
                      CEP: {formatCEP(clinic.zipCode)}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" /> Telefone / WhatsApp
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {clinic.phone ? formatPhone(clinic.phone) : 'Não informado'}
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> E-mail Institucional
                  </span>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {clinic.email || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Cadastrado em {new Date(clinic.createdAt).toLocaleDateString('pt-BR')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Member Form Modal (Médico / Secretária) */}
      <ClinicMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSubmit={handleMemberSubmit}
        clinicId={clinic.id}
        clinicName={clinic.tradeName || clinic.companyName}
        initialMember={selectedMemberForEdit}
        isSubmitting={isSubmittingMember}
      />
    </>
  );
};
