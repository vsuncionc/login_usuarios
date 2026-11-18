import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';

export interface AuditLogItem {
  id: number;
  action: string;
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  createdAt: string;
}

export interface AuditMetrics {
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  blockedLogins: number;
  adminActions: number;
  passwordResets: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <!-- ENCABEZADO DE LA VISTA -->
    <div class="view-header">
      <div class="header-title-row">
        <div>
          <h1>
            <mat-icon>bar_chart</mat-icon>
            <span>Reportes y Auditoría Forense</span>
          </h1>
          <p>Trazabilidad de seguridad, accesos y eventos administrativos en FUTBOL S.A.</p>
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <button mat-stroked-button class="btn-secondary-outline" type="button" (click)="loadReports()" [disabled]="isLoading()">
            <mat-icon [class.spin-animation]="isLoading()" style="margin-right: 4px;">refresh</mat-icon>
            <span>Actualizar</span>
          </button>

          <button mat-flat-button class="btn-primary-blue" type="button" (click)="exportToCsv()">
            <mat-icon style="margin-right: 4px;">download</mat-icon>
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 1. KPI CARDS: MÉTRICAS EJECUTIVAS PARA EL ADMINISTRADOR -->
    <div class="kpi-grid">
      <!-- Total Eventos -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper blue">
          <mat-icon>history</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Total de Eventos</div>
          <div class="kpi-value">{{ metrics()?.totalEvents ?? 0 }}</div>
        </div>
      </div>

      <!-- Inicios de Sesión Exitosos -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper green">
          <mat-icon>verified_user</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Logins Exitosos</div>
          <div class="kpi-value">{{ metrics()?.successfulLogins ?? 0 }}</div>
        </div>
      </div>

      <!-- Intentos Fallidos / Bloqueos -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper orange">
          <mat-icon>gpp_bad</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Fallidos / Bloqueados</div>
          <div class="kpi-value">{{ (metrics()?.failedLogins ?? 0) + (metrics()?.blockedLogins ?? 0) }}</div>
        </div>
      </div>

      <!-- Acciones Administrativas -->
      <div class="kpi-card">
        <div class="kpi-icon-wrapper purple">
          <mat-icon>admin_panel_settings</mat-icon>
        </div>
        <div class="kpi-data">
          <div class="kpi-label">Acciones Admin</div>
          <div class="kpi-value">{{ (metrics()?.adminActions ?? 0) + (metrics()?.passwordResets ?? 0) }}</div>
        </div>
      </div>
    </div>

    <!-- 2. PANEL PRINCIPAL DE REGISTROS DE AUDITORÍA -->
    <div class="white-panel-card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <!-- BARRA DE FILTROS Y BÚSQUEDA -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <!-- Filtro por Tipo de Evento -->
          <div style="min-width: 220px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.25rem;">
              Tipo de Evento:
            </label>
            <mat-form-field appearance="outline" style="width: 100%; margin-bottom: -1.25em;">
              <mat-select [(ngModel)]="selectedAction" (selectionChange)="onFilterChange()">
                <mat-option value="ALL">Todos los Eventos</mat-option>
                <mat-option value="LOGIN_SUCCESS">Inicio de Sesión Exitoso</mat-option>
                <mat-option value="LOGIN_FAILED">Intento Fallido</mat-option>
                <mat-option value="LOGIN_BLOCKED">Cuenta Bloqueada</mat-option>
                <mat-option value="ADMIN_USER_CREATED">Alta de Usuario</mat-option>
                <mat-option value="ADMIN_USER_DELETED">Eliminación de Usuario</mat-option>
                <mat-option value="ADMIN_PASSWORD_RESET">Reseteo de Clave</mat-option>
                <mat-option value="CONFIG_UPDATED">Modificación de Configuración</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Búsqueda Rápida por Usuario, IP o Detalle -->
          <div style="min-width: 260px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.25rem;">
              Búsqueda Rápida:
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <mat-icon style="position: absolute; left: 12px; color: #94a3b8; font-size: 20px;">search</mat-icon>
              <input 
                type="text" 
                placeholder="Buscar por correo, IP o detalle..." 
                [(ngModel)]="searchQuery" 
                (input)="onSearchInput()"
                style="padding: 10px 16px 10px 38px; border-radius: 8px; border: 1.5px solid #cbd5e1; outline: none; font-size: 0.9rem; width: 100%; box-sizing: border-box;"
              >
            </div>
          </div>
        </div>

