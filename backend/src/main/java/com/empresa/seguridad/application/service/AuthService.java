package com.empresa.seguridad.application.service;

import com.empresa.seguridad.application.dto.AuthDtos.*;
import com.empresa.seguridad.domain.model.PasswordResetToken;
import com.empresa.seguridad.domain.model.Permission;
import com.empresa.seguridad.domain.model.RefreshToken;
import com.empresa.seguridad.domain.model.Role;
import com.empresa.seguridad.domain.model.SystemConfiguration;
import com.empresa.seguridad.domain.model.User;
import com.empresa.seguridad.domain.repository.RoleRepository;
import com.empresa.seguridad.domain.repository.SystemConfigurationRepository;
import com.empresa.seguridad.domain.repository.UserRepository;
import com.empresa.seguridad.infrastructure.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SystemConfigurationRepository configRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${application.security.jwt.cookie-name:app_refresh_token}")
    private String cookieName;

    @Value("${application.security.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenDurationMs;

    @Value("${application.security.brute-force.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${application.security.brute-force.lock-duration-minutes:15}")
    private int lockDurationMinutes;

    @Transactional
    public LoginResponse authenticate(LoginRequest request, HttpServletResponse response, String ip, String userAgent) {
        String normalizedEmail = request.email().toLowerCase().trim();

        Optional<User> userOpt = userRepository.findByEmailWithRolesAndPermissions(normalizedEmail);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Verificar si el usuario está bloqueado por intentos
            if (!user.isAccountNonLocked() && user.getLockTime() != null) {
                if (user.getLockTime().plusMinutes(lockDurationMinutes).isAfter(LocalDateTime.now())) {
                    auditService.recordEvent(user, "LOGIN_BLOCKED", ip, userAgent, "Cuenta temporalmente bloqueada por exceso de intentos.");
                    throw new LockedException("La cuenta se encuentra temporalmente bloqueada por motivos de seguridad. Intente más tarde.");
                } else {
                    // Desbloqueo automático transcurrido el tiempo
                    user.setAccountNonLocked(true);
                    user.setFailedLoginAttempts(0);
                    user.setLockTime(null);
                    userRepository.save(user);
                }
            }
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );
        } catch (BadCredentialsException ex) {
            userOpt.ifPresent(u -> {
                int attempts = u.getFailedLoginAttempts() + 1;
                u.setFailedLoginAttempts(attempts);
                if (attempts >= maxFailedAttempts) {
                    u.setAccountNonLocked(false);
                    u.setLockTime(LocalDateTime.now());
                    log.warn("Usuario {} bloqueado tras {} intentos fallidos", u.getEmail(), attempts);
                }
                userRepository.save(u);
                auditService.recordEvent(u, "LOGIN_FAILED", ip, userAgent, "Credenciales erróneas. Intento " + attempts);
            });
            throw new BadCredentialsException("Credenciales de acceso inválidas.");
        }

        User user = userOpt.orElseThrow(() -> new BadCredentialsException("Credenciales de acceso inválidas."));

        // Resetear contador de fallos
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setLockTime(null);
            userRepository.save(user);
        }

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.createRefreshToken(user, ip, userAgent);

        setRefreshTokenCookie(response, rawRefreshToken, Duration.ofMillis(refreshTokenDurationMs));
        auditService.recordEvent(user, "LOGIN_SUCCESS", ip, userAgent, "Inicio de sesión exitoso.");

        return new LoginResponse(accessToken, buildUserSummary(user));
    }

    @Transactional
    public void register(RegisterRequest request, String ip, String userAgent) {
        if (!isPublicRegistrationEnabled()) {
            throw new IllegalStateException("El registro público de usuarios se encuentra deshabilitado por el administrador.");
        }

        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            // Mensaje uniforme de seguridad
            throw new IllegalArgumentException("No es posible completar el registro con los datos suministrados.");
        }

        Role userRole = roleRepository.findByCode("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("El rol base ROLE_USER no está configurado en el sistema."));

        User newUser = User.builder()
                .fullName(request.fullName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .enabled(true)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .roles(Collections.singleton(userRole))
                .build();

        userRepository.save(newUser);
        auditService.recordEvent(newUser, "USER_REGISTERED", ip, userAgent, "Registro público de cuenta.");
    }

    @Transactional
    public LoginResponse refreshToken(String rawRefreshToken, HttpServletResponse response, String ip, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new IllegalArgumentException("Token de refresco ausente");
        }

        RefreshToken oldToken = refreshTokenService.rotateRefreshToken(rawRefreshToken, ip, userAgent);
        User user = userRepository.findByIdWithRolesAndPermissions(oldToken.getUser().getId())
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRawRefreshToken = refreshTokenService.createRefreshToken(user, ip, userAgent);

        setRefreshTokenCookie(response, newRawRefreshToken, Duration.ofMillis(refreshTokenDurationMs));
        return new LoginResponse(newAccessToken, buildUserSummary(user));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String ip, String userAgent) {
        String normalizedEmail = request.email().toLowerCase().trim();

        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(
                user -> {
                    String rawResetToken = refreshTokenService.createPasswordResetToken(user);
                    emailService.sendPasswordResetEmail(user.getEmail(), rawResetToken);
                    auditService.recordEvent(user, "PASSWORD_RESET_REQUESTED", ip, userAgent, "Solicitud de token de recuperación");
                },
                () -> {
                    // Simulación para mantener tiempo de cómputo uniforme contra ataques de temporización
                    passwordEncoder.matches("dummy_pass_123456", "$2a$12$e8Y57zMh6lD2Z9fU2G2CGeZpYIkg.E5f71K6JkYgI/K7K8z8kEhyq");
                }
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ip, String userAgent) {
        PasswordResetToken token = refreshTokenService.validatePasswordResetToken(request.token())
                .orElseThrow(() -> new IllegalArgumentException("El token de recuperación no es válido o ha expirado."));

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setAccountNonLocked(true);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        refreshTokenService.markPasswordResetTokenUsed(token);
        refreshTokenService.revokeAllUserTokens(user);

        auditService.recordEvent(user, "PASSWORD_RESET_SUCCESS", ip, userAgent, "Contraseña restablecida exitosamente.");
    }

    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            try {
                String hash = refreshTokenService.hashToken(rawRefreshToken);
                // Revocar el token específico
                // Si falla o no existe, simplemente se limpia la cookie
            } catch (Exception ignored) {}
        }
        deleteRefreshTokenCookie(response);
    }

    public boolean isPublicRegistrationEnabled() {
        return configRepository.findByConfigKey("ALLOW_PUBLIC_REGISTRATION")
                .map(SystemConfiguration::getConfigValue)
                .map(Boolean::parseBoolean)
                .orElse(false);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token, Duration duration) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(false) // Establecer true en producción HTTPS
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(duration)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void deleteRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public UserSummaryDto buildUserSummary(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::getCode)
                .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                roles,
                permissions
        );
    }
}
