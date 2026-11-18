import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <!-- ENCABEZADO VISTA -->
    <div class="view-header">
      <h1>
        <mat-icon>person</mat-icon>
        <span>Mi Perfil</span>
      </h1>
      <p>Gestiona tu información y cambia tu contraseña</p>
    </div>

    <!-- GRID DE PERFIL: TARJETA FOTO + TARJETA FORMULARIO -->
    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 1.75rem; align-items: start;">
      
      <!-- TARJETA IZQUIERDA: AVATAR Y DATOS BÁSICOS -->
      <div class="white-panel-card" style="text-align: center; padding: 2.25rem 1.5rem;">
        <div style="width: 100px; height: 100px; border-radius: 50%; background: #0066ff; color: #ffffff; font-size: 2.4rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);">
          JP
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.35rem 0;">
          {{ profileForm.get('fullName')?.value }}
        </h3>
        <p style="font-size: 0.9rem; color: #64748b; margin: 0 0 1.5rem 0;">
          {{ profileForm.get('email')?.value }}
        </p>

        <button mat-stroked-button class="btn-secondary-outline" style="width: 100%; border-radius: 8px;">
          Cambiar Foto
        </button>
      </div>

      <!-- TARJETA DERECHA: FORMULARIO DE DETALLES -->
      <div class="white-panel-card" style="padding: 2rem;">
        @if (updateSuccess()) {
          <div class="alert-box success" style="margin-bottom: 1.25rem;">
            <mat-icon>check_circle</mat-icon>
            <span>Perfil actualizado exitosamente.</span>
          </div>
        }

        <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
          <!-- Nombre Completo -->
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
              Nombre completo
            </label>
            <mat-form-field appearance="outline" style="width: 100%;">
              <input matInput formControlName="fullName">
            </mat-form-field>
          </div>

          <!-- Correo Electrónico -->
          <div style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
              Correo electrónico
            </label>
            <mat-form-field appearance="outline" style="width: 100%;">
              <input matInput type="email" formControlName="email">
            </mat-form-field>
          </div>

          <!-- Rol -->
          <div style="margin-bottom: 2rem;">
            <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
              Rol
            </label>
            <mat-form-field appearance="outline" style="width: 100%;">
              <input matInput formControlName="role" readonly>
            </mat-form-field>
          </div>

          <!-- Fila de Botones: Actualizar Perfil y Cambiar Contraseña -->
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button mat-flat-button class="btn-primary-blue" type="submit">
              <mat-icon style="margin-right: 4px;">check</mat-icon>
              <span>Actualizar Perfil</span>
            </button>

            <button mat-flat-button type="button" routerLink="/auth/reset-password" 
                    style="background: #f3e8ff; color: #7e22ce; border-radius: 8px; font-weight: 600; padding: 0 1.25rem; height: 44px;">
              <mat-icon style="margin-right: 4px;">lock</mat-icon>
              <span>Cambiar Contraseña</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  `
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly updateSuccess = signal(false);

  profileForm: FormGroup = this.fb.group({
    fullName: [this.authService.currentUser()?.fullName || 'Juan Pérez', [Validators.required]],
    email: [this.authService.currentUser()?.email || 'juan@empresa.com', [Validators.required, Validators.email]],
    role: ['Administrador']
  });

  onUpdateProfile(): void {
    if (this.profileForm.invalid) return;
    this.updateSuccess.set(true);
    setTimeout(() => this.updateSuccess.set(false), 3000);
  }
}
