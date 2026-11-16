import React, { useState, useMemo } from 'react';
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from '../../types/appointment';
import type { MedicalClinic } from '../../types/clinic';
import type { User } from '../../types/user';
import { Modal } from '../common/Modal';
import { formatPhone } from '../../utils/cnpj';
import { formatCPF } from '../../utils/cpf';
import { isClinicContractActive } from '../../utils/contract';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Building2,
  Stethoscope,
  CalendarCheck,
  AlertCircle,
  Trash2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

interface ScheduleManagerProps {
  currentUser: User;
  appointments: Appointment[];
  clinics: MedicalClinic[];
  onCreateAppointment: (input: CreateAppointmentInput) => Promise<void>;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  onDeleteAppointment: (appointmentId: string) => Promise<void>;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  currentUser,
  appointments,
  clinics,
  onCreateAppointment,
  onUpdateStatus,
  onDeleteAppointment,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Available clinics for this user - STRICTLY ONLY clinics with active/vigente contracts (clientes ativos)
  const availableClinics = useMemo(() => {
    // 1. Strictly filter clinics that have an active contract (contrato vigente)
    const activeContractClinics = clinics.filter((c) =>
      isClinicContractActive(c.status, c.contractStatus, c.contractEndDate)
    );

    if (isAdmin) return activeContractClinics;

    // For attendants, show only active contract clinics in their portfolio
    return activeContractClinics.filter(
      (c) =>
        c.assignedAttendantId === currentUser.id ||
        (currentUser.assignedClinicIds && currentUser.assignedClinicIds.includes(c.id))
    );
  }, [clinics, currentUser, isAdmin]);

