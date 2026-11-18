import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { LOGIN_BANNER_BASE64 } from './banner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page-wrapper">
      <!-- TARJETA FLOTANTE CON ESQUINAS REDONDEADAS (DISEÑO DE REFERENCIA) -->
      <div class="login-card-box">
        
        <!-- LADO IZQUIERDO: BANNER FÚTBOL S.A. CON ESTADIO Y BALÓN -->
        <div class="login-banner-pane" [style.background-image]="'url(' + bannerUrl + ')'">
        </div>

        <!-- LADO DERECHO: FORMULARIO INICIAR SESIÓN -->
        <div class="login-form-pane">
          <div class="login-pane-content">
            <h2 class="login-title">Iniciar Sesión</h2>
            <p class="login-subtitle">Accede a tu cuenta empresarial</p>

            @if (errorMessage()) {
              <div class="alert-box error" style="margin-bottom: 1.25rem;">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <!-- Correo Electrónico -->
              <mat-form-field appearance="outline" class="login-field-ref">
                <mat-icon matPrefix style="color: #475569; margin-right: 8px;">mail_outline</mat-icon>
                <input matInput type="email" formControlName="email" placeholder="Correo electrónico" autocomplete="username">
              </mat-form-field>

              <!-- Contraseña -->
              <mat-form-field appearance="outline" class="login-field-ref">
                <mat-icon matPrefix style="color: #475569; margin-right: 8px;">lock_outline</mat-icon>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Contraseña" autocomplete="current-password">
                <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())" style="color: #475569;">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <!-- Fila: Recordarme y Olvidaste tu contraseña -->
              <div class="login-options-row">
                <mat-checkbox formControlName="rememberMe" color="primary">Recordarme</mat-checkbox>
                <a routerLink="/auth/forgot-password" class="forgot-link">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <!-- Botón Ingresar -->
              <button mat-flat-button class="btn-ref-ingresar" type="submit" [disabled]="loginForm.invalid || isLoading()">
                @if (isLoading()) {
                  <mat-spinner diameter="22" style="margin: 0 auto;"></mat-spinner>
                } @else {
                  Ingresar
                }
              </button>

              <!-- Separador: o -->
              <div class="login-divider-o">o</div>

              <!-- Botón Solicitar acceso -->
              <button mat-stroked-button class="btn-ref-solicitar" type="button" routerLink="/auth/register">
                Solicitar acceso
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  readonly bannerUrl = LOGIN_BANNER_BASE64;
  readonly hidePassword = signal(true);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['admin@empresa.com', [Validators.required, Validators.email]],
    password: ['Admin$Tr0ng_2026!', [Validators.required]],
    rememberMe: [true]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (this.authService.canAccessDashboard()) {
          this.router.navigate(['/dashboard']);
        } else if (this.authService.canAccessProfile()) {
          this.router.navigate(['/perfil']);
        } else {
          this.router.navigate(['/sin-acceso']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 429) {
          this.errorMessage.set('Demasiados intentos de acceso. Por seguridad espere un minuto.');
        } else if (err.status === 423) {
          this.errorMessage.set('Cuenta bloqueada temporalmente por intentos fallidos.');
        } else {
          this.errorMessage.set('Credenciales inválidas. Por favor verifique sus datos.');
        }
      }
    });
  }
}
