package com.empresa.seguridad.application.service;

import com.empresa.seguridad.application.dto.AuthDtos.ChangePasswordRequest;
import com.empresa.seguridad.application.dto.AuthDtos.UserSummaryDto;
import com.empresa.seguridad.application.dto.SystemConfigDto.ConfigDto;
import com.empresa.seguridad.application.dto.UserManagementDtos.*;
import com.empresa.seguridad.domain.model.Role;
import com.empresa.seguridad.domain.model.SystemConfiguration;
import com.empresa.seguridad.domain.model.User;
import com.empresa.seguridad.domain.repository.AuditLogRepository;
import com.empresa.seguridad.domain.repository.PasswordResetTokenRepository;
import com.empresa.seguridad.domain.repository.RefreshTokenRepository;
import com.empresa.seguridad.domain.repository.RoleRepository;
import com.empresa.seguridad.domain.repository.SystemConfigurationRepository;
import com.empresa.seguridad.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SystemConfigurationRepository configRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public UserSummaryDto getProfile(String email) {
        User user = userRepository.findByEmailWithRolesAndPermissions(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Set<String> roles = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getCode())
                .collect(Collectors.toSet());

        return new UserSummaryDto(user.getId(), user.getEmail(), user.getFullName(), roles, permissions);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request, String ip, String userAgent) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            auditService.recordEvent(user, "CHANGE_PASSWORD_FAILED", ip, userAgent, "Contraseña actual incorrecta");
            throw new BadCredentialsException("La contraseña actual proporcionada es incorrecta.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        // Revocar todas las sesiones previas excepto la actual si se desea
        refreshTokenService.revokeAllUserTokens(user);
        auditService.recordEvent(user, "CHANGE_PASSWORD_SUCCESS", ip, userAgent, "Cambio de contraseña exitoso");
    }

    @Transactional(readOnly = true)
    public Page<UserDetailDto> getAllUsers(Pageable pageable) {
        return userRepository.findAllWithRoles(pageable).map(this::mapToUserDetailDto);
    }

    @Transactional(readOnly = true)
    public UserDetailDto getUserById(UUID id) {
        User user = userRepository.findByIdWithRolesAndPermissions(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
        return mapToUserDetailDto(user);
    }

    @Transactional
    public UserDetailDto createUser(CreateUserRequest request, String adminEmail, String ip, String userAgent) {
        String normalizedEmail = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Ya existe un usuario registrado con el correo: " + normalizedEmail);
        }

        String rawPassword = (request.password() != null && !request.password().isBlank()) 
                ? request.password() 
                : "Futbol$" + UUID.randomUUID().toString().substring(0, 8) + "!";

        String roleCodeToAssign = (request.roleCode() != null && !request.roleCode().isBlank()) 
                ? request.roleCode() 
                : "ROLE_USER";

        Role assignedRole = roleRepository.findByCode(roleCodeToAssign)
                .orElseGet(() -> roleRepository.findByCode("ROLE_USER")
                        .orElseThrow(() -> new IllegalStateException("Rol base no encontrado")));

        User newUser = User.builder()
                .email(normalizedEmail)
                .fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .enabled(request.enabled() != null ? request.enabled() : true)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .roles(Set.of(assignedRole))
                .build();

        User saved = userRepository.save(newUser);
        auditService.recordEvent(saved, "ADMIN_USER_CREATED", ip, userAgent,
                "Usuario creado administrativamente por: " + adminEmail + " con rol: " + assignedRole.getName());

        return mapToUserDetailDto(saved);
    }

    @Transactional
    public void deleteUser(UUID id, String adminEmail, String ip, String userAgent) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        auditService.recordEvent(null, "ADMIN_USER_DELETED", ip, userAgent,
                "Usuario '" + user.getEmail() + "' (" + user.getFullName() + ") eliminado por administrador: " + adminEmail);

        refreshTokenRepository.deleteByUserId(user.getId());
        passwordResetTokenRepository.deleteByUserId(user.getId());
        auditLogRepository.unlinkUser(user.getId());
        userRepository.delete(user);
    }

    @Transactional
    public UserDetailDto updateUser(UUID id, UserUpdateDto dto) {
        User user = userRepository.findByIdWithRolesAndPermissions(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (dto.fullName() != null && !dto.fullName().isBlank()) {
            user.setFullName(dto.fullName().trim());
        }
        if (dto.enabled() != null) {
            user.setEnabled(dto.enabled());
        }
        if (dto.accountNonLocked() != null) {
            user.setAccountNonLocked(dto.accountNonLocked());
            if (dto.accountNonLocked()) {
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
            }
        }
        if (dto.roles() != null && !dto.roles().isEmpty()) {
            Set<Role> newRoles = roleRepository.findByCodeIn(dto.roles());
            if (!newRoles.isEmpty()) {
                user.setRoles(newRoles);
            }
        }

        User saved = userRepository.save(user);
        return mapToUserDetailDto(saved);
    }

    @Transactional
    public void resetUserPasswordByAdmin(UUID targetUserId, String newPassword, String adminEmail, String ip, String userAgent) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + targetUserId));

        targetUser.setPasswordHash(passwordEncoder.encode(newPassword));
        targetUser.setPasswordChangedAt(LocalDateTime.now());
        targetUser.setAccountNonLocked(true);
        targetUser.setFailedLoginAttempts(0);
        targetUser.setLockTime(null);
        userRepository.save(targetUser);

        refreshTokenService.revokeAllUserTokens(targetUser);
        auditService.recordEvent(targetUser, "ADMIN_PASSWORD_RESET", ip, userAgent,
                "Contraseña restablecida directamente por el administrador: " + adminEmail);
    }

    @Transactional
    public void sendResetLinkByAdmin(UUID targetUserId, String adminEmail, String ip, String userAgent) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + targetUserId));

        String rawResetToken = refreshTokenService.createPasswordResetToken(targetUser);
        emailService.sendPasswordResetEmail(targetUser.getEmail(), rawResetToken);
        auditService.recordEvent(targetUser, "ADMIN_DISPATCH_RESET_LINK", ip, userAgent,
                "Enlace de recuperación enviado por el administrador: " + adminEmail);
    }

    @Transactional
    public void batchUpdateStatus(BatchStatusUpdateRequest request) {
        userRepository.updateStatusInBatch(request.userIds(), request.enabled());
    }

    @Transactional
    public void batchAssignRoles(BatchRoleAssignmentRequest request) {
        Set<Role> rolesToAssign = roleRepository.findByIdIn(request.roleIds());
        List<User> users = userRepository.findAllById(request.userIds());

        for (User user : users) {
            user.getRoles().addAll(rolesToAssign);
        }
        userRepository.saveAll(users);
    }

    @Transactional(readOnly = true)
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAllWithPermissions().stream()
                .map(role -> new RoleDto(
                        role.getId(),
                        role.getCode(),
                        role.getName(),
                        role.getDescription(),
                        role.isSystemRole(),
                        role.getPermissions().stream().map(p -> p.getCode()).collect(Collectors.toSet())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConfigDto> getAllConfigs() {
        return configRepository.findAll().stream()
                .map(c -> new ConfigDto(c.getConfigKey(), c.getConfigValue(), c.getDescription(), c.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public void updateConfig(String key, String value, UUID updatedBy) {
        SystemConfiguration config = configRepository.findByConfigKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Configuración no encontrada para clave: " + key));

        config.setConfigValue(value);
        config.setUpdatedBy(updatedBy);
        configRepository.save(config);
    }

    private UserDetailDto mapToUserDetailDto(User user) {
        Set<String> roleCodes = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet())
                : Collections.emptySet();

        return new UserDetailDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.isEnabled(),
                user.isAccountNonLocked(),
                user.getFailedLoginAttempts(),
                user.getCreatedAt(),
                roleCodes
        );
    }
}