        <!-- Indicador de total filtrado -->
        <div style="font-size: 0.88rem; color: #64748b; font-weight: 500;">
          Mostrando <strong>{{ filteredLogs().length }}</strong> eventos registrados
        </div>
      </div>

      <!-- TABLA DE EVENTOS DE AUDITORÍA -->
      @if (isLoading()) {
        <div style="display: flex; justify-content: center; align-items: center; padding: 4rem 0;">
          <mat-spinner diameter="42"></mat-spinner>
        </div>
      } @else if (filteredLogs().length === 0) {
        <div style="text-align: center; padding: 3rem 1rem; color: #64748b;">
          <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 0.75rem;">manage_search</mat-icon>
          <div style="font-size: 1.1rem; font-weight: 600; color: #334155;">No se encontraron eventos</div>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.88rem;">Intenta ajustando el filtro de evento o el texto de búsqueda.</p>
        </div>
      } @else {
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
          <table mat-table [dataSource]="filteredLogs()" class="mat-mdc-table" style="width: 100%;">
            
            <!-- Columna Fecha y Hora -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef style="font-weight: 700; color: #475569; padding-left: 1.25rem; width: 170px;">
                Fecha / Hora
              </th>
              <td mat-cell *matCellDef="let row" style="padding-left: 1.25rem; font-size: 0.85rem; color: #334155; font-family: monospace;">
                {{ formatDate(row.createdAt) }}
              </td>
            </ng-container>

            <!-- Columna Acción / Evento -->
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef style="font-weight: 700; color: #475569; width: 190px;">
                Evento de Seguridad
              </th>
              <td mat-cell *matCellDef="let row">
                <span [class]="getActionBadgeClass(row.action)">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; margin-right: 4px;">
                    {{ getActionIcon(row.action) }}
                  </mat-icon>
                  <span>{{ formatActionLabel(row.action) }}</span>
                </span>
              </td>
            </ng-container>

            <!-- Columna Usuario Involucrado -->
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef style="font-weight: 700; color: #475569; width: 220px;">
                Usuario / Cuenta
              </th>
              <td mat-cell *matCellDef="let row">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <div [style.background-color]="getUserAvatarColor(row.userName)" style="width: 32px; height: 32px; border-radius: 50%; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.78rem;">
                    {{ getUserInitials(row.userName) }}
                  </div>
                  <div>
                    <div style="font-weight: 600; color: #0f172a; font-size: 0.86rem;">{{ row.userName }}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">{{ row.userEmail }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Columna Dirección IP -->
            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef style="font-weight: 700; color: #475569; width: 140px;">
                Origen (IP)
              </th>
              <td mat-cell *matCellDef="let row">
                <code style="background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-size: 0.82rem; color: #0066ff; font-weight: 600;">
                  {{ row.ipAddress || '127.0.0.1' }}
                </code>
              </td>
            </ng-container>

            <!-- Columna Detalle -->
            <ng-container matColumnDef="details">
              <th mat-header-cell *matHeaderCellDef style="font-weight: 700; color: #475569;">
                Detalle Técnico
              </th>
              <td mat-cell *matCellDef="let row" style="font-size: 0.85rem; color: #475569;">
                <div style="max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" [matTooltip]="row.details">
                  {{ row.details }}
                </div>
              </td>
            </ng-container>

            <!-- Columna Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="font-weight: 700; color: #475569; text-align: center; width: 80px;">
                Ver
              </th>
              <td mat-cell *matCellDef="let row" style="text-align: center;">
                <button mat-icon-button (click)="viewEventDetail(row)" matTooltip="Ver detalle completo" style="color: #0066ff;">
                  <mat-icon style="font-size: 20px;">info</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .spin-animation {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  readonly API_URL = 'http://localhost:8080/api/v1/admin/reports';

  readonly isLoading = signal(false);
  readonly allLogs = signal<AuditLogItem[]>([]);
  readonly filteredLogs = signal<AuditLogItem[]>([]);
  readonly metrics = signal<AuditMetrics | null>(null);

  selectedAction: string = 'ALL';
  searchQuery: string = '';

  displayedColumns: string[] = ['createdAt', 'action', 'user', 'ipAddress', 'details', 'actions'];

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading.set(true);

    // 1. Cargar Logs de Auditoría
    this.http.get<any>(`${this.API_URL}/audit-logs?size=50`).subscribe({
      next: (res) => {
        const items = res.content || [];
        this.allLogs.set(items);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback local con datos en memoria si hay indisponibilidad
        this.loadFallbackLogs();
        this.isLoading.set(false);
      }
    });

    // 2. Cargar Métricas
    this.http.get<AuditMetrics>(`${this.API_URL}/metrics`).subscribe({
      next: (m) => this.metrics.set(m),
      error: () => {
        this.metrics.set({
          totalEvents: 12,
          successfulLogins: 8,
          failedLogins: 2,
          blockedLogins: 1,
          adminActions: 3,
          passwordResets: 1
        });
      }
    });
  }

  private loadFallbackLogs(): void {
    const fallback: AuditLogItem[] = [
      {
        id: 1,
        action: 'LOGIN_SUCCESS',
        userName: 'Super Administrador',
        userEmail: 'admin@empresa.com',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0',
        details: 'Inicio de sesión corporativo exitoso con token Bearer',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 2,
        action: 'ADMIN_USER_CREATED',
        userName: 'Juan Pérez (Admin)',
        userEmail: 'juan@empresa.com',
        ipAddress: '192.168.1.15',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: 'Alta administrativa de usuario \'Ana García López\' con rol ROLE_ANALISTA',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 3,
        action: 'ADMIN_PASSWORD_RESET',
        userName: 'Juan Pérez (Admin)',
        userEmail: 'juan@empresa.com',
        ipAddress: '192.168.1.15',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        details: 'Restablecimiento directo de contraseña para usuario \'maria@empresa.com\'',
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
      },
      {
        id: 4,
        action: 'LOGIN_BLOCKED',
        userName: 'ANONYMOUS',
        userEmail: 'desconocido@empresa.com',
        ipAddress: '198.51.100.89',
        userAgent: 'Python-urllib/3.10',
        details: 'Bloqueo preventivo por fuerza bruta: 5 intentos fallidos consecutivos',
        createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString()
      }
    ];

    this.allLogs.set(fallback);
    this.applyFilter();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  onSearchInput(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    let result = [...this.allLogs()];

    if (this.selectedAction && this.selectedAction !== 'ALL') {
      result = result.filter(item => item.action === this.selectedAction);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
        (item.userName && item.userName.toLowerCase().includes(q)) ||
        (item.ipAddress && item.ipAddress.toLowerCase().includes(q)) ||
        (item.details && item.details.toLowerCase().includes(q))
      );
    }

    this.filteredLogs.set(result);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatActionLabel(action: string): string {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'Login Exitoso';
      case 'LOGIN_FAILED': return 'Intento Fallido';
      case 'LOGIN_BLOCKED': return 'Bloqueado';
      case 'ADMIN_USER_CREATED': return 'Usuario Creado';
      case 'ADMIN_USER_DELETED': return 'Usuario Eliminado';
      case 'ADMIN_PASSWORD_RESET': return 'Clave Reseteada';
      case 'CONFIG_UPDATED': return 'Configuración';
      default: return action;
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'check_circle';
      case 'LOGIN_FAILED': return 'warning';
      case 'LOGIN_BLOCKED': return 'shield';
      case 'ADMIN_USER_CREATED': return 'person_add';
      case 'ADMIN_USER_DELETED': return 'person_remove';
      case 'ADMIN_PASSWORD_RESET': return 'vpn_key';
      case 'CONFIG_UPDATED': return 'settings';
      default: return 'info';
    }
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'badge-status active';
      case 'LOGIN_FAILED': return 'badge-status inactive';
      case 'LOGIN_BLOCKED': return 'badge-role analyst';
      case 'ADMIN_USER_CREATED': return 'badge-role admin';
      case 'ADMIN_USER_DELETED': return 'badge-status inactive';
      case 'ADMIN_PASSWORD_RESET': return 'badge-role visualizer';
      case 'CONFIG_UPDATED': return 'badge-role editor';
      default: return 'badge-role user';
    }
  }

