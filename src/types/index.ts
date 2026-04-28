export type UserRole = 'buyer' | 'si_partner' | 'manufacturer' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Exclude<UserRole, null>;
  companyId?: string;
  companyName?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: Exclude<UserRole, null>) => Promise<void>;
  logout: () => void;
}
