import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-page-container">
      <mat-card class="auth-card">
        <div class="auth-header">
          <mat-icon class="auth-icon">person_add</mat-icon>
          <h1>Crear Cuenta</h1>
          <p>Registro de Usuario Empresarial</p>
        </div>

        @if (!authService.isRegistrationEnabled()) {
          <div class="alert-box error">
            <mat-icon>block</mat-icon>
            <span>El registro público de usuarios se encuentra deshabilitado por el administrador.</span>
          </div>
          <div class="auth-links" style="justify-content: center;">
            <a routerLink="/auth/login">Volver al Inicio de Sesión</a>
          </div>
        } @else {
          @if (errorMessage()) {
            <div class="alert-box error">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }
          @if (successMessage()) {
            <div class="alert-box success">
              <mat-icon>check_circle</mat-icon>
              <span>{{ successMessage() }}</span>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre Completo</mat-label>
              <input matInput formControlName="fullName" placeholder="Juan Pérez">
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo Electrónico</mat-label>
              <input matInput type="email" formControlName="email" placeholder="usuario@empresa.com">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" (input)="updateStrength()">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                <span>Fortaleza de clave:</span>
                <span [style.color]="strengthColor()">{{ strengthLabel() }}</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="passwordStrength()" [color]="strengthColorName()"></mat-progress-bar>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Contraseña</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="confirmPassword">
              <mat-icon matPrefix>lock_outline</mat-icon>
            </mat-form-field>

            <button mat-flat-button color="primary" class="full-width btn-submit" type="submit" [disabled]="registerForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                Registrarse
              }
            </button>

            <div class="auth-links" style="justify-content: center;">
              <span>¿Ya tiene una cuenta? <a routerLink="/auth/login">Iniciar Sesión</a></span>
            </div>
          </form>
        }
      </mat-card>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public authService = inject(AuthService);

  readonly hidePassword = signal(true);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly passwordStrength = signal(0);
  readonly strengthLabel = signal('Débil');
  readonly strengthColor = signal('#e53935');
  readonly strengthColorName = signal<'primary' | 'accent' | 'warn'>('warn');

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  updateStrength(): void {
    const val = this.registerForm.get('password')?.value || '';
    let score = 0;
    if (val.length >= 8) score += 25;
    if (/[A-Z]/.test(val)) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;

    this.passwordStrength.set(score);
    if (score < 50) {
      this.strengthLabel.set('Débil');
      this.strengthColor.set('#e53935');
      this.strengthColorName.set('warn');
    } else if (score < 100) {
      this.strengthLabel.set('Media');
      this.strengthColor.set('#fb8c00');
      this.strengthColorName.set('accent');
    } else {
      this.strengthLabel.set('Fuerte');
      this.strengthColor.set('#43a047');
      this.strengthColorName.set('primary');
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { fullName, email, password } = this.registerForm.value;
    this.authService.register({ fullName, email, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message);
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'No fue posible registrar la cuenta.');
      }
    });
  }
}