  getUserInitials(name: string): string {
    if (!name || name === 'ANONYMOUS' || name.includes('Sistema')) return 'SYS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  getUserAvatarColor(name: string): string {
    if (!name || name.includes('SYS') || name === 'ANONYMOUS') return '#64748b';
    const colors = ['#0066ff', '#0284c7', '#16a34a', '#7c3aed', '#ea580c', '#0891b2'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  viewEventDetail(row: AuditLogItem): void {
    Swal.fire({
      title: 'Detalle de Auditoría Forense',
      html: `
        <div style="text-align: left; font-size: 0.9rem; line-height: 1.6; color: #1e293b;">
          <div style="margin-bottom: 8px;"><strong>ID Evento:</strong> #${row.id}</div>
          <div style="margin-bottom: 8px;"><strong>Fecha y Hora:</strong> ${this.formatDate(row.createdAt)}</div>
          <div style="margin-bottom: 8px;"><strong>Acción:</strong> <code style="background:#f1f5f9;color:#0066ff;padding:2px 6px;border-radius:4px;">${row.action}</code></div>
          <div style="margin-bottom: 8px;"><strong>Usuario:</strong> ${row.userName} &lt;${row.userEmail}&gt;</div>
          <div style="margin-bottom: 8px;"><strong>Dirección IP:</strong> <code style="background:#f8fafc;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;">${row.ipAddress || '127.0.0.1'}</code></div>
          <div style="margin-bottom: 8px;"><strong>Agente de Usuario:</strong><br><span style="font-size:0.8rem;color:#64748b;word-break:break-all;">${row.userAgent || 'No especificado'}</span></div>
          <div style="margin-top: 12px; padding: 10px; background: #f8fafc; border-left: 4px solid #0066ff; border-radius: 4px;">
            <strong>Descripción del Suceso:</strong><br>${row.details}
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#0066ff',
      confirmButtonText: 'Entendido'
    });
  }

  exportToCsv(): void {
    const data = this.filteredLogs();
    if (data.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay eventos disponibles para exportar con el filtro actual.',
        icon: 'warning',
        confirmButtonColor: '#0066ff'
      });
      return;
    }

    const headers = ['ID', 'FechaHora', 'Evento', 'UsuarioNombre', 'UsuarioCorreo', 'IP', 'Detalle'];
    const rows = data.map(item => [
      item.id,
      `"${this.formatDate(item.createdAt)}"`,
      `"${item.action}"`,
      `"${item.userName}"`,
      `"${item.userEmail}"`,
      `"${item.ipAddress}"`,
      `"${item.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_auditoria_futbol_sa_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      title: '¡Reporte Exportado!',
      text: `Se descargó el reporte con ${data.length} registros en formato CSV.`,
      icon: 'success',
      confirmButtonColor: '#0066ff',
      timer: 2500
    });
  }
}
