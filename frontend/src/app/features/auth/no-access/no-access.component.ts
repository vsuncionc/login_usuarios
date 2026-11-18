import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-no-access',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <div class="white-panel-card" style="max-width: 540px; text-align: center; padding: 3rem 2rem; border-top: 4px solid #ef4444; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
          <mat-icon style="font-size: 38px; width: 38px; height: 38px;">lock_person</mat-icon>
        </div>

        <h2 style="font-size: 1.6rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
          Acceso Restringido al Menú
        </h2>

        <p style="font-size: 0.95rem; color: #475569; line-height: 1.6; margin-bottom: 1.5rem;">
          Su cuenta actualmente posee el rol de <strong>Usuario Estándar</strong>. Siguiendo la política de seguridad y control de acceso (RBAC) de <strong>FUTBOL S.A.</strong>, este perfil no tiene asignado acceso a las opciones del menú.
        </p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; border: 1px solid #e2e8f0; margin-bottom: 2rem; text-align: left; font-size: 0.85rem; color: #64748b;">
          <div style="font-weight: 600; color: #334155; margin-bottom: 0.25rem;">Reglas de Acceso al Menú:</div>
          <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.5;">
            <li><strong>Super Administrador:</strong> Dashboard, Mi Perfil, Usuarios, Roles, Reportes, Configuración</li>
            <li><strong>Administrador:</strong> Dashboard, Mi Perfil, Usuarios, Roles, Reportes</li>
            <li><strong>Usuario:</strong> Mi Perfil</li>
            <li><strong>Usuario Estándar:</strong> Ningún acceso</li>
          </ul>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button mat-flat-button class="btn-primary-blue" (click)="authService.logout()">
            <mat-icon style="margin-right: 4px;">logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class NoAccessComponent {
  public authService = inject(AuthService);
}
