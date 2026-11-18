package com.empresa.seguridad.application.service;

import com.empresa.seguridad.application.dto.ReportDtos;
import com.empresa.seguridad.domain.model.AuditLog;
import com.empresa.seguridad.domain.model.User;
import com.empresa.seguridad.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(User user, String action, String ipAddress, String userAgent, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .details(details)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Auditoría [{}]: usuario={} IP={}", action, user != null ? user.getEmail() : "ANONYMOUS", ipAddress);
        } catch (Exception e) {
            log.error("Error al registrar auditoría de seguridad: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<ReportDtos.AuditLogDto> getAuditLogs(String action, String search, Pageable pageable) {
        String cleanAction = (action != null && !action.isBlank() && !"ALL".equalsIgnoreCase(action)) ? action.trim() : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        return auditLogRepository.searchAuditLogs(cleanAction, cleanSearch, pageable)
                .map(logEntry -> new ReportDtos.AuditLogDto(
                        logEntry.getId(),
                        logEntry.getAction(),
                        logEntry.getUser() != null ? logEntry.getUser().getEmail() : "ANONYMOUS",
                        logEntry.getUser() != null ? logEntry.getUser().getFullName() : "Sistema / Desconocido",
                        logEntry.getIpAddress(),
                        logEntry.getUserAgent(),
                        logEntry.getDetails(),
                        logEntry.getCreatedAt()
                ));
    }

    @Transactional(readOnly = true)
    public ReportDtos.AuditMetricsDto getMetrics() {
        long total = auditLogRepository.count();
        long successLogins = auditLogRepository.countByAction("LOGIN_SUCCESS");
        long failedLogins = auditLogRepository.countByAction("LOGIN_FAILED");
        long blockedLogins = auditLogRepository.countByAction("LOGIN_BLOCKED");
        long adminActions = auditLogRepository.countByAction("ADMIN_USER_CREATED")
                + auditLogRepository.countByAction("ADMIN_USER_DELETED")
                + auditLogRepository.countByAction("CONFIG_UPDATED")
                + auditLogRepository.countByAction("ROLE_CREATED")
                + auditLogRepository.countByAction("ROLE_UPDATED")
                + auditLogRepository.countByAction("ROLE_DELETED");
        long passwordResets = auditLogRepository.countByAction("ADMIN_PASSWORD_RESET")
                + auditLogRepository.countByAction("PASSWORD_RESET");

        return new ReportDtos.AuditMetricsDto(
                total,
                successLogins,
                failedLogins,
                blockedLogins,
                adminActions,
                passwordResets
        );
    }
}
