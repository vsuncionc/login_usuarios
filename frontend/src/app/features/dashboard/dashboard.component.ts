import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';

interface RecentAccess {
  user: string;
  dateTime: string;
  ip: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule
  ],
  template: `
    <!-- ENCABEZADO VISTA -->
    <div class="view-header">
      <h1>
        <mat-icon>home</mat-icon>
        <span>Dashboard</span>
      </h1>
      <p>Bienvenido, {{ currentUserName() }}</p>
    </div>

    <!-- TARJETAS DE MÉTRICAS (KPIs) -->
    <div class="kpi-grid">
      <!-- Total Usuarios -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper blue">
          <mat-icon>people</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Total Usuarios</div>
          <div class="kpi-value">12</div>
        </div>
      </div>

      <!-- Usuarios Activos -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper green">
          <mat-icon>check_circle</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Usuarios Activos</div>
          <div class="kpi-value">11</div>
        </div>
      </div>

      <!-- Roles Definidos -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper orange">
          <mat-icon>security</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Roles Definidos</div>
          <div class="kpi-value">3</div>
        </div>
      </div>

      <!-- Sesiones Activas -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper purple">
          <mat-icon>calendar_today</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Sesiones Activas</div>
          <div class="kpi-value">5</div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN INFERIOR: ACCESOS RECIENTES Y SISTEMA OPERATIVO -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start;">
      
      <!-- Tabla: Accesos Recientes -->
      <div class="white-panel-card" style="margin-bottom: 0;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem 0;">
          Accesos Recientes
        </h3>

        <table mat-table [dataSource]="recentAccesses" style="width: 100%;">
          <!-- Columna Usuario -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569;">Usuario</th>
            <td mat-cell *matCellDef="let element" style="color: #1e293b; font-weight: 500;">{{ element.user }}</td>
          </ng-container>

          <!-- Columna Fecha y Hora -->
          <ng-container matColumnDef="dateTime">
            <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569;">Fecha y Hora</th>
            <td mat-cell *matCellDef="let element" style="color: #64748b;">{{ element.dateTime }}</td>
          </ng-container>

          <!-- Columna IP -->
          <ng-container matColumnDef="ip">
            <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569;">IP</th>
            <td mat-cell *matCellDef="let element" style="color: #64748b; font-family: monospace;">{{ element.ip }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <!-- Tarjeta: Sistema Operativo -->
      <div class="white-panel-card" style="margin-bottom: 0; display: flex; align-items: center; gap: 1.25rem; padding: 1.75rem;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <mat-icon style="color: #16a34a; font-size: 32px; width: 32px; height: 32px;">check_circle</mat-icon>
        </div>
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0;">
            Sistema Operativo
          </h4>
          <p style="font-size: 0.88rem; color: #64748b; margin: 0;">
            Todo funciona correctamente
          </p>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);

  displayedColumns: string[] = ['user', 'dateTime', 'ip'];

  recentAccesses: RecentAccess[] = [
    { user: 'Juan Pérez', dateTime: '13/11/2026 10:45', ip: '192.168.1.10' },
    { user: 'María López', dateTime: '13/11/2026 09:30', ip: '192.168.1.11' },
    { user: 'Carlos Ruiz', dateTime: '12/11/2026 17:20', ip: '192.168.1.12' }
  ];

  currentUserName(): string {
    return this.authService.currentUser()?.fullName || 'Juan Pérez';
  }
}
