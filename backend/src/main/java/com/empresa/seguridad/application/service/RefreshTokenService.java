package com.empresa.seguridad.application.service;

import com.empresa.seguridad.domain.model.PasswordResetToken;
import com.empresa.seguridad.domain.model.RefreshToken;
import com.empresa.seguridad.domain.model.User;
import com.empresa.seguridad.domain.repository.PasswordResetTokenRepository;
import com.empresa.seguridad.domain.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${application.security.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenDurationMs;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String createRefreshToken(User user, String ipAddress, String userAgent) {
        String rawToken = generateSecureRandomToken();
        String hash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hash)
                .expiresAt(Instant.now().plusMillis(refreshTokenDurationMs))
                .revoked(false)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String rawOldToken, String ipAddress, String userAgent) {
        String oldHash = hashToken(rawOldToken);
        RefreshToken oldRefreshToken = refreshTokenRepository.findByTokenHash(oldHash)
                .orElseThrow(() -> new IllegalArgumentException("Sesión no válida o expirada"));

        // Detección de robo de token: Si ya fue reemplazado y se vuelve a presentar, revocar todo
        if (oldRefreshToken.getReplacedAt() != null || oldRefreshToken.isRevoked()) {
            log.warn("ALERTA DE SEGURIDAD: Detección de reutilización de refresh token para usuario: {}. Revocando todas las sesiones.",
                    oldRefreshToken.getUser().getEmail());
            refreshTokenRepository.revokeAllUserTokens(oldRefreshToken.getUser());
            throw new SecurityException("Alerta de seguridad: Posible interceptación de token. Por favor inicie sesión nuevamente.");
        }

        if (oldRefreshToken.isExpired()) {
            oldRefreshToken.setRevoked(true);
            refreshTokenRepository.save(oldRefreshToken);
            throw new IllegalArgumentException("La sesión ha expirado");
        }

        // Marcar como reemplazado
        oldRefreshToken.setReplacedAt(Instant.now());
        oldRefreshToken.setRevoked(true);
        refreshTokenRepository.save(oldRefreshToken);

        return oldRefreshToken;
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllUserTokens(user);
    }

    @Transactional
    public String createPasswordResetToken(User user) {
        // Invalidar tokens previos
        passwordResetTokenRepository.invalidateAllForUser(user);

        String rawToken = generateSecureRandomToken();
        String hash = hashToken(rawToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hash)
                .expiresAt(Instant.now().plusSeconds(900)) // 15 minutos de caducidad
                .used(false)
                .build();

        passwordResetTokenRepository.save(token);
        return rawToken;
    }

    @Transactional(readOnly = true)
    public Optional<PasswordResetToken> validatePasswordResetToken(String rawToken) {
        String hash = hashToken(rawToken);
        return passwordResetTokenRepository.findByTokenHash(hash)
                .filter(PasswordResetToken::isValid);
    }

    @Transactional
    public void markPasswordResetTokenUsed(PasswordResetToken token) {
        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }

    private String generateSecureRandomToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 no disponible", e);
        }
    }
}
