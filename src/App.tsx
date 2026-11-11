import { useState, useEffect, useCallback } from 'react';
import type { User, CreateUserInput, SignUpInput, UpdateUserProfileInput, AuthScreen } from './types/user';
import type { MedicalClinic, CreateClinicInput, CreateClinicMemberInput } from './types/clinic';
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
import { Header } from './components/layout/Header';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { Overview } from './components/dashboard/Overview';
import { UserList } from './components/users/UserList';
import { UserForm } from './components/users/UserForm';
import { UserDetailModal } from './components/users/UserDetailModal';
import { ClinicList } from './components/clinics/ClinicList';
import { ClinicFormModal } from './components/clinics/ClinicFormModal';
import { ClinicDetailModal } from './components/clinics/ClinicDetailModal';
import { MyProfile } from './components/profile/MyProfile';
import { Modal } from './components/common/Modal';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { VerifyOtpView } from './components/auth/VerifyOtpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { UserPlus, RefreshCw, Building2 } from 'lucide-react';

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [clinics, setClinics] = useState<MedicalClinic[]>([]);
  const [currentUserIdState, setCurrentUserIdState] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [currentTab, setCurrentTab] = useState<NavTab>('users');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // OTP Context for registration & recovery
  const [otpEmail, setOtpEmail] = useState<string>('');

  // User Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);

  // Clinic Modals state
  const [isClinicFormModalOpen, setIsClinicFormModalOpen] = useState(false);
  const [selectedClinicForEdit, setSelectedClinicForEdit] = useState<MedicalClinic | null>(null);
  const [selectedClinicForDetail, setSelectedClinicForDetail] = useState<MedicalClinic | null>(null);
  const [isSubmittingClinic, setIsSubmittingClinic] = useState(false);

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

  useEffect(() => {
    loadUsers();
    loadClinics();
  }, [loadUsers, loadClinics]);

  // Current active user
  const currentUser = users.find((u) => u.id === currentUserIdState);

  // If user is regular 'USUARIO', strictly enforce 'profile' tab!
  useEffect(() => {
    if (currentUser && currentUser.role === 'USUARIO' && currentTab !== 'profile') {
      setCurrentTab('profile');
    }
  }, [currentUser, currentTab]);

  // ---------------- AUTH HANDLERS ---------------- //

  // Login
  const handleLogin = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      const loggedUser = await loginUser(email, pass);
      await loadUsers();
      await loadClinics();
      setCurrentUserIdState(loggedUser.id);
      setIsAuthenticated(true);

      if (loggedUser.role === 'USUARIO') {
        setCurrentTab('profile');
      } else {
        setCurrentTab('users');
      }

      addToast(
        'success',
        `Bem-vindo(a), ${loggedUser.name}!`,
        loggedUser.role === 'ADMIN'
          ? 'Painel Administrativo completo liberado.'
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
    clearCurrentSession();
    setCurrentUserIdState('');
    setIsAuthenticated(false);
    setAuthScreen('login');
    addToast('info', 'Sessão encerrada', 'Você saiu da plataforma com segurança.');
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
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
        onLogout={handleLogout}
        onGoToProfile={() => setCurrentTab('profile')}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* Top page title and quick summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {currentTab === 'overview' && 'Visão Geral do CRM'}
                  {currentTab === 'users' && 'Gestão de Usuários'}
                  {currentTab === 'clinics' && 'Clínicas Médicas'}
                  {currentTab === 'profile' && 'Meus Dados'}
                </h1>
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {currentTab === 'overview' &&
                  'Métricas e cadastros sincronizados em tempo real.'}
                {currentTab === 'users' &&
                  'Gerenciamento de contas, permissões e cadastro de novos acessos.'}
                {currentTab === 'clinics' &&
                  'Unidades médicas com busca oficial por CNPJ, CRM do responsável e equipe de médicos e secretárias.'}
                {currentTab === 'profile' &&
                  'Gerencie sua foto de perfil e visualize suas informações cadastrais.'}
              </p>
            </div>

            {/* Quick action for Admin */}
            {currentUser.role === 'ADMIN' && currentTab === 'users' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Usuário
              </button>
            )}

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
          </div>

          {/* Conditional View by Tab */}
          {currentTab === 'overview' && currentUser.role === 'ADMIN' && (
            <Overview
              users={users}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onGoToUsers={() => setCurrentTab('users')}
              onViewUser={(user) => setSelectedUserForDetail(user)}
            />
          )}

          {currentTab === 'users' && currentUser.role === 'ADMIN' && (
            <UserList
              users={users}
              currentUserId={currentUser.id}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onToggleStatus={handleToggleStatus}
              onViewUser={(user) => setSelectedUserForDetail(user)}
            />
          )}

          {currentTab === 'clinics' && currentUser.role === 'ADMIN' && (
            <ClinicList
              clinics={clinics}
              onOpenCreateModal={() => {
                setSelectedClinicForEdit(null);
                setIsClinicFormModalOpen(true);
              }}
              onOpenEditModal={(c) => {
                setSelectedClinicForEdit(c);
                setIsClinicFormModalOpen(true);
              }}
              onViewClinic={(c) => setSelectedClinicForDetail(c)}
              onToggleStatus={handleToggleClinicStatus}
            />
          )}

          {currentTab === 'profile' && (
            <MyProfile currentUser={currentUser} onUpdateProfile={handleUpdateProfile} />
          )}
        </main>
      </div>

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

      {/* Modal: Detalhes do Usuário */}
      <UserDetailModal
        user={selectedUserForDetail}
        isOpen={!!selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
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
    </div>
  );
}

export default App;
