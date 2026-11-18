package com.empresa.seguridad.application.dto;

import java.time.LocalDateTime;

public class ReportDtos {

    public record AuditLogDto(
            Long id,
            String action,
            String userEmail,
            String userName,
            String ipAddress,
            String userAgent,
            String details,
            LocalDateTime createdAt
    ) {}

    public record AuditMetricsDto(
            long totalEvents,
            long successfulLogins,
            long failedLogins,
            long blockedLogins,
            long adminActions,
            long passwordResets
    ) {}
}
