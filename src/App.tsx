import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, CreateUserInput, SignUpInput, UpdateUserProfileInput, UpdateUserInput, AuthScreen } from './types/user';
import type { MedicalClinic, CreateClinicInput, CreateClinicMemberInput } from './types/clinic';
import type { Lead, CreateLeadInput, LeadStatus } from './types/lead';
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from './types/appointment';
import {
  fetchUsersFromSupabase,
  createSupabaseUser,
  signUpUser,
  verifyRegistrationOtp,
  resendOtp,
  requestPasswordReset,
  completePasswordReset,
  loginUser,
  updateSupabaseUserSelf,
  updateSupabaseUserByAdmin,
  updateUserPresence,
  setUserOffline,
  subscribeToOnlinePresence,
  subscribeToUserChanges,
  isUserOnline,
  getCurrentUserId,
  clearCurrentSession,
} from './services/userService';
import {
  fetchClinicsFromSupabase,
  createClinicInSupabase,
  updateClinicInSupabase,
  toggleClinicStatusInSupabase,
  createClinicMemberInSupabase,
  updateClinicMemberInSupabase,
  deleteClinicMemberInSupabase,
  toggleClinicMemberStatusInSupabase,
} from './services/clinicService';
import {
  fetchLeadsFromSupabase,
  createLeadInSupabase,
  updateLeadInSupabase,
  updateLeadStatusInSupabase,
  deleteLeadInSupabase,
  convertLeadToClinicInSupabase,
} from './services/leadService';
import {
  fetchAppointmentsFromSupabase,
  createAppointmentInSupabase,
  updateAppointmentStatusInSupabase,
  deleteAppointmentInSupabase,
} from './services/appointmentService';
import { isClinicContractActive } from './utils/contract';
import type { AppNotification, CreateNotificationInput } from './types/notification';
import type { Ticket, CreateTicketInput, TicketStatus } from './types/ticket';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createBroadcastNotification,
  mapDbToNotification,
} from './services/notificationService';
import {
  fetchTicketsFromSupabase,
  createTicketInSupabase,
  updateTicketStatusInSupabase,
} from './services/ticketService';
import { fetchUnreadMessageCounts } from './services/chatService';
import { supabase } from './services/supabase';
import { Header } from './components/layout/Header';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { Overview } from './components/dashboard/Overview';
import { UserList } from './components/users/UserList';
import { UserForm } from './components/users/UserForm';
import { UserDetailModal } from './components/users/UserDetailModal';
import { UserEditModal } from './components/users/UserEditModal';
import { PortfolioDistributionModal } from './components/users/PortfolioDistributionModal';
import { PortfolioManager } from './components/portfolio/PortfolioManager';
import { ScheduleManager } from './components/appointments/ScheduleManager';
import { ClinicList } from './components/clinics/ClinicList';
import { ClinicFormModal } from './components/clinics/ClinicFormModal';
import { ClinicDetailModal } from './components/clinics/ClinicDetailModal';
import { LeadList } from './components/leads/LeadList';
import { LeadFormModal } from './components/leads/LeadFormModal';
import { LeadDetailModal } from './components/leads/LeadDetailModal';
import { MyProfile } from './components/profile/MyProfile';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { BroadcastNotificationModal } from './components/notifications/BroadcastNotificationModal';
import { ChatView } from './components/chat/ChatView';
import { TicketList } from './components/support/TicketList';
import { TicketCreateModal } from './components/support/TicketCreateModal';
import { TicketDetailModal } from './components/support/TicketDetailModal';
import { Modal } from './components/common/Modal';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyOtpView } from './components/auth/VerifyOtpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { ScreenLoading } from './components/common/ScreenLoading';
import {
  Building2,
  Target,
  Loader2,
  Layers,
  Users,
  Briefcase,
  CalendarCheck,
  SlidersHorizontal,
} from 'lucide-react';

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const usersRef = useRef<User[]>([]);
  usersRef.current = users;
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const presenceTeardownRef = useRef<(() => void) | null>(null);
  const [clinics, setClinics] = useState<MedicalClinic[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentUserIdState, setCurrentUserIdState] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [currentTab, setCurrentTab] = useState<NavTab>('users');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // OTP Context for registration & recovery
  const [otpEmail, setOtpEmail] = useState<string>('');

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // User Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [selectedUserForPortfolio, setSelectedUserForPortfolio] = useState<User | null>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  // Clinic Modals state
  const [isClinicFormModalOpen, setIsClinicFormModalOpen] = useState(false);
  const [selectedClinicForEdit, setSelectedClinicForEdit] = useState<MedicalClinic | null>(null);
  const [selectedClinicForDetail, setSelectedClinicForDetail] = useState<MedicalClinic | null>(null);
  const [isSubmittingClinic, setIsSubmittingClinic] = useState(false);

  // Lead Modals state
  const [isLeadFormModalOpen, setIsLeadFormModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isTicketCreateModalOpen, setIsTicketCreateModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);

  // Ticket viewed mentions state: mapping ticketId -> timestamp ISO string
  const [viewedMentionTicketIds, setViewedMentionTicketIds] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`duna_ticket_mentions_viewed_${currentUserIdState}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync viewed mentions when user changes
  useEffect(() => {
    if (!currentUserIdState) return;
    try {
      const saved = localStorage.getItem(`duna_ticket_mentions_viewed_${currentUserIdState}`);
      setViewedMentionTicketIds(saved ? JSON.parse(saved) : {});
    } catch {
      setViewedMentionTicketIds({});
    }
  }, [currentUserIdState]);

  const handleMarkTicketMentionAsViewed = useCallback((ticketId: string) => {
    if (!currentUserIdState) return;
    const nowIso = new Date().toISOString();
    setViewedMentionTicketIds((prev) => {
      const next = { ...prev, [ticketId]: nowIso };
      try {
        localStorage.setItem(`duna_ticket_mentions_viewed_${currentUserIdState}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [currentUserIdState]);

  const handleMarkAllTicketMentionsAsViewed = useCallback(() => {
    if (!currentUserIdState) return;
    const nowIso = new Date().toISOString();
    setViewedMentionTicketIds((prev) => {
      const next = { ...prev };
      tickets.forEach((t) => {
        if (t.mentionedUserIds?.includes(currentUserIdState)) {
          next[t.id] = nowIso;
        }
      });
      try {
        localStorage.setItem(`duna_ticket_mentions_viewed_${currentUserIdState}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [currentUserIdState, tickets]);

  const handleViewTicket = useCallback((ticket: Ticket) => {
    setSelectedTicketForDetail(ticket);
    if (currentUserIdState && ticket.mentionedUserIds?.includes(currentUserIdState)) {
      handleMarkTicketMentionAsViewed(ticket.id);
    }
  }, [currentUserIdState, handleMarkTicketMentionAsViewed]);

  // Chat unread count state
  const [chatUnreadCounts, setChatUnreadCounts] = useState<Record<string, number>>({});

  const handleMarkChannelAsRead = useCallback((channelId: string) => {
    setChatUnreadCounts((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
    try {
      localStorage.setItem(`duna_chat_read_${currentUserIdState}_${channelId}`, new Date().toISOString());
    } catch {}
  }, [currentUserIdState]);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random()}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load leads from Supabase
  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeadsFromSupabase();
      setLeads(data);

      setSelectedLeadForDetail((prev) => {
        if (!prev) return null;
        return data.find((l) => l.id === prev.id) || null;
      });
    } catch (err: any) {
      console.warn('Falha ao carregar leads:', err);
    }
  }, []);

  // Load appointments from Supabase
  const loadAppointments = useCallback(async () => {
    try {
      const data = await fetchAppointmentsFromSupabase();
      setAppointments(data);
    } catch (err: any) {
      console.warn('Falha ao carregar agendamentos:', err);
    }
  }, []);

  // Load clinics from Supabase
  const loadClinics = useCallback(async () => {
    try {
      const data = await fetchClinicsFromSupabase();
      setClinics(data);

      setSelectedClinicForDetail((prev) => {
        if (!prev) return null;
        return data.find((c) => c.id === prev.id) || null;
      });
    } catch (err: any) {
      console.warn('Falha ao carregar clínicas:', err);
    }
  }, []);

  // Load notifications from Supabase
  const loadNotifications = useCallback(async (userId?: string, userRole?: string) => {
    if (!userId || !userRole) return;
    try {
      const data = await fetchUserNotifications(userId, userRole);
      setNotifications(data);
    } catch (err: any) {
      console.warn('Falha ao carregar notificações:', err);
    }
  }, []);

  // Load tickets from Supabase
  const loadTickets = useCallback(async () => {
    try {
      const data = await fetchTicketsFromSupabase(usersRef.current);
      setTickets(data);
      setSelectedTicketForDetail((prev) => {
        if (!prev) return null;
        return data.find((t) => t.id === prev.id) || null;
      });
    } catch (err: any) {
      console.warn('Falha ao carregar chamados:', err);
    }
  }, []);

  // Load chat unread message counts
  const loadChatUnreads = useCallback(async (userId?: string) => {
    if (!userId) return;
    try {
      const counts = await fetchUnreadMessageCounts(userId);
      setChatUnreadCounts(counts);
    } catch (err: any) {
      console.warn('Falha ao carregar mensagens não lidas:', err);
    }
  }, []);

  // Load users from Supabase duna-flow
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsersFromSupabase();
      setUsers(data);

      const savedId = getCurrentUserId();
      const userExists = data.find((u) => u.id === savedId);
      if (userExists && userExists.status === 'ATIVO') {
        setCurrentUserIdState(savedId);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      addToast('error', 'Falha ao carregar dados', err?.message || 'Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Silent user refresh without screen loading
  const refreshUsersSilently = useCallback(async () => {
    try {
      const data = await fetchUsersFromSupabase();
      setUsers(data);
    } catch {
      // silent refresh
    }
  }, []);

  // Current active user
  const currentUser = users.find((u) => u.id === currentUserIdState);

  // Real-time presence & user database sync (Zero page reload required)
  useEffect(() => {
    if (!isAuthenticated || !currentUserIdState) return;

    const activeUser = usersRef.current.find((u) => u.id === currentUserIdState);
    if (!activeUser) return;

    // Load initial notifications & chat unread counts for current user
    loadNotifications(activeUser.id, activeUser.role);
    loadChatUnreads(activeUser.id);

    // 1. Subscribe to Realtime Presence Channel (instant join/leave events across all clients)
    const unsubscribePresence = subscribeToOnlinePresence(
      activeUser.id,
      activeUser.name,
      (ids) => {
        setOnlineUserIds(ids);
      }
    );
    presenceTeardownRef.current = unsubscribePresence;

    // 2. Subscribe to Realtime Database Changes (instant updates without reload)
    const unsubscribeDb = subscribeToUserChanges((changedUser, eventType) => {
      setUsers((prev) => {
        if (eventType === 'DELETE') {
          return prev.filter((u) => u.id !== changedUser.id);
        }
        if (eventType === 'INSERT') {
          if (prev.some((u) => u.id === changedUser.id)) return prev;
          return [changedUser, ...prev];
        }
        return prev.map((u) => (u.id === changedUser.id ? { ...u, ...changedUser } : u));
      });
    });

    // 3. Real-time Notifications subscription
    const notifSub = supabase
      .channel('crm_notifs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_notifications' },
        (payload) => {
          const newNotif = mapDbToNotification(payload.new, false);
          if (
            newNotif.targetType === 'ALL' ||
            (newNotif.targetType === 'ROLE' && newNotif.targetRole === activeUser.role) ||
            (newNotif.targetType === 'USER' && newNotif.targetUserId === activeUser.id)
          ) {
            setNotifications((prev) => [newNotif, ...prev]);
            addToast(
              newNotif.type === 'URGENTE' ? 'error' : newNotif.type === 'ALERTA' ? 'info' : 'success',
              newNotif.title,
              newNotif.message
            );
          }
        }
      )
      .subscribe();

    // 4. Real-time Tickets subscription
    const ticketSub = supabase
      .channel('crm_tickets_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_tickets' },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    // 5. Real-time Chat Messages subscription for badge
    const chatSub = supabase
      .channel('crm_chat_messages_realtime_badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_chat_messages' },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.sender_id !== activeUser.id) {
            setChatUnreadCounts((prev) => ({
              ...prev,
              [newMsg.channel_id]: (prev[newMsg.channel_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    // 6. Periodic heartbeat for database persistence (every 45s)
    updateUserPresence(activeUser.id);
    const interval = setInterval(() => {
      updateUserPresence(activeUser.id);
      refreshUsersSilently();
    }, 45000);

    return () => {
      clearInterval(interval);
      unsubscribePresence();
      unsubscribeDb();
      supabase.removeChannel(notifSub);
      supabase.removeChannel(ticketSub);
      supabase.removeChannel(chatSub);
    };
  }, [isAuthenticated, currentUserIdState]);

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsInitialLoading(true);
        await Promise.all([
          loadUsers(),
          loadClinics(),
          loadLeads(),
          loadAppointments(),
          loadTickets(),
        ]);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enriched users with dynamically calculated active contract portfolio count & instant presence
  const enrichedUsers = useMemo(() => {
    return users.map((u) => {
      const isOnline = isUserOnline(u, currentUserIdState, onlineUserIds);
      let assignedClinicsCount = u.assignedClinicsCount;
      if (u.role === 'ATENDENTE') {
        assignedClinicsCount = clinics.filter(
          (c) =>
            isClinicContractActive(c.status, c.contractStatus, c.contractEndDate) &&
            (c.assignedAttendantId === u.id || u.assignedClinicIds?.includes(c.id))
        ).length;
      }
      return {
        ...u,
        isOnline,
        assignedClinicsCount,
      };
    });
  }, [users, clinics, currentUserIdState, onlineUserIds]);

  // Badges calculations: Chat unread messages & Tickets where current user is mentioned
  const totalChatUnreadCount = useMemo(() => {
    return Object.values(chatUnreadCounts).reduce((acc, count) => acc + count, 0);
  }, [chatUnreadCounts]);

  const ticketMentionCount = useMemo(() => {
    if (!currentUserIdState) return 0;
    return tickets.filter((t) => {
      if (t.status === 'RESOLVIDO' || t.status === 'FECHADO') return false;
      if (!t.mentionedUserIds?.includes(currentUserIdState)) return false;
      const viewedAt = viewedMentionTicketIds[t.id];
      if (!viewedAt) return true;
      const ticketTime = new Date(t.updatedAt || t.createdAt).getTime();
      const viewedTime = new Date(viewedAt).getTime();
      return ticketTime > viewedTime;
    }).length;
  }, [tickets, currentUserIdState, viewedMentionTicketIds]);

  // STRICT ACCESS CONTROL:
  // - ADMIN has access to all tabs
  // - ATENDENTE has access to 'agendas', 'clinics', 'chat', 'support', and 'profile'
  // - USUARIO has access to 'profile', 'chat', and 'support'
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'USUARIO' && !['profile', 'chat', 'support'].includes(currentTab)) {
      setCurrentTab('profile');
    } else if (
      currentUser.role === 'ATENDENTE' &&
      !['agendas', 'clinics', 'profile', 'chat', 'support'].includes(currentTab)
    ) {
      setCurrentTab('agendas');
    }
  }, [currentUser, currentTab]);

  const handleSelectTab = (tab: NavTab) => {
    if (tab === currentTab) return;
    setIsTabLoading(true);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setIsTabLoading(false);
    }, 240);
  };

  const isManagementTab = ['users', 'clinics', 'portfolio', 'agendas', 'leads'].includes(currentTab);

  const managementSubTabs = useMemo(() => {
    if (!currentUser) return [];
    const isAttendant = currentUser.role === 'ATENDENTE';

    const items = [
      {
        id: 'users' as NavTab,
        label: 'Usuários',
        icon: Users,
        description: 'Contas e acessos',
        allowedRoles: ['ADMIN'],
      },
      {
        id: 'clinics' as NavTab,
        label: isAttendant ? 'Minha Carteira' : 'Clínicas Médicas',
        icon: isAttendant ? Briefcase : Building2,
        description: 'CNPJ e contratos',
        allowedRoles: ['ADMIN', 'ATENDENTE'],
      },
      {
        id: 'portfolio' as NavTab,
        label: 'Carteiras de Clientes',
        icon: Briefcase,
        description: 'Distribuição de clientes',
        allowedRoles: ['ADMIN'],
      },
      {
        id: 'agendas' as NavTab,
        label: 'Agendas & Consultas',
        icon: CalendarCheck,
        description: 'Pacientes e horários',
        allowedRoles: ['ADMIN', 'ATENDENTE'],
      },
      {
        id: 'leads' as NavTab,
        label: 'Funil de Leads',
        icon: Target,
        description: 'Captação comercial',
        allowedRoles: ['ADMIN'],
      },
    ];

    return items.filter((item) => item.allowedRoles.includes(currentUser.role));
  }, [currentUser]);

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'overview':
        return 'Visão Geral do CRM';
      case 'users':
        return 'Gestão • Usuários';
      case 'clinics':
        return currentUser?.role === 'ATENDENTE' ? 'Gestão • Minha Carteira' : 'Gestão • Clínicas Médicas';
      case 'portfolio':
        return 'Gestão • Carteiras de Clientes';
      case 'agendas':
        return 'Gestão • Agendas & Consultas';
      case 'leads':
        return 'Gestão • Funil de Leads & Prospecção';
      case 'chat':
        return 'Chat Interno da Plataforma';
      case 'support':
        return 'Central de Suporte DunaCRM';
      case 'profile':
        return 'Meus Dados';
      default:
        return 'Tela';
    }
  };

  // ---------------- AUTH HANDLERS ---------------- //

  // Login
  const handleLogin = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      const loggedUser = await loginUser(email, pass);
      await loadUsers();
      await loadClinics();
      await loadLeads();
      await loadAppointments();
      setCurrentUserIdState(loggedUser.id);
      setIsAuthenticated(true);

      if (loggedUser.role === 'USUARIO') {
        setCurrentTab('profile');
      } else if (loggedUser.role === 'ATENDENTE') {
        setCurrentTab('agendas');
      } else {
        setCurrentTab('users');
      }

      addToast(
        'success',
        `Bem-vindo(a), ${loggedUser.name}!`,
        loggedUser.role === 'ADMIN'
          ? 'Painel Administrativo completo liberado.'
          : loggedUser.role === 'ATENDENTE'
          ? 'Painel da Equipe de Atendimento e Carteira liberados.'
          : 'Acesso restrito ao seu painel "Meus Dados".'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Self Registration
  const handleRegister = async (data: SignUpInput) => {
    setIsAuthLoading(true);
    try {
      const result = await signUpUser(data);
      setOtpEmail(result.user.email);
      setAuthScreen('verify-registration-otp');
      addToast(
        'info',
        'Código OTP enviado!',
        `Enviamos um código de verificação para o e-mail ${result.user.email}.`
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Verify Registration OTP
  const handleVerifyRegistrationOtp = async (email: string, code: string) => {
    setIsAuthLoading(true);
    try {
      const activatedUser = await verifyRegistrationOtp(email, code);
      await loadUsers();
      await loadClinics();
      await loadLeads();
      setCurrentUserIdState(activatedUser.id);
      setIsAuthenticated(true);
      setCurrentTab('profile');
      addToast(
        'success',
        'Conta ativada com sucesso!',
        'Seu acesso foi liberado com o perfil USUÁRIO.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async (email: string) => {
    setIsAuthLoading(true);
    try {
      await resendOtp(email, 'REGISTRATION');
      addToast('info', 'Código reenviado', `Um novo código OTP foi enviado para ${email}.`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Request Password Reset
  const handleRequestPasswordReset = async (email: string) => {
    setIsAuthLoading(true);
    try {
      const res = await requestPasswordReset(email);
      addToast(
        'info',
        'Código de recuperação enviado',
        `Verifique seu e-mail (${email}) com o código de 6 dígitos.`
      );
      return res;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Complete Password Reset
  const handleCompletePasswordReset = async (email: string, code: string, newPass: string) => {
    setIsAuthLoading(true);
    try {
      await completePasswordReset(email, code, newPass);
      setAuthScreen('login');
      addToast(
        'success',
        'Senha redefinida com sucesso!',
        'Sua nova senha foi salva. Faça login para acessar.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    const leavingUserId = currentUserIdState;
    if (presenceTeardownRef.current) {
      presenceTeardownRef.current();
      presenceTeardownRef.current = null;
    }
    if (leavingUserId) {
      setUserOffline(leavingUserId);
    }
    clearCurrentSession();
    setCurrentUserIdState('');
    setIsAuthenticated(false);
    setAuthScreen('login');
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      next.delete(leavingUserId);
      return next;
    });
    addToast('info', 'Sessão encerrada', 'Você saiu da plataforma com segurança.');
  };

  // ---------------- NOTIFICATIONS HANDLERS ---------------- //
  const handleMarkNotificationAsRead = async (id: string) => {
    if (!currentUser) return;
    await markNotificationAsRead(id, currentUser.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    await markAllNotificationsAsRead(unreadIds, currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleCreateBroadcastNotification = async (input: CreateNotificationInput) => {
    try {
      const created = await createBroadcastNotification(input);
      addToast('success', 'Comunicado disparado!', 'A notificação foi entregue aos destinatários.');
      setNotifications((prev) => [created, ...prev]);
    } catch (err: any) {
      addToast('error', 'Falha ao disparar comunicado', err?.message || 'Tente novamente.');
    }
  };

  // ---------------- SUPPORT TICKETS HANDLERS ---------------- //
  const handleCreateTicket = async (input: CreateTicketInput) => {
    try {
      const newTicket = await createTicketInSupabase(input, enrichedUsers);
      setTickets((prev) => [newTicket, ...prev]);
      addToast(
        'success',
        `Chamado ${newTicket.ticketNumber} aberto!`,
        `SLA iniciado com prazo de ${newTicket.slaHours} horas.`
      );
    } catch (err: any) {
      addToast('error', 'Falha ao abrir chamado', err?.message || 'Tente novamente.');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await updateTicketStatusInSupabase(ticketId, newStatus);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      setSelectedTicketForDetail((prev) =>
        prev?.id === ticketId ? { ...prev, status: newStatus } : prev
      );
      addToast('success', 'Status atualizado!', `Chamado atualizado para ${newStatus}.`);
    } catch (err: any) {
      addToast('error', 'Falha ao atualizar status', err?.message || 'Tente novamente.');
    }
  };

  // ---------------- USER ADMIN HANDLERS ---------------- //

  // Create new user by Admin
  const handleCreateUserByAdmin = async (data: CreateUserInput) => {
    setIsAuthLoading(true);
    try {
      const newUser = await createSupabaseUser(data);
      await loadUsers();
      setIsCreateModalOpen(false);

      addToast(
        'success',
        'Usuário cadastrado com sucesso!',
        `${newUser.name} foi criado com perfil USUÁRIO (acesso apenas a "Meus Dados").`
      );
    } catch (err: any) {
      const msg = err?.message || '';
      let friendlyError = 'Não foi possível cadastrar o usuário.';
      if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('crm_users_cpf_key')) {
        friendlyError = 'Já existe um usuário cadastrado com este CPF no sistema.';
      } else if (msg.includes('crm_users_email_key')) {
        friendlyError = 'Já existe um usuário cadastrado com este e-mail no sistema.';
      }
      addToast('error', 'Erro ao cadastrar', friendlyError);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Update profile by user self
  const handleUpdateProfile = async (updates: UpdateUserProfileInput) => {
    if (!currentUser) return;
    try {
      await updateSupabaseUserSelf(currentUser.id, updates);
      await loadUsers();
      addToast(
        'success',
        'Foto e perfil atualizados!',
        'Sua nova foto de perfil foi salva com sucesso.'
      );
    } catch (err: any) {
      addToast('error', 'Erro ao atualizar perfil', err?.message || 'Falha ao salvar alterações.');
    }
  };

  // Toggle user status (Admin)
  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const nextStatus = target.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';

    try {
      await updateSupabaseUserByAdmin(userId, { status: nextStatus });
      await loadUsers();
      addToast(
        nextStatus === 'ATIVO' ? 'success' : 'info',
        `Usuário ${nextStatus === 'ATIVO' ? 'Ativado' : 'Inativado'}`,
        `${target.name} agora está marcado como ${nextStatus}.`
      );
    } catch (err: any) {
      addToast('error', 'Erro ao alterar status', err?.message || 'Falha na comunicação com o banco.');
    }
  };

  // ---------------- CLINICS HANDLERS ---------------- //

  const handleCreateOrUpdateClinic = async (input: CreateClinicInput) => {
    setIsSubmittingClinic(true);
    try {
      if (selectedClinicForEdit) {
        await updateClinicInSupabase(selectedClinicForEdit.id, input);
        addToast('success', 'Clínica atualizada!', 'Os dados cadastrais foram salvos com sucesso.');
      } else {
        await createClinicInSupabase(input);
        addToast('success', 'Clínica cadastrada com sucesso!', 'Nova unidade médica registrada no sistema.');
      }
      await loadClinics();
      setIsClinicFormModalOpen(false);
      setSelectedClinicForEdit(null);
    } catch (err: any) {
      addToast('error', 'Erro ao salvar clínica', err?.message || 'Falha ao processar operação.');
      throw err;
    } finally {
      setIsSubmittingClinic(false);
    }
  };

  const handleToggleClinicStatus = async (clinicId: string, currentStatus: 'ATIVO' | 'INATIVO') => {
    try {
      await toggleClinicStatusInSupabase(clinicId, currentStatus);
      await loadClinics();
      addToast('info', 'Status da clínica alterado', `A clínica agora está ${currentStatus === 'ATIVO' ? 'Inativa' : 'Ativa'}.`);
    } catch (err: any) {
      addToast('error', 'Erro ao alterar status', err?.message);
    }
  };

  const handleCreateClinicMember = async (input: CreateClinicMemberInput) => {
    try {
      await createClinicMemberInSupabase(input);
      await loadClinics();
      addToast(
        'success',
        'Profissional adicionado à equipe!',
        `${input.role === 'MEDICO' ? 'Médico(a)' : 'Secretária'} cadastrado com sucesso.`
      );
    } catch (err: any) {
      addToast('error', 'Erro ao cadastrar profissional', err?.message);
      throw err;
    }
  };

  const handleUpdateClinicMember = async (memberId: string, updates: Partial<CreateClinicMemberInput>) => {
    try {
      await updateClinicMemberInSupabase(memberId, updates);
      await loadClinics();
      addToast('success', 'Profissional atualizado!', 'Alterações salvas com sucesso.');
    } catch (err: any) {
      addToast('error', 'Erro ao atualizar profissional', err?.message);
      throw err;
    }
  };

  const handleDeleteClinicMember = async (memberId: string) => {
    try {
      await deleteClinicMemberInSupabase(memberId);
      await loadClinics();
      addToast('info', 'Profissional removido', 'O colaborador foi desvinculado da clínica.');
    } catch (err: any) {
      addToast('error', 'Erro ao remover colaborador', err?.message);
      throw err;
    }
  };

  const handleToggleClinicMemberStatus = async (memberId: string, currentStatus: 'ATIVO' | 'INATIVO') => {
    try {
      await toggleClinicMemberStatusInSupabase(memberId, currentStatus);
      await loadClinics();
      addToast(
        'info',
        'Status alterado',
        `Colaborador agora está ${currentStatus === 'ATIVO' ? 'Inativo' : 'Ativo'}.`
      );
    } catch (err: any) {
      addToast('error', 'Erro ao alterar status', err?.message);
    }
  };

  // ---------------- LEADS HANDLERS (ADMIN ONLY) ---------------- //

  const handleCreateOrUpdateLead = async (input: CreateLeadInput) => {
    setIsSubmittingLead(true);
    try {
      if (selectedLeadForEdit) {
        await updateLeadInSupabase(selectedLeadForEdit.id, input);
        addToast('success', 'Lead atualizado!', 'Os dados do prospect foram salvos.');
      } else {
        await createLeadInSupabase(input);
        addToast('success', 'Lead cadastrado com sucesso!', 'Novo prospect adicionado ao funil comercial.');
      }
      await loadLeads();
      setIsLeadFormModalOpen(false);
      setSelectedLeadForEdit(null);
    } catch (err: any) {
      addToast('error', 'Erro ao salvar lead', err?.message || 'Falha ao processar operação.');
      throw err;
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus, lossReason?: string) => {
    try {
      await updateLeadStatusInSupabase(leadId, status, lossReason);
      await loadLeads();
      addToast('info', 'Estágio do funil atualizado', `Lead movido para "${status}".`);
    } catch (err: any) {
      addToast('error', 'Erro ao atualizar estágio', err?.message);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLeadInSupabase(leadId);
      await loadLeads();
      addToast('info', 'Lead removido', 'O registro foi excluído do pipeline.');
    } catch (err: any) {
      addToast('error', 'Erro ao excluir lead', err?.message);
    }
  };

  const handleConvertToClinic = async (lead: Lead, technicalCrm: string) => {
    try {
      const { clinic } = await convertLeadToClinicInSupabase(lead, technicalCrm);
      await loadLeads();
      await loadClinics();
      addToast(
        'success',
        'Lead Convertido em Clínica!',
        `A clínica "${clinic.companyName}" foi registrada oficialmente com CRM ${technicalCrm}.`
      );
    } catch (err: any) {
      addToast('error', 'Falha na conversão', err?.message);
      throw err;
    }
  };

  // ---------------- USER EDIT & PORTFOLIO HANDLERS ---------------- //

  const handleSaveUserEdit = async (userId: string, data: UpdateUserInput) => {
    try {
      await updateSupabaseUserByAdmin(userId, data);
      await loadUsers();
      await loadClinics();
      addToast(
        'success',
        'Cadastro atualizado!',
        'As alterações de perfil e permissões foram salvas com sucesso.'
      );
    } catch (err: any) {
      addToast('error', 'Falha ao atualizar usuário', err?.message);
      throw err;
    }
  };

  // ---------------- APPOINTMENT HANDLERS ---------------- //

  const handleCreateAppointment = async (input: CreateAppointmentInput) => {
    try {
      await createAppointmentInSupabase(input);
      await loadAppointments();
      addToast(
        'success',
        'Consulta agendada!',
        `Agendamento confirmado para o paciente ${input.patientName}.`
      );
    } catch (err: any) {
      addToast('error', 'Erro ao agendar consulta', err?.message);
      throw err;
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatusInSupabase(id, status);
      await loadAppointments();
      addToast('info', 'Status atualizado', `Agendamento alterado para ${status}.`);
    } catch (err: any) {
      addToast('error', 'Erro ao atualizar status', err?.message);
      throw err;
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointmentInSupabase(id);
      await loadAppointments();
      addToast('info', 'Agendamento removido', 'O registro foi excluído da agenda.');
    } catch (err: any) {
      addToast('error', 'Erro ao remover agendamento', err?.message);
      throw err;
    }
  };

  // ---------------- RENDER INITIAL APP LOADING ---------------- //
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 antialiased">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-indigo-200">
            <Layers className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Duna<span className="text-indigo-600">CRM</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500 font-medium">
              <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Carregando plataforma e sincronizando dados...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- RENDER AUTH VIEWS ---------------- //

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center antialiased">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />

        {authScreen === 'login' && (
          <LoginView
            onLogin={handleLogin}
            onNavigate={(screen, prefillEmail) => {
              if (prefillEmail) setOtpEmail(prefillEmail);
              setAuthScreen(screen);
            }}
            isLoading={isAuthLoading}
          />
        )}

        {authScreen === 'register' && (
          <RegisterView
            onRegister={handleRegister}
            onNavigate={(screen) => setAuthScreen(screen)}
            isLoading={isAuthLoading}
          />
        )}

        {authScreen === 'verify-registration-otp' && (
          <VerifyOtpView
            email={otpEmail}
            onVerify={handleVerifyRegistrationOtp}
            onResendOtp={handleResendOtp}
            onNavigate={(screen) => setAuthScreen(screen)}
            isLoading={isAuthLoading}
          />
        )}

        {authScreen === 'forgot-password' && (
          <ForgotPasswordView
            onRequestOtp={handleRequestPasswordReset}
            onSuccess={(email) => {
              setOtpEmail(email);
              setAuthScreen('reset-password');
            }}
            onNavigate={(screen) => setAuthScreen(screen)}
            isLoading={isAuthLoading}
          />
        )}

        {authScreen === 'reset-password' && (
          <ResetPasswordView
            email={otpEmail}
            onCompleteReset={handleCompletePasswordReset}
            onNavigate={(screen) => setAuthScreen(screen)}
            isLoading={isAuthLoading}
          />
        )}
      </div>
    );
  }

  // ---------------- RENDER MAIN CRM PLATFORM ---------------- //
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col antialiased">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        notificationCount={notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
        onLogout={handleLogout}
        onGoToProfile={() => handleSelectTab('profile')}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          userRole={currentUser.role}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          chatUnreadCount={totalChatUnreadCount}
          ticketMentionCount={ticketMentionCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Top page title and quick summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {getTabTitle(currentTab)}
                </h1>
                {(isLoading || isTabLoading) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Carregando...</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {currentTab === 'overview' &&
                  'Métricas e cadastros sincronizados em tempo real.'}
                {currentTab === 'users' &&
                  'Gerenciamento de contas, atribuição de atendentes, carteiras e novos acessos.'}
                {currentTab === 'clinics' &&
                  (currentUser.role === 'ATENDENTE'
                    ? 'Clínicas médicas sob sua responsabilidade e gestão de atendimento.'
                    : 'Unidades médicas com busca oficial por CNPJ, CRM do responsável e equipe.')}
                {currentTab === 'portfolio' &&
                  'Distribuição, acompanhamento e balanceamento de clínicas médicas entre a equipe de atendimento.'}
                {currentTab === 'agendas' &&
                  'Agendamentos, consultas de pacientes e controle de horários dos clientes.'}
                {currentTab === 'leads' &&
                  'Funil de vendas comercial, qualificação de novos clientes e conversão direta em clínicas.'}
                {currentTab === 'profile' &&
                  'Gerencie sua foto de perfil e visualize suas informações cadastrais.'}
              </p>
            </div>

            {/* Quick action for Admin */}
            {currentUser.role === 'ADMIN' && currentTab === 'clinics' && (
              <button
                onClick={() => {
                  setSelectedClinicForEdit(null);
                  setIsClinicFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
              >
                <Building2 className="w-4 h-4" />
                Cadastrar Clínica
              </button>
            )}

            {currentUser.role === 'ADMIN' && currentTab === 'leads' && (
              <button
                onClick={() => {
                  setSelectedLeadForEdit(null);
                  setIsLeadFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
              >
                <Target className="w-4 h-4" />
                Cadastrar Lead
              </button>
            )}
          </div>

          {/* Submenus de Gestão Bar (exibido em todas as views de gestão) */}
          {isManagementTab && managementSubTabs.length > 0 && (
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs mb-6">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1 border-r border-slate-100">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Submenus de Gestão:</span>
                </div>

                {managementSubTabs.map((subTab) => {
                  const SubIcon = subTab.icon;
                  const isActive = currentTab === subTab.id;

                  return (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => handleSelectTab(subTab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <SubIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{subTab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conditional View by Tab: Loading indicator during screen transition or active data fetch */}
          {isTabLoading ? (
            <ScreenLoading
              title={`Carregando ${getTabTitle(currentTab)}...`}
              subtitle="Sincronizando os dados mais recentes do DunaCRM."
            />
          ) : (
            <>
              {currentTab === 'overview' && currentUser.role === 'ADMIN' && (
                <Overview
                  users={enrichedUsers}
                  currentUserId={currentUser.id}
                  onlineUserIds={onlineUserIds}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onGoToUsers={() => handleSelectTab('users')}
                  onViewUser={(user) => setSelectedUserForDetail(user)}
                />
              )}

              {currentTab === 'users' && currentUser.role === 'ADMIN' && (
                <UserList
                  users={enrichedUsers}
                  currentUserId={currentUser.id}
                  onlineUserIds={onlineUserIds}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onToggleStatus={handleToggleStatus}
                  onViewUser={(user) => setSelectedUserForDetail(user)}
                  onOpenEditModal={(user) => {
                    setSelectedUserForEdit(user);
                    setIsUserEditOpen(true);
                  }}
                  onOpenPortfolioModal={(user) => {
                    setSelectedUserForPortfolio(user);
                    setIsPortfolioModalOpen(true);
                  }}
                />
              )}

              {currentTab === 'clinics' &&
                (currentUser.role === 'ADMIN' || currentUser.role === 'ATENDENTE') && (
                  <ClinicList
                    clinics={
                      currentUser.role === 'ATENDENTE'
                        ? clinics.filter(
                            (c) =>
                              isClinicContractActive(c.status, c.contractStatus, c.contractEndDate) &&
                              (c.assignedAttendantId === currentUser.id ||
                                currentUser.assignedClinicIds?.includes(c.id))
                          )
                        : clinics
                    }
                    isAdmin={currentUser.role === 'ADMIN'}
                    onOpenCreateModal={() => {
                      if (currentUser.role !== 'ADMIN') return;
                      setSelectedClinicForEdit(null);
                      setIsClinicFormModalOpen(true);
                    }}
                    onOpenEditModal={(c) => {
                      if (currentUser.role !== 'ADMIN') return;
                      setSelectedClinicForEdit(c);
                      setIsClinicFormModalOpen(true);
                    }}
                    onViewClinic={(c) => setSelectedClinicForDetail(c)}
                    onToggleStatus={handleToggleClinicStatus}
                  />
                )}

              {currentTab === 'portfolio' && currentUser.role === 'ADMIN' && (
                <PortfolioManager
                  users={enrichedUsers}
                  clinics={clinics}
                  onOpenPortfolioModal={(attendant) => {
                    setSelectedUserForPortfolio(attendant);
                    setIsPortfolioModalOpen(true);
                  }}
                  onGoToUsers={() => handleSelectTab('users')}
                  onGoToSchedule={() => handleSelectTab('agendas')}
                  onRefresh={async () => {
                    setIsTabLoading(true);
                    await loadUsers();
                    await loadClinics();
                    setIsTabLoading(false);
                  }}
                />
              )}

              {currentTab === 'agendas' &&
                (currentUser.role === 'ADMIN' || currentUser.role === 'ATENDENTE') && (
                  <ScheduleManager
                    currentUser={currentUser}
                    appointments={appointments}
                    clinics={clinics}
                    onCreateAppointment={handleCreateAppointment}
                    onUpdateStatus={handleUpdateAppointmentStatus}
                    onDeleteAppointment={handleDeleteAppointment}
                  />
                )}

              {currentTab === 'leads' && currentUser.role === 'ADMIN' && (
                <LeadList
                  leads={leads}
                  onOpenCreateModal={() => {
                    setSelectedLeadForEdit(null);
                    setIsLeadFormModalOpen(true);
                  }}
                  onOpenEditModal={(l) => {
                    setSelectedLeadForEdit(l);
                    setIsLeadFormModalOpen(true);
                  }}
                  onViewLead={(l) => setSelectedLeadForDetail(l)}
                  onDeleteLead={handleDeleteLead}
                  onUpdateStatus={handleUpdateLeadStatus}
                />
              )}

              {currentTab === 'chat' && (
                <ChatView
                  currentUser={currentUser}
                  allUsers={enrichedUsers}
                  onlineUserIds={onlineUserIds}
                  chatUnreadCounts={chatUnreadCounts}
                  onMarkChannelAsRead={handleMarkChannelAsRead}
                />
              )}

              {currentTab === 'support' && (
                <TicketList
                  tickets={tickets}
                  currentUser={currentUser}
                  viewedMentionTicketIds={viewedMentionTicketIds}
                  onOpenCreateModal={() => setIsTicketCreateModalOpen(true)}
                  onViewTicket={handleViewTicket}
                  onMarkAllMentionsAsViewed={handleMarkAllTicketMentionsAsViewed}
                />
              )}

              {currentTab === 'profile' && (
                <MyProfile currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Drawer: Central de Notificações */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
        isAdmin={currentUser.role === 'ADMIN'}
      />

      {/* Modal: Disparar Comunicado pelo Admin */}
      <BroadcastNotificationModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSubmit={handleCreateBroadcastNotification}
        users={enrichedUsers}
        currentUserId={currentUser.id}
      />

      {/* Modal: Criar Chamado de Suporte com SLA */}
      <TicketCreateModal
        isOpen={isTicketCreateModalOpen}
        onClose={() => setIsTicketCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
        users={enrichedUsers}
        currentUserId={currentUser.id}
      />

      {/* Modal: Detalhes do Chamado */}
      <TicketDetailModal
        ticket={selectedTicketForDetail}
        isOpen={!!selectedTicketForDetail}
        onClose={() => setSelectedTicketForDetail(null)}
        onUpdateStatus={handleUpdateTicketStatus}
        users={enrichedUsers}
        currentUserId={currentUser.id}
        onMarkViewed={handleMarkTicketMentionAsViewed}
      />

      {/* Modal: Cadastrar Novo Usuário por Admin */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Cadastrar Novo Usuário (Admin)"
        subtitle="Preencha os dados cadastrais. O perfil USUÁRIO será atribuído automaticamente."
        maxWidth="xl"
      >
        <UserForm
          onSubmit={handleCreateUserByAdmin}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={isAuthLoading}
        />
      </Modal>

      {/* Modal: Editar Usuário por Admin */}
      <UserEditModal
        user={selectedUserForEdit}
        isOpen={isUserEditOpen}
        onClose={() => {
          setIsUserEditOpen(false);
          setSelectedUserForEdit(null);
        }}
        onSave={handleSaveUserEdit}
        onOpenPortfolioModal={(u) => {
          setSelectedUserForEdit(null);
          setIsUserEditOpen(false);
          setSelectedUserForPortfolio(u);
          setIsPortfolioModalOpen(true);
        }}
      />

      {/* Modal: Distribuição da Carteira de Clientes */}
      <PortfolioDistributionModal
        attendant={selectedUserForPortfolio}
        allClinics={clinics}
        allUsers={enrichedUsers}
        isOpen={isPortfolioModalOpen}
        onClose={() => {
          setIsPortfolioModalOpen(false);
          setSelectedUserForPortfolio(null);
        }}
        onSuccess={async () => {
          await loadUsers();
          await loadClinics();
          addToast('success', 'Carteira atualizada!', 'A distribuição de clientes foi salva com sucesso.');
        }}
      />

      {/* Modal: Detalhes do Usuário */}
      <UserDetailModal
        user={selectedUserForDetail}
        currentUserId={currentUser?.id}
        onlineUserIds={onlineUserIds}
        isOpen={!!selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
        onOpenEditModal={(u) => {
          setSelectedUserForDetail(null);
          setSelectedUserForEdit(u);
          setIsUserEditOpen(true);
        }}
        onOpenPortfolioModal={(u) => {
          setSelectedUserForDetail(null);
          setSelectedUserForPortfolio(u);
          setIsPortfolioModalOpen(true);
        }}
      />

      {/* Modal: Formulário de Clínica Médica (CNPJ, CRM, Especialidades, Endereço) */}
      <ClinicFormModal
        isOpen={isClinicFormModalOpen}
        onClose={() => {
          setIsClinicFormModalOpen(false);
          setSelectedClinicForEdit(null);
        }}
        onSubmit={handleCreateOrUpdateClinic}
        initialClinic={selectedClinicForEdit}
        attendants={users.filter((u) => u.role === 'ATENDENTE' || u.role === 'ADMIN')}
        isSubmitting={isSubmittingClinic}
      />

      {/* Modal: Detalhes da Clínica & Gestão de Equipe (Médicos e Secretárias) */}
      <ClinicDetailModal
        clinic={selectedClinicForDetail}
        isOpen={!!selectedClinicForDetail}
        onClose={() => setSelectedClinicForDetail(null)}
        onEditClinic={(c) => {
          setSelectedClinicForDetail(null);
          setSelectedClinicForEdit(c);
          setIsClinicFormModalOpen(true);
        }}
        onToggleClinicStatus={handleToggleClinicStatus}
        onCreateMember={handleCreateClinicMember}
        onUpdateMember={handleUpdateClinicMember}
        onDeleteMember={handleDeleteClinicMember}
        onToggleMemberStatus={handleToggleClinicMemberStatus}
      />

      {/* Modal: Formulário de Lead */}
      <LeadFormModal
        isOpen={isLeadFormModalOpen}
        onClose={() => {
          setIsLeadFormModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSubmit={handleCreateOrUpdateLead}
        initialLead={selectedLeadForEdit}
        isSubmitting={isSubmittingLead}
      />

      {/* Modal: Detalhes do Lead & Conversão */}
      <LeadDetailModal
        lead={selectedLeadForDetail}
        isOpen={!!selectedLeadForDetail}
        onClose={() => setSelectedLeadForDetail(null)}
        onEdit={(l) => {
          setSelectedLeadForDetail(null);
          setSelectedLeadForEdit(l);
          setIsLeadFormModalOpen(true);
        }}
        onDelete={handleDeleteLead}
        onUpdateStatus={handleUpdateLeadStatus}
        onConvertToClinic={handleConvertToClinic}
      />
    </div>
  );
}

export default App;
