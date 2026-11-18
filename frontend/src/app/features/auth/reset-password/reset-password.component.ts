import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="stadium-bg-container">
      <div class="auth-modal-card">
        <!-- Ícono Candado Azul Grande -->
        <div class="modal-icon-badge">
          <mat-icon>lock</mat-icon>
        </div>

        <h2>Cambiar Contraseña</h2>
        <p>Ingresa tu nueva contraseña.</p>

        @if (successMessage()) {
          <div class="alert-box success" style="margin-bottom: 1.5rem; text-align: left;">
            <mat-icon>check_circle</mat-icon>
            <span>{{ successMessage() }}</span>
          </div>
          <div style="margin-top: 1.5rem;">
            <a routerLink="/auth/login" style="color: #0066ff; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
              Ir al Inicio de Sesión
            </a>
          </div>
        } @else {
          <form [formGroup]="changeForm" (ngSubmit)="onSubmit()">
            <!-- Nueva Contraseña -->
            <mat-form-field appearance="outline" class="full-width" style="text-align: left;">
              <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">lock_outline</mat-icon>
              <mat-label>Nueva Contraseña</mat-label>
              <input matInput [type]="hideNew() ? 'password' : 'text'" formControlName="newPassword">
              <button mat-icon-button matSuffix type="button" (click)="hideNew.set(!hideNew())" style="color: #64748b;">
                <mat-icon>{{ hideNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <!-- Confirmar Contraseña -->
            <mat-form-field appearance="outline" class="full-width" style="margin-bottom: 1.5rem; text-align: left;">
              <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">lock_outline</mat-icon>
              <mat-label>Confirmar Contraseña</mat-label>
              <input matInput [type]="hideConfirm() ? 'password' : 'text'" formControlName="confirmPassword">
              <button mat-icon-button matSuffix type="button" (click)="hideConfirm.set(!hideConfirm())" style="color: #64748b;">
                <mat-icon>{{ hideConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <!-- Botón Actualizar Contraseña -->
            <button mat-flat-button class="btn-primary-blue" style="width: 100%; height: 46px; margin-bottom: 1rem;" type="submit" [disabled]="changeForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="24" style="margin: 0 auto;"></mat-spinner>
              } @else {
                Actualizar Contraseña
              }
            </button>

            <!-- Cancelar -->
            <div>
              <a routerLink="/dashboard" style="color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.92rem;">
                Cancelar
              </a>
            </div>
          </form>
        }
      </div>
    </div>
  `
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly hideNew = signal(true);
  readonly hideConfirm = signal(true);
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);

  changeForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.changeForm.invalid) return;

    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('Contraseña actualizada con éxito.');
      setTimeout(() => this.router.navigate(['/dashboard']), 1800);
    }, 800);
  }
}
