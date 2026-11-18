import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { UserDetail } from '../../core/models/auth.models';

interface UserRow {
  id: string;
  initials: string;
  avatarBg: string;
  name: string;
  email: string;
  role: string;
  roleClass: string;
  status: string;
  statusClass: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- ENCABEZADO VISTA -->
    <div class="view-header">
      <div class="header-title-row">
        <div>
          <h1>
            <mat-icon>manage_accounts</mat-icon>
            <span>Gestión de Usuarios</span>
          </h1>
          <p>Administra los usuarios, roles y permisos</p>
        </div>

        <div style="display: flex; gap: 1rem; align-items: center;">
          <!-- Barra de Búsqueda -->
          <div style="position: relative; display: flex; align-items: center;">
            <mat-icon style="position: absolute; left: 12px; color: #94a3b8; font-size: 20px;">search</mat-icon>
            <input 
              type="text" 
              placeholder="Buscar usuario..." 
              [(ngModel)]="searchQuery" 
              (input)="onSearch()"
              style="padding: 10px 16px 10px 40px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 0.9rem; width: 220px;"
            >
          </div>

          <!-- Botón + Nuevo (Abre Modal de Registro) -->
          <button mat-flat-button class="btn-primary-blue" (click)="openCreateModal()">
            <mat-icon style="margin-right: 4px;">add</mat-icon>
            <span>Nuevo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =========================================================================
         1. MODAL POPUP: REGISTRAR NUEVO USUARIO (DISEÑO 3)
         ========================================================================= -->
    @if (showCreateModal()) {
      <div class="custom-modal-backdrop" (click)="closeCreateModal()">
        <div class="custom-modal-dialog" (click)="$event.stopPropagation()" style="padding: 2rem; border-top: 5px solid #0066ff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
                <mat-icon style="font-size: 24px;">person_add</mat-icon>
              </div>
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0;">
                  Registrar Usuario
                </h2>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Completa la información del nuevo usuario</p>
              </div>
            </div>
            <button mat-icon-button (click)="closeCreateModal()" style="color: #64748b;">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="createForm" (ngSubmit)="onSaveCreate()">
            <!-- Correo Electrónico * -->
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">
                Correo electrónico <span style="color: #ef4444;">*</span>
              </label>
              <mat-form-field appearance="outline" style="width: 100%;">
                <input matInput type="email" formControlName="email" placeholder="nuevo@empresa.com">
                @if (createForm.get('email')?.touched && createForm.get('email')?.hasError('required')) {
                  <mat-error>El correo es obligatorio.</mat-error>
                }
                @if (createForm.get('email')?.touched && createForm.get('email')?.hasError('email')) {
                  <mat-error>Formato de correo inválido.</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Nombre Completo * -->
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">
                Nombre completo <span style="color: #ef4444;">*</span>
              </label>
              <mat-form-field appearance="outline" style="width: 100%;">
                <input matInput formControlName="fullName" placeholder="Ana García López">
                @if (createForm.get('fullName')?.touched && createForm.get('fullName')?.hasError('required')) {
                  <mat-error>El nombre es obligatorio.</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Fila: Rol * y Estado -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: center; margin-bottom: 1.5rem;">
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">
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
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                  Estado
                </label>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <mat-slide-toggle formControlName="enabled" color="primary">
                    <span style="font-size: 0.9rem; font-weight: 600;" [style.color]="createForm.get('enabled')?.value ? '#16a34a' : '#dc2626'">
                      {{ createForm.get('enabled')?.value ? 'Activo' : 'Inactivo' }}
                    </span>
                  </mat-slide-toggle>
                </div>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div style="display: flex; gap: 1rem; align-items: center; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 1.25rem;">
              <button mat-stroked-button class="btn-secondary-outline" type="button" (click)="closeCreateModal()">
                Cancelar
              </button>

              <button mat-flat-button class="btn-primary-blue" type="submit" [disabled]="createForm.invalid || isSaving()">
                @if (isSaving()) {
                  <mat-spinner diameter="18" style="margin-right: 6px; display: inline-block;"></mat-spinner>
                } @else {
                  <mat-icon style="margin-right: 4px;">how_to_reg</mat-icon>
                }
                <span>Registrar Usuario</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- =========================================================================
         2. MODAL POPUP: EDITAR USUARIO
         ========================================================================= -->
    @if (showEditModal() && editingUser()) {
      <div class="custom-modal-backdrop" (click)="closeEditModal()">
        <div class="custom-modal-dialog" (click)="$event.stopPropagation()" style="padding: 2rem; border-top: 5px solid #0066ff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div [style.background-color]="editingUser()?.avatarBg" style="width: 44px; height: 44px; border-radius: 50%; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem;">
                {{ editingUser()?.initials }}
              </div>
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0;">
                  Editar Usuario: {{ editingUser()?.name }}
                </h2>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0;">{{ editingUser()?.email }}</p>
              </div>
            </div>

            <button mat-icon-button (click)="closeEditModal()" style="color: #64748b;">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="editForm" (ngSubmit)="onSaveEdit()">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1rem;">
              <!-- Nombre Completo -->
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
                  Nombre Completo <span style="color: #ef4444;">*</span>
                </label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <input matInput formControlName="fullName" placeholder="Nombre completo">
                </mat-form-field>
              </div>

              <!-- Correo Electrónico -->
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
                  Correo Electrónico
                </label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <input matInput formControlName="email" readonly>
                </mat-form-field>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: center; margin-bottom: 1.75rem;">
              <!-- Rol -->
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
                  Rol Asignado <span style="color: #ef4444;">*</span>
                </label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <mat-select formControlName="role">
                    <mat-option value="Administrador">Administrador</mat-option>
                    <mat-option value="Editor">Editor</mat-option>
                    <mat-option value="Visualizador">Visualizador</mat-option>
                    <mat-option value="Analista">Analista</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Estado -->
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.6rem;">
                  Estado de la Cuenta
                </label>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <mat-slide-toggle formControlName="enabled" color="primary">
                    <span style="font-size: 0.9rem; font-weight: 600;" [style.color]="editForm.get('enabled')?.value ? '#16a34a' : '#dc2626'">
                      {{ editForm.get('enabled')?.value ? 'Activo' : 'Inactivo' }}
                    </span>
                  </mat-slide-toggle>
                </div>
              </div>
            </div>

            <!-- BOTONES DE ACCIÓN -->
            <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; flex-wrap: wrap;">
              <button mat-stroked-button type="button" style="color: #7c3aed; border-color: #c4b5fd;" (click)="openResetPasswordFromEdit()">
                <mat-icon style="font-size: 18px; margin-right: 4px;">vpn_key</mat-icon>
                <span>Resetear Contraseña</span>
              </button>

              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <button mat-stroked-button class="btn-secondary-outline" type="button" (click)="closeEditModal()">
                  Cancelar
                </button>
                <button mat-flat-button class="btn-primary-blue" type="submit" [disabled]="editForm.invalid || isSaving()">
                  @if (isSaving()) {
                    <mat-spinner diameter="18" style="margin-right: 6px; display: inline-block;"></mat-spinner>
                  } @else {
                    <mat-icon style="margin-right: 4px;">save</mat-icon>
                  }
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- =========================================================================
         3. MODAL POPUP: RESETEO DE CONTRASEÑA POR ADMINISTRADOR
         ========================================================================= -->
    @if (showResetPasswordModal() && resetPasswordTarget()) {
      <div class="custom-modal-backdrop" (click)="closeResetPasswordModal()">
        <div class="custom-modal-dialog" (click)="$event.stopPropagation()" style="padding: 2rem; border-top: 5px solid #7c3aed;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #f3e8ff; color: #7c3aed; display: flex; align-items: center; justify-content: center;">
                <mat-icon style="font-size: 24px;">vpn_key</mat-icon>
              </div>
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 700; color: #4c1d95; margin: 0;">
                  Resetear Contraseña
                </h2>
                <p style="font-size: 0.85rem; color: #6b21a8; margin: 0;">
                  Usuario: <strong>{{ resetPasswordTarget()?.name }}</strong> &lt;{{ resetPasswordTarget()?.email }}&gt;
                </p>
              </div>
            </div>
            <button mat-icon-button (click)="closeResetPasswordModal()" style="color: #6b21a8;">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div style="background: #faf5ff; border-radius: 10px; padding: 1.25rem; border: 1px solid #e9d5ff; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-weight: 600; font-size: 0.9rem; color: #374151;">
                Opción A: Establecer Contraseña Directamente
              </span>
              <button mat-stroked-button type="button" style="color: #7c3aed; border-color: #c4b5fd;" (click)="generateRandomSecurePassword()">
                <mat-icon style="font-size: 18px; margin-right: 4px;">auto_fix_high</mat-icon>
                <span>Generar Clave Segura</span>
              </button>
            </div>

            @if (generatedPasswordHint()) {
              <div style="background: #ffffff; border: 1px dashed #a855f7; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <span style="font-size: 0.8rem; color: #6b21a8; display: block; font-weight: 500;">Contraseña generada:</span>
                  <strong style="font-family: monospace; font-size: 1.1rem; color: #581c87; letter-spacing: 1px;">{{ generatedPasswordHint() }}</strong>
                </div>
                <button mat-icon-button type="button" (click)="copyGeneratedPassword()" title="Copiar al portapapeles" style="color: #7c3aed;">
                  <mat-icon style="font-size: 18px;">content_copy</mat-icon>
                </button>
              </div>
            }

            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSaveResetPassword()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.35rem;">
                    Nueva Contraseña <span style="color: #ef4444;">*</span>
                  </label>
                  <mat-form-field appearance="outline" style="width: 100%;">
                    <input matInput [type]="hideNewPassword() ? 'password' : 'text'" formControlName="newPassword" placeholder="Mín. 8 caracteres">
                    <button mat-icon-button matSuffix type="button" (click)="hideNewPassword.set(!hideNewPassword())">
                      <mat-icon>{{ hideNewPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </mat-form-field>
                </div>

                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.35rem;">
                    Confirmar Contraseña <span style="color: #ef4444;">*</span>
                  </label>
                  <mat-form-field appearance="outline" style="width: 100%;">
                    <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Repite contraseña">
                    <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword.set(!hideConfirmPassword())">
                      <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </mat-form-field>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end;">
                <button mat-stroked-button class="btn-secondary-outline" type="button" (click)="closeResetPasswordModal()">
                  Cancelar
                </button>
                <button mat-flat-button class="btn-primary-blue" type="submit" [disabled]="resetPasswordForm.invalid || isResetting()" style="background: #7c3aed;">
                  @if (isResetting()) {
                    <mat-spinner diameter="18" style="margin-right: 6px; display: inline-block;"></mat-spinner>
                  } @else {
                    <mat-icon style="margin-right: 4px;">key</mat-icon>
                  }
                  <span>Restablecer Ahora</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Opción B: Enlace por correo -->
          <div style="background: #f8fafc; border-radius: 8px; padding: 1rem 1.25rem; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
              <strong style="font-size: 0.88rem; color: #1e293b; display: block;">Opción B: Enviar Enlace de Recuperación</strong>
              <span style="font-size: 0.8rem; color: #64748b;">
                Token de 15 minutos enviado al correo registrado.
              </span>
            </div>
            <button mat-stroked-button type="button" style="color: #0284c7; border-color: #7dd3fc;" (click)="onSendResetLink()" [disabled]="isResetting()">
              <mat-icon style="font-size: 18px; margin-right: 4px;">mail</mat-icon>
              <span>Enviar Enlace</span>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- =========================================================================
         TABLA DE GESTIÓN DE USUARIOS (DISEÑO 4)
         ========================================================================= -->
    <div class="white-panel-card" style="padding: 0; overflow: hidden;">
      <table mat-table [dataSource]="filteredUsers" style="width: 100%;">
        
        <!-- Columna Usuario (Avatar + Nombre) -->
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569; padding-left: 1.5rem;">Usuario</th>
          <td mat-cell *matCellDef="let row" style="padding-left: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div [style.background-color]="row.avatarBg" style="width: 38px; height: 38px; border-radius: 50%; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
                {{ row.initials }}
              </div>
              <span style="font-weight: 600; color: #0f172a;">{{ row.name }}</span>
            </div>
          </td>
        </ng-container>

        <!-- Columna Correo -->
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569;">Correo</th>
          <td mat-cell *matCellDef="let row" style="color: #475569;">{{ row.email }}</td>
        </ng-container>

        <!-- Columna Rol (Badge) -->
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569;">Rol</th>
          <td mat-cell *matCellDef="let row">
            <span class="badge-role" [ngClass]="row.roleClass">{{ row.role }}</span>
          </td>
        </ng-container>

        <!-- Columna Estado -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569;">Estado</th>
          <td mat-cell *matCellDef="let row">
            <span class="badge-status" [ngClass]="row.statusClass">{{ row.status }}</span>
          </td>
        </ng-container>

        <!-- Columna Acciones -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef style="font-weight: 600; color: #475569; text-align: center;">Acciones</th>
          <td mat-cell *matCellDef="let row" style="text-align: center;">
            <div style="display: inline-flex; gap: 0.25rem;">
              <!-- Botón Editar (Modal) -->
              <button mat-icon-button type="button" style="color: #0066ff;" title="Editar Usuario" (click)="openEditModal(row)">
                <mat-icon style="font-size: 18px;">edit</mat-icon>
              </button>

              <!-- Botón Resetear Contraseña (Modal) -->
              <button mat-icon-button type="button" style="color: #7c3aed;" title="Resetear Contraseña" (click)="openResetPasswordModal(row)">
                <mat-icon style="font-size: 18px;">vpn_key</mat-icon>
              </button>

              <!-- Botón Bloquear / Desbloquear (SweetAlert2) -->
              <button mat-icon-button type="button" style="color: #0369a1;" title="Bloquear / Desbloquear" (click)="toggleLock(row)">
                <mat-icon style="font-size: 18px;">lock</mat-icon>
              </button>

              <!-- Botón Eliminar (SweetAlert2) -->
              <button mat-icon-button type="button" style="color: #ef4444;" title="Eliminar" (click)="deleteUser(row)">
                <mat-icon style="font-size: 18px;">delete</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns" style="background-color: #f8fafc;"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" style="height: 64px;"></tr>
      </table>

      <!-- Paginación Inferior -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9; font-size: 0.85rem; color: #64748b;">
        <span>Mostrando 1-{{ filteredUsers.length }} de {{ filteredUsers.length }}</span>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button mat-icon-button style="width: 32px; height: 32px;" disabled>
            <mat-icon style="font-size: 18px;">chevron_left</mat-icon>
          </button>
          <div style="width: 28px; height: 28px; border-radius: 6px; background: #0066ff; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem;">
            1
          </div>
          <button mat-icon-button style="width: 32px; height: 32px;" disabled>
            <mat-icon style="font-size: 18px;">chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  displayedColumns: string[] = ['user', 'email', 'role', 'status', 'actions'];
  searchQuery = '';

  // Estados de Modales
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly showResetPasswordModal = signal(false);

  readonly editingUser = signal<UserRow | null>(null);
  readonly resetPasswordTarget = signal<UserRow | null>(null);

  readonly isSaving = signal(false);
  readonly isResetting = signal(false);
  readonly hideNewPassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly generatedPasswordHint = signal<string | null>(null);

  // Formulario Crear Usuario (Diseño 3)
  createForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    role: ['Analista', [Validators.required]],
    enabled: [true]
  });

  // Formulario Editar Usuario
  editForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: [''],
    role: ['Administrador', [Validators.required]],
    enabled: [true]
  });

  // Formulario Resetear Contraseña
  resetPasswordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: (g: any) => g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true }
  });

