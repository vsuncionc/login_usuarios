import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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

        <h2>Recuperar Contraseña</h2>
        <p>Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña.</p>

        @if (infoMessage()) {
          <div class="alert-box success" style="margin-bottom: 1.5rem; text-align: left;">
            <mat-icon>check_circle</mat-icon>
            <span>{{ infoMessage() }}</span>
          </div>
          <div style="margin-top: 1.5rem;">
            <a routerLink="/auth/login" style="color: #0066ff; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
              Volver al Inicio
            </a>
          </div>
        } @else {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
            <!-- Correo Electrónico -->
            <mat-form-field appearance="outline" class="full-width" style="margin-bottom: 1.5rem; text-align: left;">
              <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">mail_outline</mat-icon>
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" formControlName="email" placeholder="nombre@empresa.com">
            </mat-form-field>

            <!-- Botón Enviar Enlace -->
            <button mat-flat-button class="btn-primary-blue" style="width: 100%; height: 46px; margin-bottom: 1.25rem;" type="submit" [disabled]="forgotForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="24" style="margin: 0 auto;"></mat-spinner>
              } @else {
                Enviar Enlace
              }
            </button>

            <!-- Volver al Inicio -->
            <div>
              <a routerLink="/auth/login" style="color: #0066ff; text-decoration: none; font-weight: 500; font-size: 0.92rem;">
                Volver al Inicio
              </a>
            </div>
          </form>
        }
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly infoMessage = signal<string | null>(null);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.isLoading.set(true);
    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.infoMessage.set(res.message);
      },
      error: () => {
        this.isLoading.set(false);
        this.infoMessage.set("Si la dirección de correo electrónico está registrada en nuestro sistema, recibirá un enlace con instrucciones para restablecer su contraseña.");
      }
    });
  }
}
