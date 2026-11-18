import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { AuthService } from '../../core/services/auth.service';
import { SystemConfig } from '../../core/models/auth.models';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- ENCABEZADO VISTA -->
    <div class="view-header">
      <h1>
        <mat-icon>settings</mat-icon>
        <span>Configuración del Sistema</span>
      </h1>
      <p>Políticas de seguridad, gestión de sesiones y parámetros globales de FUTBOL S.A.</p>
    </div>

    @if (alertMessage()) {
      <div class="alert-box success" style="margin-bottom: 1.5rem;">
        <mat-icon>check_circle</mat-icon>
        <span>{{ alertMessage() }}</span>
      </div>
    }

    <div style="display: flex; flex-direction: column; gap: 1.75rem; max-width: 900px;">
      
      <!-- CARD 1: POLÍTICAS DE REGISTRO Y ACCESO PÚBLICO -->
      <div class="white-panel-card">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
            <mat-icon style="font-size: 20px; width: 20px; height: 20px;">person_add</mat-icon>
          </div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0;">
              Políticas de Registro y Acceso
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Control de admisión de nuevos colaboradores</p>
          </div>
        </div>

        <!-- Toggle: Autorregistro Público -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid #f1f5f9;">
          <div>
            <strong style="color: #0f172a; font-size: 0.95rem;">Permitir Autorregistro Público de Usuarios</strong>
            <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.85rem;">
              Si está deshabilitado, los usuarios no pueden crearse cuentas desde la pantalla de login (solo mediante alta administrativa).
            </p>
          </div>
          <mat-slide-toggle 
            [checked]="isRegistrationOpen()" 
            (change)="toggleRegistration($event.checked)" 
            color="primary">
            {{ isRegistrationOpen() ? 'HABILITADO' : 'DESHABILITADO' }}
          </mat-slide-toggle>
        </div>

        <!-- Rol por Defecto -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0;">
          <div>
            <strong style="color: #0f172a; font-size: 0.95rem;">Rol Asignado por Defecto al Registrarse</strong>
            <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.85rem;">
              Rol con privilegios mínimos atribuido automáticamente en nuevos registros.
            </p>
          </div>
          <span class="badge-role user" style="font-size: 0.85rem; font-weight: 700;">
            ROLE_USER (Usuario Estándar)
          </span>
        </div>
      </div>

      <!-- CARD 2: POLÍTICAS DE FUERZA BRUTA Y BLOQUEO DE CUENTAS -->
      <div class="white-panel-card">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center;">
            <mat-icon style="font-size: 20px; width: 20px; height: 20px;">lock_clock</mat-icon>
          </div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0;">
              Seguridad Defensiva y Protección contra Fuerza Bruta
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Umbrales de bloqueo de cuentas y limitadores de tasa</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.25rem;">
          <div>
            <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
              Intentos Fallidos Consecutivos Máximos
            </label>
            <mat-form-field appearance="outline" style="width: 100%;">
              <input matInput type="number" [(ngModel)]="maxFailedAttempts" min="3" max="10">
            </mat-form-field>
          </div>

          <div>
            <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
              Duración del Bloqueo Temporal (Minutos)
            </label>
            <mat-form-field appearance="outline" style="width: 100%;">
              <input matInput type="number" [(ngModel)]="lockDurationMinutes" min="5" max="60">
            </mat-form-field>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button mat-flat-button class="btn-primary-blue" (click)="saveSecurityPolicies()" [disabled]="isSavingPolicies()">
            @if (isSavingPolicies()) {
              <mat-spinner diameter="18" style="margin-right: 8px; display: inline-block;"></mat-spinner>
            }
            <span>Guardar Parámetros de Bloqueo</span>
          </button>
        </div>
      </div>

      <!-- CARD 3: CRIPTOGRAFÍA Y SESIONES -->
      <div class="white-panel-card">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #f3e8ff; color: #7e22ce; display: flex; align-items: center; justify-content: center;">
            <mat-icon style="font-size: 20px; width: 20px; height: 20px;">vpn_key</mat-icon>
          </div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0;">
              Criptografía y Sesiones Activas
            </h3>
            <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Configuración de tokens, cookies y algoritmos</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Algoritmo Hash</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">BCrypt (Costo 12)</div>
            <div style="font-size: 0.75rem; color: #16a34a; margin-top: 0.2rem;">4,096 rondas criptográficas</div>
          </div>

          <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Access Token TTL</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">15 Minutos</div>
            <div style="font-size: 0.75rem; color: #0284c7; margin-top: 0.2rem;">HMAC-SHA512 en memoria</div>
          </div>

          <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Refresh Token</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">7 Días</div>
            <div style="font-size: 0.75rem; color: #15803d; margin-top: 0.2rem;">HttpOnly; SameSite=Strict</div>
          </div>

          <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase;">Rotación de Tokens</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #16a34a; margin-top: 0.25rem;">Habilitada</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">Detección anti-robo</div>
          </div>
        </div>
      </div>

      <!-- CARD 4: MOTOR DE BASE DE DATOS Y CONSOLA H2 -->
      <div class="white-panel-card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">dns</mat-icon>
            </div>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0;">
                Base de Datos H2 Database
              </h3>
              <p style="font-size: 0.85rem; color: #64748b; margin: 0;">
                Instancia en memoria: <code>jdbc:h2:mem:seguridad_db</code> (Modo PostgreSQL)
              </p>
            </div>
          </div>

          <a href="http://localhost:8080/h2-console" target="_blank" mat-stroked-button class="btn-secondary-outline">
            <mat-icon style="margin-right: 4px;">open_in_new</mat-icon>
            <span>Abrir Consola Web H2</span>
          </a>
        </div>
      </div>

    </div>
  `
})
export class ConfigComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  private readonly API_URL = 'http://localhost:8080/api/v1/admin/config';

  readonly isRegistrationOpen = signal(true);
  readonly maxFailedAttempts = signal(5);
  readonly lockDurationMinutes = signal(15);
  readonly isSavingPolicies = signal(false);
  readonly alertMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.http.get<SystemConfig[]>(this.API_URL).subscribe({
      next: (configs) => {
        const reg = configs.find(x => x.key === 'ALLOW_PUBLIC_REGISTRATION');
        if (reg) this.isRegistrationOpen.set(reg.value === 'true');

        const max = configs.find(x => x.key === 'MAX_FAILED_LOGIN_ATTEMPTS');
        if (max) this.maxFailedAttempts.set(parseInt(max.value, 10));

        const lock = configs.find(x => x.key === 'ACCOUNT_LOCK_DURATION_MINUTES');
        if (lock) this.lockDurationMinutes.set(parseInt(lock.value, 10));
      },
      error: () => {}
    });
  }

  toggleRegistration(enabled: boolean): void {
    this.http.put(`${this.API_URL}/ALLOW_PUBLIC_REGISTRATION`, {
      value: enabled.toString()
    }).subscribe({
      next: () => {
        this.isRegistrationOpen.set(enabled);
        this.authService.isRegistrationEnabled.set(enabled);
        Swal.fire({
          title: '¡Política Actualizada!',
          text: `El autorregistro público ahora está ${enabled ? 'HABILITADO' : 'DESHABILITADO'}.`,
          icon: 'success',
          confirmButtonColor: '#0066ff',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  saveSecurityPolicies(): void {
    this.isSavingPolicies.set(true);

    const updateMax = this.http.put(`${this.API_URL}/MAX_FAILED_LOGIN_ATTEMPTS`, {
      value: this.maxFailedAttempts().toString()
    });

    const updateLock = this.http.put(`${this.API_URL}/ACCOUNT_LOCK_DURATION_MINUTES`, {
      value: this.lockDurationMinutes().toString()
    });

    updateMax.subscribe({
      next: () => {
        updateLock.subscribe({
          next: () => {
            this.isSavingPolicies.set(false);
            Swal.fire({
              title: '¡Políticas Guardadas!',
              text: 'Las políticas de fuerza bruta y bloqueo han sido actualizadas.',
              icon: 'success',
              confirmButtonColor: '#0066ff',
              confirmButtonText: 'Aceptar'
            });
          },
          error: () => this.isSavingPolicies.set(false)
        });
      },
      error: () => this.isSavingPolicies.set(false)
    });
  }

  private showAlert(msg: string): void {
    this.alertMessage.set(msg);
    setTimeout(() => this.alertMessage.set(null), 3500);
  }
}
