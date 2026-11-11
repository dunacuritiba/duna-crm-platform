import React, { useState, useEffect } from 'react';
import type { ClinicMember, CreateClinicMemberInput, MemberRole, ClinicUnit } from '../../types/clinic';
import { Modal } from '../common/Modal';
import { formatPhone, cleanNumeric } from '../../utils/cnpj';
import { formatCPF } from '../../utils/cpf';
import {
  Stethoscope,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Mail,
  User as UserIcon,
  Phone,
  CreditCard,
  Award,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface ClinicMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateClinicMemberInput) => Promise<void>;
  clinicId: string;
  clinicName: string;
  units?: ClinicUnit[];
  initialMember?: ClinicMember | null;
  isSubmitting?: boolean;
}

export const ClinicMemberModal: React.FC<ClinicMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clinicId,
  clinicName,
  units = [],
  initialMember,
  isSubmitting = false,
}) => {
  const [role, setRole] = useState<MemberRole>('MEDICO');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [crm, setCrm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [selectedUnitNames, setSelectedUnitNames] = useState<string[]>([]);
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialMember) {
      setRole(initialMember.role);
      setName(initialMember.name);
      setEmail(initialMember.email);
      setPhone(initialMember.phone ? formatPhone(initialMember.phone) : '');
      setCpf(initialMember.cpf ? formatCPF(initialMember.cpf) : '');
      setCrm(initialMember.crm || '');
      setSpecialty(initialMember.specialty || '');
      setSelectedUnitNames(initialMember.unitNames || []);
      setStatus(initialMember.status);
      setErrorMsg(null);
    } else {
      setRole('MEDICO');
      setName('');
      setEmail('');
      setPhone('');
      setCpf('');
      setCrm('');
      setSpecialty('');
      // Default to all clinic units if available
      setSelectedUnitNames(units.map((u) => u.name));
      setStatus('ATIVO');
      setErrorMsg(null);
    }
  }, [initialMember, isOpen, units]);

  const toggleUnit = (unitName: string) => {
    if (selectedUnitNames.includes(unitName)) {
      setSelectedUnitNames(selectedUnitNames.filter((u) => u !== unitName));
    } else {
      setSelectedUnitNames([...selectedUnitNames, unitName]);
    }
  };

  const handleSelectAllUnits = () => {
    if (selectedUnitNames.length === units.length) {
      setSelectedUnitNames([]);
    } else {
      setSelectedUnitNames(units.map((u) => u.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Nome completo é obrigatório.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('E-mail é obrigatório.');
      return;
    }

    if (role === 'MEDICO' && !crm.trim()) {
      setErrorMsg('O CRM é obrigatório para o cadastro de Médico.');
      return;
    }

    // Pick first matching unitId if any
    const firstMatchingUnit = units.find((u) => selectedUnitNames.includes(u.name));

    try {
      await onSubmit({
        clinicId,
        unitId: firstMatchingUnit?.id || null,
        unitNames: selectedUnitNames,
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? cleanNumeric(phone) : undefined,
        cpf: cpf.trim() ? cleanNumeric(cpf) : undefined,
        crm: role === 'MEDICO' ? crm.trim() : undefined,
        specialty: role === 'MEDICO' ? (specialty.trim() || undefined) : undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao salvar colaborador.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMember ? 'Editar Profissional da Clínica' : 'Novo Profissional na Clínica'}
      subtitle={`Vinculado à unidade médica: ${clinicName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Função / Perfil do Profissional <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('MEDICO')}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                role === 'MEDICO'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  role === 'MEDICO' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Médico(a)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Corpo clínico, requer CRM e especialidade</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('SECRETARIA')}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                role === 'SECRETARIA'
                  ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20 text-sky-950'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  role === 'SECRETARIA' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Secretária / Recepção</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Atendimento e suporte de agendamentos</p>
              </div>
            </button>
          </div>
        </div>

        {/* Doctor-specific fields */}
        {role === 'MEDICO' && (
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              Dados do Conselho Profissional
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CRM do Médico <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={crm}
                  onChange={(e) => setCrm(e.target.value.toUpperCase())}
                  placeholder="Ex: CRM/SP 123456"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especialidade Médica
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Cardiologia, Pediatria"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Units Assignment */}
        {units.length > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Unidades onde o profissional atua
              </span>
              <button
                type="button"
                onClick={handleSelectAllUnits}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {selectedUnitNames.length === units.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {units.map((unit) => {
                const isChecked = selectedUnitNames.includes(unit.name);
                return (
                  <button
                    key={unit.name}
                    type="button"
                    onClick={() => toggleUnit(unit.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isChecked
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {unit.name} {unit.isMain && '(Matriz)'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Common Personal Information */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dra. Mariana Souza Santos"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail Institucional <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@clinica.com.br"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                CPF (Opcional)
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status na Clínica
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ATIVO' | 'INATIVO')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
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
                Salvando...
              </>
            ) : initialMember ? (
              'Atualizar Profissional'
            ) : (
              'Cadastrar Profissional'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
