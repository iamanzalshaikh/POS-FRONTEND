export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'CASHIER' | 'ACCOUNTANT';

export type Store = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
};

export type AssignedTerminal = {
  id: string;
  deviceName: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  profilePictureUrl?: string;
  displayId?: string;
  storeId?: string;
  store?: Store | null;
  lastLoginAt?: string | null;
  createdAt: string;
  assignedTerminals?: AssignedTerminal[];
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  login: (credentials: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hydrate: () => Promise<void>;
};

export const AUTH_IS_MODULAR = true;
