import type { User, CreateUserInput, UpdateUserProfileInput } from '../types/user';
import { INITIAL_USERS } from './mockData';

const USERS_STORAGE_KEY = 'crm_platform_users_v1';
const CURRENT_USER_KEY = 'crm_platform_current_user_id_v1';

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_USERS;
  } catch (err) {
    console.error('Error reading stored users:', err);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

export function getCurrentUserId(): string {
  try {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (id) return id;
    // Default to admin user for first experience
    const initialId = INITIAL_USERS[0].id;
    localStorage.setItem(CURRENT_USER_KEY, initialId);
    return initialId;
  } catch {
    return INITIAL_USERS[0].id;
  }
}

export function setCurrentUserId(userId: string): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } catch (err) {
    console.error('Error setting current user:', err);
  }
}

/**
 * Creates a new user with automatic type 'USUARIO' as requested!
 */
export function createUser(input: CreateUserInput): User {
  const users = getStoredUsers();

  const userAvatar = input.avatar.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name.trim())}&background=6366f1&color=ffffff&bold=true`;

  const now = new Date().toISOString();
  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    cpf: input.cpf.trim(),
    email: input.email.trim().toLowerCase(),
    birthDate: input.birthDate,
    avatar: userAvatar,
    role: 'USUARIO', // Automatic assignment per specification!
    status: 'ATIVO',
    createdAt: now,
    updatedAt: now,
    phone: input.phone?.trim() || undefined,
    department: input.department?.trim() || 'Geral',
  };

  const updatedList = [newUser, ...users];
  saveUsers(updatedList);
  return newUser;
}

/**
 * Updates full user details (Admin capability)
 */
export function updateUserByAdmin(id: string, updates: Partial<User>): User | null {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  const updatedUser: User = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  users[index] = updatedUser;
  saveUsers(users);
  return updatedUser;
}

/**
 * Updates user profile under 'USUARIO' restrictions:
 * Allowed: avatar, phone/bio.
 * FORBIDDEN: email, birthDate, cpf (enforced server/business rule).
 */
export function updateUserSelf(id: string, updates: UpdateUserProfileInput): User | null {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  const current = users[index];
  const updatedUser: User = {
    ...current,
    avatar: updates.avatar || current.avatar,
    phone: updates.phone !== undefined ? updates.phone : current.phone,
    name: updates.name ? updates.name.trim() : current.name,
    // email, birthDate, cpf remain strictly untouched!
    updatedAt: new Date().toISOString(),
  };

  users[index] = updatedUser;
  saveUsers(users);
  return updatedUser;
}

/**
 * Resets database back to mock data
 */
export function resetToInitialUsers(): User[] {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(CURRENT_USER_KEY, INITIAL_USERS[0].id);
  return INITIAL_USERS;
}
