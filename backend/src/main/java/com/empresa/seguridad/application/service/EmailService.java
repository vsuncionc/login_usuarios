package com.empresa.seguridad.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        log.info("=================================================================");
        log.info("📧 [NOTIFICACIÓN POR CORREO - RECUPERACIÓN DE CONTRASEÑA]");
        log.info("Para: {}", toEmail);
        log.info("Asunto: Solicitud de Restablecimiento de Contraseña");
        log.info("Token de Recuperación (15 minutos de validez):");
        log.info(">>> {} <<<", resetToken);
        log.info("URL de frontend: http://localhost:4200/auth/reset-password?token={}", resetToken);
        log.info("=================================================================");
    }
}
