import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <div class="app-layout">
      <!-- SIDEBAR IZQUIERDO: FUTBOL S.A. -->
      <aside class="app-sidebar">
        <!-- Logo y Nombre -->
        <div class="sidebar-brand">
          <div class="shield-badge">
            <mat-icon>sports_soccer</mat-icon>
          </div>
          <h2 class="brand-title">FUTBOL S.A.</h2>
        </div>

        <!-- Menú de Navegación Vertical Condicionado por Rol -->
        <nav class="sidebar-nav">
          <!-- 1. Dashboard: Super Administrador y Administrador -->
          @if (authService.canAccessDashboard()) {
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <mat-icon>home</mat-icon>
              <span>Dashboard</span>
            </a>
          }

          <!-- 2. Mi Perfil: Super Administrador, Administrador y Usuario -->
          @if (authService.canAccessProfile()) {
            <a routerLink="/perfil" routerLinkActive="active" class="nav-item">
              <mat-icon>person</mat-icon>
              <span>Mi Perfil</span>
            </a>
          }

          <!-- 3. Seguridad: Módulo desplegable con Submenú -->
          @if (authService.canAccessSecurityMenu()) {
            <div class="nav-group">
              <!-- Botón / Disparador Acordeón Seguridad -->
              <button type="button" class="nav-item nav-group-trigger" 
                      [class.child-active]="isSecurityRouteActive()" 
                      (click)="toggleSecurityMenu()">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                  <mat-icon>shield</mat-icon>
                  <span>Seguridad</span>
                </div>
                <mat-icon class="chevron-icon" [class.rotated]="isSecurityMenuOpen()">
                  expand_more
                </mat-icon>
              </button>

              <!-- Submenú con las opciones de Seguridad -->
              @if (isSecurityMenuOpen()) {
                <div class="submenu-container">
                  <!-- A. Usuarios: Super Administrador y Administrador -->
                  @if (authService.canAccessUsers()) {
                    <a routerLink="/usuarios" routerLinkActive="active" class="subnav-item">
                      <mat-icon>people</mat-icon>
                      <span>Usuarios</span>
                    </a>
                  }

                  <!-- B. Roles y Permisos: Super Administrador y Administrador -->
                  @if (authService.canAccessRoles()) {
                    <a routerLink="/roles" routerLinkActive="active" class="subnav-item">
                      <mat-icon>security</mat-icon>
                      <span>Roles y Permisos</span>
                    </a>
                  }

                  <!-- C. Reportes: Super Administrador y Administrador -->
                  @if (authService.canAccessReports()) {
                    <a routerLink="/reportes" routerLinkActive="active" class="subnav-item">
                      <mat-icon>bar_chart</mat-icon>
                      <span>Reportes</span>
                    </a>
                  }

                  <!-- D. Configuración: EXCLUSIVO Super Administrador -->
                  @if (authService.canAccessConfig()) {
                    <a routerLink="/configuracion" routerLinkActive="active" class="subnav-item">
                      <mat-icon>settings</mat-icon>
                      <span>Configuración</span>
                    </a>
                  }
                </div>
              }
            </div>
          }

          <!-- Usuario Estándar: Ningún acceso a opciones del menú -->
          @if (authService.hasNoMenuAccess()) {
            <div style="padding: 1.5rem 1rem; color: #94a3b8; font-size: 0.85rem; text-align: center; border: 1px dashed rgba(255,255,255,0.18); border-radius: 8px; margin: 1rem 0.75rem; background: rgba(0,0,0,0.15);">
              <mat-icon style="font-size: 28px; width: 28px; height: 28px; margin-bottom: 0.5rem; opacity: 0.7; color: #f87171;">block</mat-icon>
              <div style="font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem;">Sin Módulos</div>
              <div style="font-size: 0.75rem; line-height: 1.35; color: #cbd5e1;">El perfil <strong>Usuario Estándar</strong> no tiene acceso a las opciones del menú.</div>
            </div>
          }
        </nav>

        <!-- Botón Inferior Cerrar Sesión -->
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="onLogout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- ÁREA PRINCIPAL -->
      <div class="app-main-content">
        <!-- TOPBAR SUPERIOR -->
        <header class="app-topbar">
          <div class="topbar-left">
            <button mat-icon-button type="button" style="color: #64748b;">
              <mat-icon>menu</mat-icon>
            </button>
          </div>

          <div class="topbar-right" style="display: flex; align-items: center; gap: 1rem;">
            <!-- Selector de Rol para Validación de Accesos RUP -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Rol:</span>
              <button mat-stroked-button [matMenuTriggerFor]="roleMenu" style="border-radius: 20px; height: 32px; font-size: 0.8rem; font-weight: 600; padding: 0 12px; color: #0284c7; border-color: #bae6fd; background: #f0f9ff;">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px; margin-right: 4px;">shield</mat-icon>
                <span>{{ activeRoleLabel() }}</span>
                <mat-icon style="font-size: 16px; width: 16px; height: 16px; margin-left: 2px;">arrow_drop_down</mat-icon>
              </button>

              <mat-menu #roleMenu="matMenu">
                <button mat-menu-item (click)="authService.switchActiveRoleForDemo('SUPER_ADMIN')">
                  <mat-icon style="color: #0284c7;">admin_panel_settings</mat-icon>
                  <span>Super Administrador (6 opciones)</span>
                </button>
                <button mat-menu-item (click)="authService.switchActiveRoleForDemo('ADMIN')">
                  <mat-icon style="color: #0369a1;">manage_accounts</mat-icon>
                  <span>Administrador (5 opciones)</span>
                </button>
                <button mat-menu-item (click)="authService.switchActiveRoleForDemo('USER')">
                  <mat-icon style="color: #16a34a;">person</mat-icon>
                  <span>Usuario (Mi Perfil)</span>
                </button>
                <button mat-menu-item (click)="authService.switchActiveRoleForDemo('STANDARD')">
                  <mat-icon style="color: #ef4444;">block</mat-icon>
                  <span>Usuario Estándar (Ningún acceso)</span>
                </button>
              </mat-menu>
            </div>

            <!-- Perfil del Usuario -->
            <div class="user-pill" [matMenuTriggerFor]="userMenu">
              <div class="avatar-circle">
                {{ userInitials() }}
              </div>
              <span class="user-name">{{ userName() }}</span>
              <mat-icon style="font-size: 18px; width: 18px; height: 18px; color: #64748b;">keyboard_arrow_down</mat-icon>
            </div>

            <mat-menu #userMenu="matMenu">
              @if (authService.canAccessProfile()) {
                <button mat-menu-item routerLink="/perfil">
                  <mat-icon>account_circle</mat-icon>
                  <span>Mi Perfil</span>
                </button>
              }
              <button mat-menu-item (click)="onLogout()">
                <mat-icon color="warn">exit_to_app</mat-icon>
                <span>Cerrar Sesión</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- CONTENIDO DE LAS VISTAS -->
        <main class="app-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  readonly isSecurityMenuOpen = signal<boolean>(true);

  toggleSecurityMenu(): void {
    this.isSecurityMenuOpen.update(v => !v);
  }

  isSecurityRouteActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/usuarios') || 
           url.startsWith('/roles') || 
           url.startsWith('/reportes') || 
           url.startsWith('/configuracion');
  }

  activeRoleLabel(): string {
    if (this.authService.isSuperAdmin()) return 'Super Administrador';
    if (this.authService.userRoles().includes('ROLE_ADMIN')) return 'Administrador';
    if (this.authService.isUser()) return 'Usuario';
    if (this.authService.isStandardUser() || this.authService.hasNoMenuAccess()) return 'Usuario Estándar';
    return 'Usuario';
  }

  userName(): string {
    return this.authService.currentUser()?.fullName || 'Juan Pérez';
  }

  userInitials(): string {
    const name = this.userName().trim();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
