package com.empresa.seguridad.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class UserManagementDtos {

    public record UserDetailDto(
            UUID id,
            String email,
            String fullName,
            boolean enabled,
            boolean accountNonLocked,
            int failedLoginAttempts,
            LocalDateTime createdAt,
            Set<String> roles
    ) {}

    public record UserUpdateDto(
            String fullName,
            Boolean enabled,
            Boolean accountNonLocked,
            Set<String> roles
    ) {}

    public record CreateUserRequest(
            @NotBlank(message = "El correo electrónico es requerido")
            String email,

            @NotBlank(message = "El nombre completo es requerido")
            String fullName,

            String roleCode,

            Boolean enabled,

            String password
    ) {}

    public record AdminResetPasswordRequest(
            @NotBlank(message = "La nueva contraseña es obligatoria")
            @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
            String newPassword
    ) {}

    public record BatchRoleAssignmentRequest(
            @NotEmpty(message = "Debe proporcionar al menos un ID de usuario")
            List<UUID> userIds,

            @NotEmpty(message = "Debe proporcionar al menos un ID de rol")
            List<UUID> roleIds
    ) {}

    public record BatchStatusUpdateRequest(
            @NotEmpty(message = "Debe proporcionar al menos un ID de usuario")
            List<UUID> userIds,

            @NotNull(message = "El nuevo estado es requerido")
            Boolean enabled
    ) {}

    public record RoleDto(
            UUID id,
            String code,
            String name,
            String description,
            boolean isSystemRole,
            Set<String> permissions
    ) {}

    public record CreateRoleRequest(
            @NotBlank(message = "El código de rol es requerido")
            @Pattern(regexp = "^ROLE_[A-Z0-9_]+$", message = "El código debe iniciar con 'ROLE_' y estar en mayúsculas")
            String code,

            @NotBlank(message = "El nombre del rol es requerido")
            String name,

            String description,

            Set<String> permissions
    ) {}

    public record UpdateRoleRequest(
            @NotBlank(message = "El nombre del rol es requerido")
            String name,

            String description,

            Set<String> permissions
    ) {}

    public record PermissionDto(
            UUID id,
            String code,
            String resource,
            String action,
            String description
    ) {}
}