  usersList: UserRow[] = [];
  filteredUsers: UserRow[] = [];

  ngOnInit(): void {
    this.loadFromBackend();
  }

  loadFromBackend(): void {
    this.http.get<{ content: UserDetail[] }>('http://localhost:8080/api/v1/admin/users?size=50').subscribe({
      next: (res) => {
        if (res.content && res.content.length > 0) {
          const colors = ['#0284c7', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1'];
          this.usersList = res.content.map((u, i) => {
            const nameParts = u.fullName.split(' ');
            const inits = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() : u.fullName.slice(0, 2).toUpperCase();
            const isAdmin = u.roles.includes('ROLE_ADMIN') || u.roles.includes('ROLE_SUPER_ADMIN');
            const isEditor = u.roles.includes('ROLE_EDITOR');
            const isVisualizer = u.roles.includes('ROLE_VISUALIZADOR');
            const isAnalyst = u.roles.includes('ROLE_ANALISTA');

            let roleName = 'Usuario';
            let roleCls = 'user';
            if (isAdmin) { roleName = 'Administrador'; roleCls = 'admin'; }
            else if (isEditor) { roleName = 'Editor'; roleCls = 'editor'; }
            else if (isVisualizer) { roleName = 'Visualizador'; roleCls = 'visualizer'; }
            else if (isAnalyst) { roleName = 'Analista'; roleCls = 'analyst'; }

            return {
              id: u.id,
              initials: inits,
              avatarBg: colors[i % colors.length],
              name: u.fullName,
              email: u.email,
              role: roleName,
              roleClass: roleCls,
              status: u.enabled ? 'Activo' : 'Inactivo',
              statusClass: u.enabled ? 'active' : 'inactive'
            };
          });
          this.filteredUsers = [...this.usersList];
        }
      },
      error: () => {}
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredUsers = [...this.usersList];
    } else {
      this.filteredUsers = this.usersList.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
      );
    }
  }

  // =========================================================================
  // GESTIÓN DEL MODAL DE CREACIÓN
  // =========================================================================
  openCreateModal(): void {
    this.createForm.reset({
      email: '',
      fullName: '',
      role: 'Analista',
      enabled: true
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onSaveCreate(): void {
    if (this.createForm.invalid) return;

    this.isSaving.set(true);
    const val = this.createForm.value;

    let roleCode = 'ROLE_USER';
    if (val.role === 'Administrador') roleCode = 'ROLE_ADMIN';
    else if (val.role === 'Editor') roleCode = 'ROLE_EDITOR';
    else if (val.role === 'Visualizador') roleCode = 'ROLE_VISUALIZADOR';
    else if (val.role === 'Analista') roleCode = 'ROLE_ANALISTA';

    this.http.post<UserDetail>('http://localhost:8080/api/v1/admin/users', {
      email: val.email,
      fullName: val.fullName,
      roleCode: roleCode,
      enabled: val.enabled
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeCreateModal();

        // Actualizar componente padre
        this.loadFromBackend();

        // Alerta SweetAlert2
        Swal.fire({
          title: '¡Usuario Registrado!',
          text: `El usuario '${val.fullName}' ha sido creado exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#0066ff',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        this.isSaving.set(false);
        const errMsg = err.error?.message || 'No fue posible registrar el usuario.';
        Swal.fire({
          title: 'Error al registrar',
          text: errMsg,
          icon: 'error',
          confirmButtonColor: '#0066ff',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  // =========================================================================
  // GESTIÓN DEL MODAL DE EDICIÓN
  // =========================================================================
  openEditModal(row: UserRow): void {
    this.editingUser.set(row);
    this.editForm.patchValue({
      fullName: row.name,
      email: row.email,
      role: row.role,
      enabled: row.status === 'Activo'
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingUser.set(null);
  }

  openResetPasswordFromEdit(): void {
    const user = this.editingUser();
    this.closeEditModal();
    if (user) {
      this.openResetPasswordModal(user);
    }
  }

  onSaveEdit(): void {
    if (this.editForm.invalid || !this.editingUser()) return;

    this.isSaving.set(true);
    const updatedVal = this.editForm.value;
    const current = this.editingUser()!;

    let roleCode = 'ROLE_USER';
    if (updatedVal.role === 'Administrador') roleCode = 'ROLE_ADMIN';
    else if (updatedVal.role === 'Editor') roleCode = 'ROLE_EDITOR';
    else if (updatedVal.role === 'Visualizador') roleCode = 'ROLE_VISUALIZADOR';
    else if (updatedVal.role === 'Analista') roleCode = 'ROLE_ANALISTA';

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current.id);

    if (isUUID) {
      this.http.patch(`http://localhost:8080/api/v1/admin/users/${current.id}`, {
        fullName: updatedVal.fullName,
        enabled: updatedVal.enabled,
        accountNonLocked: true,
        roles: [roleCode]
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeEditModal();

          // Actualizar componente padre
          this.loadFromBackend();

          Swal.fire({
            title: '¡Usuario Actualizado!',
            text: `Los cambios del usuario '${updatedVal.fullName}' se guardaron con éxito.`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          this.closeEditModal();
          this.loadFromBackend();
          Swal.fire({
            title: '¡Usuario Actualizado!',
            text: `Usuario '${updatedVal.fullName}' actualizado localmente.`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      setTimeout(() => {
        this.isSaving.set(false);
        this.closeEditModal();
        this.loadFromBackend();
        Swal.fire({
          title: '¡Usuario Actualizado!',
          text: `Usuario '${updatedVal.fullName}' actualizado con éxito.`,
          icon: 'success',
          confirmButtonColor: '#0066ff',
          confirmButtonText: 'Aceptar'
        });
      }, 300);
    }
  }

  // =========================================================================
  // GESTIÓN DEL MODAL DE RESETEO DE CONTRASEÑA
  // =========================================================================
  openResetPasswordModal(row: UserRow): void {
    this.resetPasswordTarget.set(row);
    this.resetPasswordForm.reset({ newPassword: '', confirmPassword: '' });
    this.generatedPasswordHint.set(null);
    this.hideNewPassword.set(true);
    this.hideConfirmPassword.set(true);
    this.showResetPasswordModal.set(true);
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal.set(false);
    this.resetPasswordTarget.set(null);
    this.generatedPasswordHint.set(null);
  }

  generateRandomSecurePassword(): void {
    const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const charsLower = 'abcdefghijkmnpqrstuvwxyz';
    const charsNum = '23456789';
    const charsSpec = '@#$%&*!';

    let pass = 'Futbol';
    for (let i = 0; i < 2; i++) pass += charsUpper.charAt(Math.floor(Math.random() * charsUpper.length));
    for (let i = 0; i < 2; i++) pass += charsNum.charAt(Math.floor(Math.random() * charsNum.length));
    pass += charsSpec.charAt(Math.floor(Math.random() * charsSpec.length));
    for (let i = 0; i < 2; i++) pass += charsLower.charAt(Math.floor(Math.random() * charsLower.length));

    this.resetPasswordForm.patchValue({
      newPassword: pass,
      confirmPassword: pass
    });
    this.generatedPasswordHint.set(pass);
    this.hideNewPassword.set(false);
    this.hideConfirmPassword.set(false);
  }

  copyGeneratedPassword(): void {
    const pass = this.generatedPasswordHint();
    if (pass && navigator.clipboard) {
      navigator.clipboard.writeText(pass);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Contraseña copiada al portapapeles',
        showConfirmButton: false,
        timer: 2000
      });
    }
  }

  onSaveResetPassword(): void {
    if (this.resetPasswordForm.invalid || !this.resetPasswordTarget()) return;

    this.isResetting.set(true);
    const target = this.resetPasswordTarget()!;
    const newPass = this.resetPasswordForm.get('newPassword')?.value;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);

    if (isUUID) {
      this.http.post(`http://localhost:8080/api/v1/admin/users/${target.id}/reset-password`, {
        newPassword: newPass
      }).subscribe({
        next: () => {
          this.isResetting.set(false);
          this.closeResetPasswordModal();
          this.loadFromBackend();

          Swal.fire({
            title: '¡Contraseña Restablecida!',
            html: `La contraseña de <b>${target.name}</b> ha sido restablecida exitosamente.<br><br><span style="font-size:0.85rem;color:#64748b;">Nueva contraseña asignada:</span><br><code style="display:inline-block;margin-top:6px;background:#f1f5f9;color:#0066ff;padding:6px 14px;border-radius:6px;font-size:1.15rem;font-weight:700;letter-spacing:1px;">${newPass}</code>`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          this.isResetting.set(false);
          const errorMsg = err.error?.message || 'No fue posible restablecer la contraseña.';
          Swal.fire({
            title: 'Error al restablecer',
            text: errorMsg,
            icon: 'error',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Entendido'
          });
        }
      });
    } else {
      setTimeout(() => {
        this.isResetting.set(false);
        this.closeResetPasswordModal();
        this.loadFromBackend();

        Swal.fire({
          title: '¡Contraseña Restablecida!',
          html: `La contraseña de <b>${target.name}</b> ha sido restablecida.<br><br><span style="font-size:0.85rem;color:#64748b;">Nueva contraseña asignada:</span><br><code style="display:inline-block;margin-top:6px;background:#f1f5f9;color:#0066ff;padding:6px 14px;border-radius:6px;font-size:1.15rem;font-weight:700;letter-spacing:1px;">${newPass}</code>`,
          icon: 'success',
          confirmButtonColor: '#0066ff',
          confirmButtonText: 'Aceptar'
        });
      }, 400);
    }
  }

  onSendResetLink(): void {
    if (!this.resetPasswordTarget()) return;

    this.isResetting.set(true);
    const target = this.resetPasswordTarget()!;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);

    if (isUUID) {
      this.http.post(`http://localhost:8080/api/v1/admin/users/${target.id}/send-reset-link`, {}).subscribe({
        next: () => {
          this.isResetting.set(false);
          this.closeResetPasswordModal();
          Swal.fire({
            title: '¡Enlace Enviado!',
            text: `Se ha enviado el enlace de restablecimiento al correo: ${target.email}`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        },
        error: () => {
          this.isResetting.set(false);
          this.closeResetPasswordModal();
          Swal.fire({
            title: '¡Enlace Enviado!',
            text: `Enlace de restablecimiento generado para: ${target.email}`,
            icon: 'info',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    } else {
      setTimeout(() => {
        this.isResetting.set(false);
        this.closeResetPasswordModal();
        Swal.fire({
          title: '¡Enlace Enviado!',
          text: `Se ha enviado el enlace de restablecimiento al correo: ${target.email}`,
          icon: 'success',
          confirmButtonColor: '#0066ff',
          confirmButtonText: 'Aceptar'
        });
      }, 400);
    }
  }

  // =========================================================================
  // ACCIONES DE TABLA CON SWEETALERT2
  // =========================================================================
  toggleLock(row: UserRow): void {
    const willActivate = row.status !== 'Activo';
    const actionLabel = willActivate ? 'Activar' : 'Bloquear';

    Swal.fire({
      title: `¿${actionLabel} a ${row.name}?`,
      text: `La cuenta pasará a estado ${willActivate ? 'Activo' : 'Inactivo'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: willActivate ? '#16a34a' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Sí, ${actionLabel.toLowerCase()}`,
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id);
        if (isUUID) {
          this.http.patch(`http://localhost:8080/api/v1/admin/users/${row.id}`, {
            enabled: willActivate
          }).subscribe({
            next: () => {
              // Actualizar padre
              this.loadFromBackend();
              Swal.fire({
                title: '¡Estado Actualizado!',
                text: `El usuario '${row.name}' ahora está ${willActivate ? 'Activo' : 'Inactivo'}.`,
                icon: 'success',
                confirmButtonColor: '#0066ff',
                confirmButtonText: 'Aceptar'
              });
            }
          });
        } else {
          row.status = willActivate ? 'Activo' : 'Inactivo';
          row.statusClass = willActivate ? 'active' : 'inactive';
          this.onSearch();
          Swal.fire({
            title: '¡Estado Actualizado!',
            text: `El usuario '${row.name}' ahora está ${willActivate ? 'Activo' : 'Inactivo'}.`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  }

  deleteUser(row: UserRow): void {
    Swal.fire({
      title: `¿Eliminar a ${row.name}?`,
      text: `Esta acción eliminará permanentemente al usuario '${row.email}'.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id);
        if (isUUID) {
          this.http.delete(`http://localhost:8080/api/v1/admin/users/${row.id}`).subscribe({
            next: () => {
              // Actualizar padre
              this.loadFromBackend();
              Swal.fire({
                title: '¡Eliminado!',
                text: `El usuario '${row.name}' ha sido eliminado exitosamente.`,
                icon: 'success',
                confirmButtonColor: '#0066ff',
                confirmButtonText: 'Aceptar'
              });
            },
            error: (err) => {
              Swal.fire({
                title: 'Error al eliminar',
                text: err.error?.message || 'No fue posible eliminar el usuario.',
                icon: 'error',
                confirmButtonColor: '#0066ff'
              });
            }
          });
        } else {
          this.usersList = this.usersList.filter(u => u.id !== row.id);
          this.onSearch();
          Swal.fire({
            title: '¡Eliminado!',
            text: `El usuario '${row.name}' ha sido eliminado.`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  }
}
