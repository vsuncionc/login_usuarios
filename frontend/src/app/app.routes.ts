import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  // Rutas Públicas de Autenticación
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },

  // Panel Principal con Sidebar "FUTBOL S.A." y RBAC estricto
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        canActivate: [() => inject(AuthService).canAccessDashboard() ? true : inject(Router).parseUrl('/perfil')],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'perfil',
        canActivate: [() => inject(AuthService).canAccessProfile() ? true : inject(Router).parseUrl('/sin-acceso')],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'usuarios',
        canActivate: [() => inject(AuthService).canAccessUsers() ? true : inject(Router).parseUrl('/perfil')],
        loadComponent: () => import('./features/users/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'usuarios/nuevo',
        canActivate: [() => inject(AuthService).canAccessUsers() ? true : inject(Router).parseUrl('/perfil')],
        loadComponent: () => import('./features/users/user-register.component').then(m => m.UserRegisterComponent)
      },
      {
        path: 'roles',
        canActivate: [() => inject(AuthService).canAccessRoles() ? true : inject(Router).parseUrl('/perfil')],
        loadComponent: () => import('./features/roles/role-management.component').then(m => m.RoleManagementComponent)
      },
      {
        path: 'reportes',
        canActivate: [() => inject(AuthService).canAccessReports() ? true : inject(Router).parseUrl('/perfil')],
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'configuracion',
        canActivate: [() => inject(AuthService).canAccessConfig() ? true : inject(Router).parseUrl('/dashboard')],
        loadComponent: () => import('./features/config/config.component').then(m => m.ConfigComponent)
      },
      {
        path: 'sin-acceso',
        loadComponent: () => import('./features/auth/no-access/no-access.component').then(m => m.NoAccessComponent)
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