  // Non-eligible clinics count (leads, em negociação, contrato negado, vencido)
  const nonEligibleCount = useMemo(() => {
    const userClinics = isAdmin
      ? clinics
      : clinics.filter(
          (c) =>
            c.assignedAttendantId === currentUser.id ||
            (currentUser.assignedClinicIds && currentUser.assignedClinicIds.includes(c.id))
        );
    return userClinics.filter(
      (c) => !isClinicContractActive(c.status, c.contractStatus, c.contractEndDate)
    ).length;
  }, [clinics, currentUser, isAdmin]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateAppointmentInput>({
    clinicId: availableClinics[0]?.id || '',
    unitId: '',
    doctorId: '',
    patientName: '',
    patientCpf: '',
    patientPhone: '',
    patientEmail: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    notes: '',
  });

  // Selected clinic in form to derive units and doctors
  const formClinic = useMemo(() => {
    return availableClinics.find((c) => c.id === formData.clinicId);
  }, [availableClinics, formData.clinicId]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Attendant scope: only see appointments for clinics in their portfolio
      if (!isAdmin) {
        const userHasClinic = availableClinics.some((c) => c.id === appt.clinicId);
        if (!userHasClinic) return false;
      }

      const matchSearch =
        appt.patientName.toLowerCase().includes(search.toLowerCase()) ||
        (appt.clinicName && appt.clinicName.toLowerCase().includes(search.toLowerCase())) ||
        (appt.doctorName && appt.doctorName.toLowerCase().includes(search.toLowerCase())) ||
        (appt.patientCpf && appt.patientCpf.includes(search));

      const matchClinic = selectedClinicId === 'ALL' || appt.clinicId === selectedClinicId;
      const matchStatus = statusFilter === 'ALL' || appt.status === statusFilter;
      const matchDate = !dateFilter || appt.appointmentDate === dateFilter;

      return matchSearch && matchClinic && matchStatus && matchDate;
    });
  }, [appointments, availableClinics, isAdmin, search, selectedClinicId, statusFilter, dateFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    const agendados = filteredAppointments.filter((a) => a.status === 'AGENDADO').length;
    const confirmados = filteredAppointments.filter((a) => a.status === 'CONFIRMADO').length;
    const concluidos = filteredAppointments.filter((a) => a.status === 'CONCLUIDO').length;
    return { total, agendados, confirmados, concluidos };
  }, [filteredAppointments]);

  // Handle open create modal
  const handleOpenCreate = () => {
    const defaultClinic = availableClinics[0];
    setFormData({
      clinicId: defaultClinic?.id || '',
      unitId: defaultClinic?.units?.[0]?.id || '',
      doctorId: defaultClinic?.members?.filter((m) => m.role === 'MEDICO')?.[0]?.id || '',
      patientName: '',
      patientCpf: '',
      patientPhone: '',
      patientEmail: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '10:00',
      notes: '',
    });
    setErrorMessage(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clinicId) {
      setErrorMessage('Selecione a clínica para o agendamento.');
      return;
    }

    // Strict validation: Only clinics with active/vigente contracts are allowed
    const targetClinic = clinics.find((c) => c.id === formData.clinicId);
    if (
      !targetClinic ||
      !isClinicContractActive(
        targetClinic.status,
        targetClinic.contractStatus,
        targetClinic.contractEndDate
      )
    ) {
      setErrorMessage(
        'Apenas clínicas com contratos vigentes (clientes ativos) podem receber agendamentos. Leads e demais status não estão habilitados para a agenda.'
      );
      return;
    }

    if (!formData.patientName.trim()) {
      setErrorMessage('Informe o nome do paciente.');
      return;
    }
    if (!formData.appointmentDate || !formData.appointmentTime) {
      setErrorMessage('Informe a data e o horário do agendamento.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onCreateAppointment({
        ...formData,
        attendantId: currentUser.id,
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'AGENDADO':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIRMADO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EM_ANDAMENTO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONCLUIDO':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'CANCELADO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NAO_COMPARECEU':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Gestão de Agendas</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Apenas Clientes Ativos (Contrato Vigente)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {!isAdmin
                  ? `Gerenciando as agendas dos clientes com contrato vigente sob sua carteira de atendimento (${availableClinics.length} clínicas habilitadas)`
                  : `Visão unificada das agendas para as clínicas médicas com contrato vigente (${availableClinics.length} ativas)`}
              </p>
              {nonEligibleCount > 0 && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {nonEligibleCount} registro(s) com status Lead, Em Negociação ou Vencido ficam
                  automaticamente ocultos da agenda.
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={availableClinics.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      {/* Warning if no clinics with active contracts */}
      {availableClinics.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <h4 className="font-bold mb-0.5">
              Nenhuma clínica com contrato vigente disponível para agendamento
            </h4>
            <p className="leading-relaxed">
              De acordo com a regra de negócio do CRM, apenas clínicas médicas com{' '}
              <strong>Contrato Vigente (clientes ativos)</strong> podem receber agendamentos de
              consultas. Clínicas em estágio de Lead, Em Negociação, Contrato Negado ou Vencido
              permanecem indisponíveis na agenda até a vigência oficial do contrato.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total de Consultas
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            Agendadas
          </span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.agendados}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Confirmadas
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.confirmados}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
            Concluídas
          </span>
          <p className="text-2xl font-bold text-violet-700 mt-1">{stats.concluidos}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente, médico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
          </div>

          {/* Clinic Filter */}
          <div>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            >
              <option value="ALL">Todas com Contrato Vigente ({availableClinics.length})</option>
              {availableClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName || c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            >
              <option value="ALL">Todos os Status</option>
              <option value="AGENDADO">Agendado</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="NAO_COMPARECEU">Não Compareceu</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition whitespace-nowrap"
                title="Limpar filtro de data"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 min-w-[880px]">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Horário / Data</th>
                <th className="py-3 px-4 whitespace-nowrap">Paciente</th>
                <th className="py-3 px-4 whitespace-nowrap">Clínica & Unidade</th>
                <th className="py-3 px-4 whitespace-nowrap">Médico / Especialidade</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => {
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Horário & Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              {appt.appointmentTime}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {new Date(appt.appointmentDate + 'T00:00:00').toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-800">{appt.patientName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                            {appt.patientPhone && (
                              <a
                                href={`https://wa.me/55${appt.patientPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {formatPhone(appt.patientPhone)}
                              </a>
                            )}
                            {appt.patientCpf && (
                              <span className="whitespace-nowrap">CPF: {formatCPF(appt.patientCpf)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Clínica & Unidade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-slate-800">{appt.clinicName || 'Clínica'}</p>
                          <p className="text-[10px] text-slate-400">
                            {appt.unitName || 'Unidade Principal'}
                          </p>
                        </div>
                      </td>

                      {/* Médico */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-800">
                            {appt.doctorName || 'Dr(a). Não especificado'}
                          </p>
                          {appt.doctorSpecialty && (
                            <p className="text-[10px] text-slate-400">{appt.doctorSpecialty}</p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={appt.status}
                          onChange={(e) =>
                            onUpdateStatus(appt.id, e.target.value as AppointmentStatus)
                          }
                          className={`text-[10px] font-bold rounded-full px-2.5 py-1 border cursor-pointer focus:outline-none transition-colors whitespace-nowrap ${getStatusBadge(
                            appt.status
                          )}`}
                        >
                          <option value="AGENDADO">Agendado</option>
                          <option value="CONFIRMADO">Confirmado</option>
                          <option value="EM_ANDAMENTO">Em Andamento</option>
                          <option value="CONCLUIDO">Concluído</option>
                          <option value="CANCELADO">Cancelado</option>
                          <option value="NAO_COMPARECEU">Não Compareceu</option>
                        </select>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm('Excluir este agendamento?')) {
                              onDeleteAppointment(appt.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir agendamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Novo Agendamento */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Novo Agendamento de Paciente"
        subtitle="Agendar consulta para cliente da carteira de atendimento"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Clínica */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Clínica Médica
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Contrato Vigente
              </span>
            </div>
            <select
              value={formData.clinicId}
              onChange={(e) => {
                const cId = e.target.value;
                const c = availableClinics.find((x) => x.id === cId);
                setFormData((prev) => ({
                  ...prev,
                  clinicId: cId,
                  unitId: c?.units?.[0]?.id || '',
                  doctorId: c?.members?.filter((m) => m.role === 'MEDICO')?.[0]?.id || '',
                }));
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100"
            >
              {availableClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName || c.companyName} (Contrato Vigente)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Apenas clientes com contrato vigente estão habilitados. Leads e demais status não aparecem disponíveis.
            </p>
          </div>

          {/* Unidade & Médico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Unidade Física
              </label>
              <select
                value={formData.unitId || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, unitId: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              >
                <option value="">Selecione a unidade</option>
                {formClinic?.units?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.isMain ? '(Matriz)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-500" /> Médico Responsável
              </label>
              <select
                value={formData.doctorId || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
              >
                <option value="">Selecione o médico</option>
                {formClinic?.members
                  ?.filter((m) => m.role === 'MEDICO')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.specialty ? `(${m.specialty})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Data & Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> Data da Consulta
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="h-5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Horário
              </label>
              <input
                type="time"
                value={formData.appointmentTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, appointmentTime: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          {/* Paciente Dados */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dados do Paciente
            </h4>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                Nome do Paciente <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Eduardo Silveira"
                value={formData.patientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={formData.patientPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, patientPhone: formatPhone(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1">
                  CPF do Paciente
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.patientCpf}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, patientCpf: formatCPF(e.target.value) }))
                  }
                  maxLength={14}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Observações do Atendimento</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ex: Primeira consulta, queixa de dores lombares..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
