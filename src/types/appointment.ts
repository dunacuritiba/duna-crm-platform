export type AppointmentStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'NAO_COMPARECEU';

export interface Appointment {
  id: string;
  clinicId: string;
  clinicName?: string;
  unitId?: string | null;
  unitName?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  doctorSpecialty?: string | null;
  attendantId?: string | null;
  attendantName?: string | null;
  patientName: string;
  patientCpf?: string;
  patientPhone?: string;
  patientEmail?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  clinicId: string;
  unitId?: string | null;
  doctorId?: string | null;
  attendantId?: string | null;
  patientName: string;
  patientCpf?: string;
  patientPhone?: string;
  patientEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  status?: AppointmentStatus;
  notes?: string;
}
