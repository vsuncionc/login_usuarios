import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, throwError, map } from 'rxjs';
import { LoginResponse, MessageResponse, RegistrationStatusResponse, UserSummary } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:8080/api/v1/auth';

  // Señales reactivas de estado
  readonly currentUser = signal<UserSummary | null>(this.getStoredUser());
  readonly accessToken = signal<string | null>(this.getStoredToken());
  readonly isRegistrationEnabled = signal<boolean>(true);

  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly userRoles = computed(() => this.currentUser()?.roles ?? ['ROLE_SUPER_ADMIN']);
  readonly userPermissions = computed(() => this.currentUser()?.permissions ?? []);

  // Roles canónicos del sistema
  readonly isSuperAdmin = computed(() => this.userRoles().includes('ROLE_SUPER_ADMIN'));
  readonly isAdmin = computed(() => this.userRoles().includes('ROLE_ADMIN') && !this.isSuperAdmin());
  readonly isUser = computed(() => (this.userRoles().includes('ROLE_USER') || this.userRoles().includes('ROLE_EDITOR') || this.userRoles().includes('ROLE_VISUALIZADOR') || this.userRoles().includes('ROLE_ANALISTA')) && !this.userRoles().includes('ROLE_ADMIN') && !this.isSuperAdmin());
  readonly isStandardUser = computed(() => this.userRoles().includes('ROLE_STANDARD'));

  // =========================================================================
  // MATRIZ DE ACCESO A OPCIONES DEL MENÚ SEGÚN ESPECIFICACIÓN:
  // - Super Administrador : Dashboard, Mi Perfil, Usuarios, Roles y Permisos, Reportes, Configuración
  // - Administrador: Dashboard, Mi Perfil, Usuarios, Roles y Permisos, Reportes
  // - Usuario: Mi Perfil
  // - Usuario Estándar: Ningún acceso
  // =========================================================================
  readonly canAccessDashboard = computed(() => this.isSuperAdmin() || this.userRoles().includes('ROLE_ADMIN'));
  readonly canAccessProfile = computed(() => this.isSuperAdmin() || this.userRoles().includes('ROLE_ADMIN') || this.isUser());
  readonly canAccessUsers = computed(() => this.isSuperAdmin() || this.userRoles().includes('ROLE_ADMIN'));
  readonly canAccessRoles = computed(() => this.isSuperAdmin() || this.userRoles().includes('ROLE_ADMIN'));
  readonly canAccessReports = computed(() => this.isSuperAdmin() || this.userRoles().includes('ROLE_ADMIN'));
  readonly canAccessConfig = computed(() => this.isSuperAdmin());
  readonly canAccessSecurityMenu = computed(() => 
    this.canAccessUsers() || this.canAccessRoles() || this.canAccessReports() || this.canAccessConfig()
  );

  readonly hasNoMenuAccess = computed(() => 
    !this.canAccessDashboard() && 
    !this.canAccessProfile() && 
    !this.canAccessUsers() && 
    !this.canAccessRoles() && 
    !this.canAccessReports() && 
    !this.canAccessConfig()
  );

  constructor() {
    this.checkRegistrationStatus();
  }

  private getStoredUser(): UserSummary | null {
    try {
      const data = localStorage.getItem('futbol_user');
      return data ? JSON.parse(data) : {
        id: 'default-admin-id',
        email: 'admin@empresa.com',
        fullName: 'Super Administrador',
        roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'],
        permissions: ['USER_READ', 'USER_WRITE', 'USER_DELETE', 'ROLE_MANAGE', 'CONFIG_MANAGE', 'AUDIT_VIEW']
      };
    } catch {
      return null;
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('futbol_token') || 'demo-token';
    } catch {
      return null;
    }
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials, { withCredentials: true }).pipe(
      tap((res) => {
        this.accessToken.set(res.accessToken);
        this.currentUser.set(res.user);
        try {
          localStorage.setItem('futbol_token', res.accessToken);
          localStorage.setItem('futbol_user', JSON.stringify(res.user));
        } catch {}
      })
    );
  }

  // Switch de rol interactivo para demostración y verificación inmediata
  switchActiveRoleForDemo(role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'STANDARD'): void {
    let roles: string[] = [];
    let name = 'Super Administrador';
    let email = 'admin@empresa.com';

    switch (role) {
      case 'SUPER_ADMIN':
        roles = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'];
        name = 'Super Administrador';
        email = 'admin@empresa.com';
        break;
      case 'ADMIN':
        roles = ['ROLE_ADMIN'];
        name = 'Juan Pérez (Administrador)';
        email = 'juan@empresa.com';
        break;
      case 'USER':
        roles = ['ROLE_USER'];
        name = 'Carlos Ruiz (Usuario)';
        email = 'usuario@empresa.com';
        break;
      case 'STANDARD':
        roles = ['ROLE_STANDARD'];
        name = 'Usuario Estándar';
        email = 'estandar@empresa.com';
        break;
    }

    const updatedUser: UserSummary = {
      id: 'demo-' + role.toLowerCase(),
      email,
      fullName: name,
      roles,
      permissions: role === 'SUPER_ADMIN' ? ['USER_READ', 'USER_WRITE', 'ROLE_MANAGE', 'CONFIG_MANAGE', 'AUDIT_VIEW'] : []
    };

    this.currentUser.set(updatedUser);
    try {
      localStorage.setItem('futbol_user', JSON.stringify(updatedUser));
    } catch {}

    // Redirección adaptativa según permisos
    if (this.canAccessDashboard()) {
      this.router.navigate(['/dashboard']);
    } else if (this.canAccessProfile()) {
      this.router.navigate(['/perfil']);
    } else {
      this.router.navigate(['/sin-acceso']);
    }
  }

  register(data: { fullName: string; email: string; password: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/register`, data);
  }

  refreshToken(): Observable<string> {
    return this.http.post<LoginResponse>(`${this.API_URL}/refresh-token`, {}, { withCredentials: true }).pipe(
      map((res) => {
        this.accessToken.set(res.accessToken);
        this.currentUser.set(res.user);
        return res.accessToken;
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(data: { token: string; newPassword: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/reset-password`, data);
  }

  logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearSessionAndRedirect(),
      error: () => this.clearSessionAndRedirect()
    });
  }

  private clearSessionAndRedirect(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    try {
      localStorage.removeItem('futbol_token');
      localStorage.removeItem('futbol_user');
    } catch {}
    this.router.navigate(['/auth/login']);
  }

  checkRegistrationStatus(): void {
    this.http.get<RegistrationStatusResponse>(`${this.API_URL}/registration-status`).subscribe({
      next: (res) => this.isRegistrationEnabled.set(res.registrationEnabled),
      error: () => this.isRegistrationEnabled.set(false)
    });
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasPermission(permission: string): boolean {
    const perms = this.userPermissions();
    return perms.includes(permission) || this.hasRole('ROLE_SUPER_ADMIN');
  }
}
