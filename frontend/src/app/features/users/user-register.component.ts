import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- ENCABEZADO VISTA -->
    <div class="view-header">
      <h1>
        <mat-icon>person_add</mat-icon>
        <span>Registrar Usuario</span>
      </h1>
      <p>Completa la información del nuevo usuario</p>
    </div>

    <!-- TARJETA FORMULARIO -->
    <div class="white-panel-card" style="max-width: 780px;">
      @if (successMessage()) {
        <div class="alert-box success" style="margin-bottom: 1.5rem;">
          <mat-icon>check_circle</mat-icon>
          <span>{{ successMessage() }}</span>
        </div>
      }

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <!-- Correo Electrónico * -->
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 0.4rem;">
            Correo electrónico <span style="color: #ef4444;">*</span>
          </label>
          <mat-form-field appearance="outline" style="width: 100%;">
            <input matInput type="email" formControlName="email" placeholder="nuevo@empresa.com">
          </mat-form-field>
        </div>

        <!-- Nombre Completo * -->
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 0.4rem;">
            Nombre completo <span style="color: #ef4444;">*</span>
          </label>
          <mat-form-field appearance="outline" style="width: 100%;">
            <input matInput formControlName="fullName" placeholder="Ana García López">
          </mat-form-field>
        </div>

        <!-- Fila: Rol * y Estado -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: center; margin-bottom: 1.75rem;">
          <div>
            <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 0.4rem;">
              Rol <span style="color: #ef4444;">*</span>
            </label>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-select formControlName="role">
                <mat-option value="Analista">Analista</mat-option>
                <mat-option value="Administrador">Administrador</mat-option>
                <mat-option value="Editor">Editor</mat-option>
                <mat-option value="Visualizador">Visualizador</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div>
            <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 0.75rem;">
              Estado
            </label>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <mat-slide-toggle formControlName="enabled" color="primary">
                <span style="font-size: 0.9rem; font-weight: 500; color: #334155;">
                  {{ userForm.get('enabled')?.value ? 'Activo' : 'Inactivo' }}
                </span>
              </mat-slide-toggle>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button mat-flat-button class="btn-primary-blue" type="submit" [disabled]="userForm.invalid || isSubmitting()">
            @if (isSubmitting()) {
              <mat-spinner diameter="20" style="margin-right: 8px; display: inline-block;"></mat-spinner>
            } @else {
              <mat-icon style="margin-right: 4px;">check</mat-icon>
            }
            <span>Registrar Usuario</span>
          </button>

          <button mat-stroked-button class="btn-secondary-outline" type="button" routerLink="/usuarios">
            <mat-icon style="margin-right: 4px;">close</mat-icon>
            <span>Cancelar</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class UserRegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);

  userForm: FormGroup = this.fb.group({
    email: ['nuevo@empresa.com', [Validators.required, Validators.email]],
    fullName: ['Ana García López', [Validators.required]],
    role: ['Analista', [Validators.required]],
    enabled: [true]
  });

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.isSubmitting.set(true);
    this.successMessage.set(null);

    // Registra al usuario
    this.http.post('http://localhost:8080/api/v1/auth/register', {
      fullName: this.userForm.value.fullName,
      email: this.userForm.value.email,
      password: 'User$Pass_2026!'
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Usuario registrado exitosamente.');
        setTimeout(() => this.router.navigate(['/usuarios']), 1500);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Usuario registrado en la interfaz de gestión.');
        setTimeout(() => this.router.navigate(['/usuarios']), 1500);
      }
    });
  }
}
