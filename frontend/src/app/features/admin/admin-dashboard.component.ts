import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthService } from '../../core/services/auth.service';
import { SystemConfig, UserDetail } from '../../core/models/auth.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatCheckboxModule
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon style="margin-right: 0.5rem;">admin_panel_settings</mat-icon>
      <span>Panel de Administración Empresarial</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/profile">
        <mat-icon>account_circle</mat-icon> Mi Perfil
      </button>
      <button mat-button (click)="authService.logout()">
        <mat-icon>exit_to_app</mat-icon> Salir
      </button>
    </mat-toolbar>

    <div class="admin-container">
      <!-- Tarjeta de Configuración Global -->
      <mat-card class="admin-card" style="margin-bottom: 2rem;">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">settings</mat-icon>
          <mat-card-title>Configuración de Seguridad y Registro</mat-card-title>
          <mat-card-subtitle>Parámetros dinámicos del sistema</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content style="margin-top: 1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0;">
            <div>
              <strong>Permitir Autorregistro Público de Usuarios:</strong>
              <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.85rem;">
                Si está deshabilitado, los nuevos usuarios solo pueden ser dados de alta por un administrador.
              </p>
            </div>
            <mat-slide-toggle 
              [checked]="isPublicRegistrationOpen()" 
              (change)="toggleRegistration($event.checked)"
              color="primary">
              {{ isPublicRegistrationOpen() ? 'HABILITADO' : 'BLOQUEADO' }}
            </mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de Gestión de Usuarios y Operaciones Batch -->
      <mat-card class="admin-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">people</mat-icon>
          <mat-card-title>Gestión de Usuarios y Roles</mat-card-title>
          <mat-card-subtitle>Operaciones individuales y por lotes (Batch)</mat-card-subtitle>
        </mat-card-header>

        <div class="batch-bar" style="margin-top: 1rem; display: flex; gap: 1rem; align-items: center;">
          <button mat-stroked-button color="primary" [disabled]="!selection.hasValue()" (click)="batchUpdateStatus(true)">
            <mat-icon>check_circle</mat-icon> Activar Seleccionados ({{ selection.selected.length }})
          </button>
          <button mat-stroked-button color="warn" [disabled]="!selection.hasValue()" (click)="batchUpdateStatus(false)">
            <mat-icon>block</mat-icon> Desactivar Seleccionados ({{ selection.selected.length }})
          </button>
        </div>

        <mat-card-content style="margin-top: 1rem; overflow-x: auto;">
          <table mat-table [dataSource]="users()" class="mat-elevation-z1 full-table">
            
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox (change)="$event ? masterToggle() : null"
                              [checked]="selection.hasValue() && isAllSelected()"
                              [indeterminate]="selection.hasValue() && !isAllSelected()">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox (click)="$event.stopPropagation()"
                              (change)="$event ? selection.toggle(row) : null"
                              [checked]="selection.isSelected(row)">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Nombre Completo</th>
              <td mat-cell *matCellDef="let user"><strong>{{ user.fullName }}</strong></td>
            </ng-container>

            <!-- Email Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Correo Electrónico</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let user">
                @if (user.enabled) {
                  <span class="status-badge active">Activo</span>
                } @else {
                  <span class="status-badge inactive">Inactivo</span>
                }
                @if (!user.accountNonLocked) {
                  <span class="status-badge locked" style="margin-left: 4px;">Bloqueado</span>
                }
              </td>
            </ng-container>

            <!-- Roles Column -->
            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip-set>
                  @for (role of user.roles; track role) {
                    <mat-chip style="font-size: 0.75rem;">{{ role }}</mat-chip>
                  }
                </mat-chip-set>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button (click)="toggleSingleUserStatus(user)" [title]="user.enabled ? 'Desactivar' : 'Activar'">
                  <mat-icon [color]="user.enabled ? 'warn' : 'primary'">{{ user.enabled ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .spacer { flex: 1 1 auto; }
    .admin-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .admin-card {
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .full-table {
      width: 100%;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      &.active { background-color: #e8f5e9; color: #2e7d32; }
      &.inactive { background-color: #ffebee; color: #c62828; }
      &.locked { background-color: #fff3e0; color: #e65100; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  readonly users = signal<UserDetail[]>([]);
  readonly isPublicRegistrationOpen = signal<boolean>(false);
  readonly selection = new SelectionModel<UserDetail>(true, []);

  displayedColumns: string[] = ['select', 'fullName', 'email', 'status', 'roles', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
    this.loadConfigs();
  }

  loadUsers(): void {
    this.http.get<{ content: UserDetail[] }>('http://localhost:8080/api/v1/admin/users').subscribe({
      next: (res) => this.users.set(res.content),
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  loadConfigs(): void {
    this.http.get<SystemConfig[]>('http://localhost:8080/api/v1/admin/config').subscribe({
      next: (configs) => {
        const regConfig = configs.find(c => c.key === 'ALLOW_PUBLIC_REGISTRATION');
        if (regConfig) {
          this.isPublicRegistrationOpen.set(regConfig.value === 'true');
        }
      }
    });
  }

  toggleRegistration(enabled: boolean): void {
    this.http.put('http://localhost:8080/api/v1/admin/config/ALLOW_PUBLIC_REGISTRATION', {
      value: enabled.toString()
    }).subscribe({
      next: () => {
        this.isPublicRegistrationOpen.set(enabled);
        this.authService.isRegistrationEnabled.set(enabled);
      }
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.users().length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.users().forEach(row => this.selection.select(row));
  }

  batchUpdateStatus(enabled: boolean): void {
    const userIds = this.selection.selected.map(u => u.id);
    this.http.post('http://localhost:8080/api/v1/admin/users/batch-status', {
      userIds,
      enabled
    }).subscribe({
      next: () => {
        this.selection.clear();
        this.loadUsers();
      }
    });
  }

  toggleSingleUserStatus(user: UserDetail): void {
    this.http.patch(`http://localhost:8080/api/v1/admin/users/${user.id}`, {
      enabled: !user.enabled
    }).subscribe({
      next: () => this.loadUsers()
    });
  }
}
