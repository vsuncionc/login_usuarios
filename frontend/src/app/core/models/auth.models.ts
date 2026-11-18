export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: UserSummary;
}

export interface UserDetail {
  id: string;
  email: string;
  fullName: string;
  enabled: boolean;
  accountNonLocked: boolean;
  failedLoginAttempts: number;
  createdAt: string;
  roles: string[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
}

export interface SystemConfig {
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

export interface MessageResponse {
  message: string;
}

export interface RegistrationStatusResponse {
  registrationEnabled: boolean;
}
