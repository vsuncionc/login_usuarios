package com.empresa.seguridad.infrastructure.web;

import com.empresa.seguridad.application.dto.AuthDtos.*;
import com.empresa.seguridad.application.service.AuthService;
import com.empresa.seguridad.application.service.RateLimiterService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiterService;

    @Value("${application.security.jwt.cookie-name:app_refresh_token}")
    private String cookieName;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String clientIp = getClientIp(httpRequest);
        if (!rateLimiterService.isAllowed("login:" + clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new LoginResponse(null, null));
        }

        LoginResponse response = authService.authenticate(
                request,
                httpResponse,
                clientIp,
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        if (!rateLimiterService.isAllowed("register:" + clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new MessageResponse("Demasiadas solicitudes. Por favor intente más tarde."));
        }

        authService.register(request, clientIp, httpRequest.getHeader("User-Agent"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("Usuario registrado exitosamente. Ahora puede iniciar sesión."));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String refreshToken = extractCookie(httpRequest, cookieName);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LoginResponse response = authService.refreshToken(
                refreshToken,
                httpResponse,
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        if (!rateLimiterService.isAllowed("forgot-password:" + clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new MessageResponse("Demasiadas solicitudes. Por favor intente más tarde."));
        }

        // Siempre retorna mensaje neutro para prevenir enumeración de cuentas de correo
        authService.forgotPassword(request, clientIp, httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(new MessageResponse(
                "Si la dirección de correo electrónico está registrada en nuestro sistema, recibirá un enlace con instrucciones para restablecer su contraseña."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        authService.resetPassword(request, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(new MessageResponse("Contraseña actualizada exitosamente. Inicie sesión con su nueva clave."));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String refreshToken = extractCookie(httpRequest, cookieName);
        authService.logout(refreshToken, httpResponse);
        return ResponseEntity.ok(new MessageResponse("Sesión cerrada correctamente."));
    }

    @GetMapping("/registration-status")
    public ResponseEntity<RegistrationStatusResponse> getRegistrationStatus() {
        boolean enabled = authService.isPublicRegistrationEnabled();
        return ResponseEntity.ok(new RegistrationStatusResponse(enabled));
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
