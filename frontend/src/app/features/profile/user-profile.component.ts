import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { MessageResponse, UserSummary } from '../../core/models/auth.models';

@Component({
  selector: 'app-user-profile',
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
    MatChipsModule,
    MatToolbarModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-toolbar color="primary" class="profile-toolbar">
      <span>Portal Empresarial</span>
      <span class="toolbar-spacer"></span>
      @if (authService.hasRole('ROLE_ADMIN') || authService.hasRole('ROLE_SUPER_ADMIN')) {
        <button mat-button routerLink="/admin">
          <mat-icon>admin_panel_settings</mat-icon> Panel Admin
        </button>
      }
      <button mat-button (click)="authService.logout()">
        <mat-icon>exit_to_app</mat-icon> Salir
      </button>
    </mat-toolbar>

    <div class="profile-container">
      <div class="profile-grid">
        <!-- Tarjeta de Información de Usuario -->
        <mat-card class="info-card">
          <mat-card-header>
            <div mat-card-avatar class="user-avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <mat-card-title>{{ profile()?.fullName || 'Usuario' }}</mat-card-title>
            <mat-card-subtitle>{{ profile()?.email }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content style="margin-top: 1rem;">
            <h3>Roles Asignados</h3>
            <mat-chip-set>
              @for (role of profile()?.roles; track role) {
                <mat-chip highlighted color="accent">{{ role }}</mat-chip>
              }
            </mat-chip-set>

            <h3 style="margin-top: 1.5rem;">Permisos Operativos</h3>
            <mat-chip-set>
              @for (perm of profile()?.permissions; track perm) {
                <mat-chip>{{ perm }}</mat-chip>
              }
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <!-- Tarjeta de Cambio de Contraseña -->
        <mat-card class="password-card">
          <mat-card-header>
            <mat-icon mat-card-avatar style="font-size: 36px; color: #1a237e;">lock</mat-icon>
            <mat-card-title>Seguridad de la Cuenta</mat-card-title>
            <mat-card-subtitle>Cambiar contraseña actual</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content style="margin-top: 1rem;">
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

            <form [formGroup]="changePwdForm" (ngSubmit)="onChangePassword()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Contraseña Actual</mat-label>
                <input matInput [type]="hideCurrent() ? 'password' : 'text'" formControlName="currentPassword">
                <button mat-icon-button matSuffix type="button" (click)="hideCurrent.set(!hideCurrent())">
                  <mat-icon>{{ hideCurrent() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nueva Contraseña</mat-label>
                <input matInput [type]="hideNew() ? 'password' : 'text'" formControlName="newPassword">
                <button mat-icon-button matSuffix type="button" (click)="hideNew.set(!hideNew())">
                  <mat-icon>{{ hideNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <button mat-flat-button color="primary" class="full-width btn-submit" type="submit" [disabled]="changePwdForm.invalid || isChanging()">
                @if (isChanging()) {
                  <mat-spinner diameter="24"></mat-spinner>
                } @else {
                  Actualizar Clave
                }
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-toolbar {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    .profile-container {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    @media (max-width: 768px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #1e3c72;
      }
    }
    .info-card, .password-card {
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  `]
})
export class UserProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  readonly profile = signal<UserSummary | null>(null);
  readonly hideCurrent = signal(true);
  readonly hideNew = signal(true);
  readonly isChanging = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  changePwdForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.http.get<UserSummary>('http://localhost:8080/api/v1/profile/me').subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.profile.set(this.authService.currentUser())
    });
  }

  onChangePassword(): void {
    if (this.changePwdForm.invalid) return;

    this.isChanging.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.post<MessageResponse>('http://localhost:8080/api/v1/profile/change-password', this.changePwdForm.value).subscribe({
      next: (res) => {
        this.isChanging.set(false);
        this.successMessage.set(res.message);
        this.changePwdForm.reset();
      },
      error: (err) => {
        this.isChanging.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al cambiar la contraseña. Verifique su clave actual.');
      }
    });
  }
}
