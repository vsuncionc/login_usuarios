import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { Permission, Role } from '../../core/models/auth.models';

interface GroupedPermissions {
  resource: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- ENCABEZADO VISTA -->
    <div class="view-header">
      <div class="header-title-row">
        <div>
          <h1>
            <mat-icon>security</mat-icon>
            <span>Roles y Permisos</span>
          </h1>
          <p>Control de acceso basado en roles (RBAC) y privilegios granulares</p>
        </div>

        <button mat-flat-button class="btn-primary-blue" (click)="openCreateForm()">
          <mat-icon style="margin-right: 4px;">add_moderator</mat-icon>
          <span>Nuevo Rol</span>
        </button>
      </div>
    </div>

    <!-- =========================================================================
         MODAL POPUP: CREACIÓN / EDICIÓN DE ROL
         ========================================================================= -->
    @if (showForm()) {
      <div class="custom-modal-backdrop" (click)="closeForm()">
        <div class="custom-modal-dialog" (click)="$event.stopPropagation()" style="padding: 2rem; border-top: 5px solid #0066ff; max-width: 760px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
                <mat-icon style="font-size: 24px;">security</mat-icon>
              </div>
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 0;">
                  {{ isEditing() ? 'Editar Rol: ' + editingRole()?.code : 'Crear Nuevo Rol' }}
                </h2>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Configure permisos y descripción para este rol</p>
              </div>
            </div>
            <button mat-icon-button (click)="closeForm()" style="color: #64748b;">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="roleForm" (ngSubmit)="onSubmit()">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1rem;">
              <!-- Código del Rol -->
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
                  Código de Rol (ej. ROLE_ANALISTA) <span style="color: #ef4444;">*</span>
                </label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <input matInput formControlName="code" placeholder="ROLE_SUPERVISOR" [readonly]="isEditing()">
                </mat-form-field>
              </div>

              <!-- Nombre Descriptivo -->
              <div>
                <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
                  Nombre del Rol <span style="color: #ef4444;">*</span>
                </label>
                <mat-form-field appearance="outline" style="width: 100%;">
                  <input matInput formControlName="name" placeholder="Supervisor de Operaciones">
                </mat-form-field>
              </div>
            </div>

            <!-- Descripción -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.88rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">
                Descripción del Rol
              </label>
              <mat-form-field appearance="outline" style="width: 100%;">
                <input matInput formControlName="description" placeholder="Acceso a visualización y auditoría">
              </mat-form-field>
            </div>

            <!-- MATRIZ DE PERMISOS GRANULARES -->
            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">
                Permisos Asignados al Rol
              </label>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; max-height: 280px; overflow-y: auto; padding-right: 4px;">
                @for (group of groupedPermissions(); track group.resource) {
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem;">
                      <strong style="color: #0066ff; font-size: 0.85rem; text-transform: uppercase;">
                        Módulo {{ group.resource }}
                      </strong>
                      <button type="button" mat-button style="font-size: 0.75rem; height: 26px; line-height: 26px; padding: 0 6px;" (click)="toggleGroup(group)">
                        Invertir
                      </button>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      @for (perm of group.permissions; track perm.code) {
                        <mat-checkbox 
                          [checked]="isPermissionSelected(perm.code)" 
                          (change)="togglePermission(perm.code, $event.checked)"
                          color="primary">
                          <span style="font-size: 0.85rem; font-weight: 500; color: #1e293b;">{{ perm.code }}</span>
                          <div style="font-size: 0.75rem; color: #64748b; line-height: 1.2;">{{ perm.description }}</div>
                        </mat-checkbox>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- BOTONES DE ACCIÓN -->
            <div style="display: flex; gap: 1rem; align-items: center; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 1.25rem;">
              <button mat-stroked-button class="btn-secondary-outline" type="button" (click)="closeForm()">
                Cancelar
              </button>

              <button mat-flat-button class="btn-primary-blue" type="submit" [disabled]="roleForm.invalid || isSaving()">
                @if (isSaving()) {
                  <mat-spinner diameter="18" style="margin-right: 6px; display: inline-block;"></mat-spinner>
                } @else {
                  <mat-icon style="margin-right: 4px;">save</mat-icon>
                }
                <span>{{ isEditing() ? 'Actualizar Rol' : 'Guardar Rol' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- =========================================================================
         LISTADO DE ROLES EN TARJETAS (COMPONENTE PADRE)
         ========================================================================= -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
      @for (role of roles(); track role.id) {
        <div class="white-panel-card" style="display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          
          <div>
            <!-- Header de Tarjeta de Rol -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem;">
              <div>
                <span class="badge-role" [ngClass]="getRoleClass(role.code)" style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.4rem;">
                  {{ role.code }}
                </span>
                <h3 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0.25rem 0 0 0;">
                  {{ role.name }}
                </h3>
              </div>

              @if (role.isSystemRole) {
                <span style="font-size: 0.72rem; font-weight: 600; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 3px;">
                  <mat-icon style="font-size: 13px; width: 13px; height: 13px;">lock</mat-icon> Sistema
                </span>
              }
            </div>

            <p style="font-size: 0.88rem; color: #64748b; margin: 0 0 1.25rem 0; line-height: 1.4;">
              {{ role.description || 'Sin descripción asignada.' }}
            </p>

            <!-- Chips de Permisos -->
            <div style="margin-bottom: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.4rem;">
                Permisos Otorgados ({{ role.permissions.length }})
              </span>
              
              <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; max-height: 120px; overflow-y: auto;">
                @for (perm of role.permissions; track perm) {
                  <span style="font-size: 0.72rem; background: #f1f5f9; color: #334155; padding: 2px 8px; border-radius: 4px; font-weight: 500; font-family: monospace;">
                    {{ perm }}
                  </span>
                }
                @if (role.permissions.length === 0) {
                  <span style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">Sin permisos asignados</span>
                }
              </div>
            </div>
          </div>

          <!-- Acciones del Rol -->
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-top: 0.5rem;">
            <button mat-stroked-button style="font-size: 0.85rem; height: 36px;" (click)="openEditForm(role)">
              <mat-icon style="font-size: 16px; margin-right: 4px;">edit</mat-icon> Editar
            </button>

            @if (!role.isSystemRole) {
              <button mat-icon-button color="warn" title="Eliminar Rol" (click)="deleteRole(role)">
                <mat-icon style="font-size: 18px;">delete</mat-icon>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class RoleManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private readonly API_URL = 'http://localhost:8080/api/v1/admin';

  readonly roles = signal<Role[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly groupedPermissions = signal<GroupedPermissions[]>([]);

  readonly showForm = signal(false);
  readonly isEditing = signal(false);
  readonly editingRole = signal<Role | null>(null);
  readonly isSaving = signal(false);

  readonly selectedPermissions = signal<Set<String>>(new Set());

  roleForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern('^ROLE_[A-Z0-9_]+$')]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.http.get<Role[]>(`${this.API_URL}/roles`).subscribe({
      next: (data) => this.roles.set(data),
      error: () => {}
    });
  }

  loadPermissions(): void {
    this.http.get<Permission[]>(`${this.API_URL}/permissions`).subscribe({
      next: (data) => {
        this.permissions.set(data);
        this.groupPermissions(data);
      },
      error: () => {}
    });
  }

  private groupPermissions(perms: Permission[]): void {
    const groups: { [key: string]: Permission[] } = {};
    for (const p of perms) {
      if (!groups[p.resource]) groups[p.resource] = [];
      groups[p.resource].push(p);
    }
    const result: GroupedPermissions[] = Object.keys(groups).map(resource => ({
      resource,
      permissions: groups[resource]
    }));
    this.groupedPermissions.set(result);
  }

  getRoleClass(code: string): string {
    if (code === 'ROLE_SUPER_ADMIN' || code === 'ROLE_ADMIN') return 'admin';
    if (code === 'ROLE_EDITOR') return 'editor';
    if (code === 'ROLE_VISUALIZADOR') return 'visualizer';
    if (code === 'ROLE_ANALISTA') return 'analyst';
    return 'user';
  }

  openCreateForm(): void {
    this.isEditing.set(false);
    this.editingRole.set(null);
    this.selectedPermissions.set(new Set());
    this.roleForm.reset();
    this.roleForm.get('code')?.enable();
    this.showForm.set(true);
  }

  openEditForm(role: Role): void {
    this.isEditing.set(true);
    this.editingRole.set(role);
    this.selectedPermissions.set(new Set(role.permissions));
    this.roleForm.patchValue({
      code: role.code,
      name: role.name,
      description: role.description
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingRole.set(null);
    this.roleForm.reset();
  }

  isPermissionSelected(code: string): boolean {
    return this.selectedPermissions().has(code);
  }

  togglePermission(code: string, checked: boolean): void {
    const current = new Set(this.selectedPermissions());
    if (checked) {
      current.add(code);
    } else {
      current.delete(code);
    }
    this.selectedPermissions.set(current);
  }

  toggleGroup(group: GroupedPermissions): void {
    const current = new Set(this.selectedPermissions());
    const allSelected = group.permissions.every(p => current.has(p.code));
    for (const p of group.permissions) {
      if (allSelected) {
        current.delete(p.code);
      } else {
        current.add(p.code);
      }
    }
    this.selectedPermissions.set(current);
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;

    this.isSaving.set(true);
    const formVal = this.roleForm.value;
    const permissions = Array.from(this.selectedPermissions());

    if (this.isEditing() && this.editingRole()) {
      const id = this.editingRole()!.id;
      this.http.put<Role>(`${this.API_URL}/roles/${id}`, {
        name: formVal.name,
        description: formVal.description,
        permissions
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeForm();
          // Actualizar componente padre
          this.loadRoles();

          Swal.fire({
            title: '¡Rol Actualizado!',
            text: `El rol '${formVal.name}' fue actualizado con éxito.`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          Swal.fire({
            title: 'Error al actualizar',
            text: err.error?.detail || err.error?.message || 'Error al actualizar el rol',
            icon: 'error',
            confirmButtonColor: '#0066ff'
          });
        }
      });
    } else {
      this.http.post<Role>(`${this.API_URL}/roles`, {
        code: formVal.code,
        name: formVal.name,
        description: formVal.description,
        permissions
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeForm();
          // Actualizar componente padre
          this.loadRoles();

          Swal.fire({
            title: '¡Rol Creado!',
            text: `El rol '${formVal.name}' fue creado exitosamente.`,
            icon: 'success',
            confirmButtonColor: '#0066ff',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err) => {
          this.isSaving.set(false);
          Swal.fire({
            title: 'Error al crear rol',
            text: err.error?.detail || err.error?.message || 'Error al crear el rol',
            icon: 'error',
            confirmButtonColor: '#0066ff'
          });
        }
      });
    }
  }

  deleteRole(role: Role): void {
    Swal.fire({
      title: `¿Eliminar rol '${role.name}'?`,
      text: `El rol '${role.code}' será removido permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.http.delete(`${this.API_URL}/roles/${role.id}`).subscribe({
          next: () => {
            // Actualizar padre
            this.loadRoles();
            Swal.fire({
              title: '¡Rol Eliminado!',
              text: `El rol '${role.name}' fue eliminado exitosamente.`,
              icon: 'success',
              confirmButtonColor: '#0066ff',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (err) => {
            Swal.fire({
              title: 'Error al eliminar',
              text: err.error?.detail || err.error?.message || 'No fue posible eliminar el rol.',
              icon: 'error',
              confirmButtonColor: '#0066ff'
            });
          }
        });
      }
    });
  }
}
