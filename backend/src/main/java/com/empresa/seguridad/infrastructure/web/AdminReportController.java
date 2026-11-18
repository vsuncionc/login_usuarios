package com.empresa.seguridad.infrastructure.web;

import com.empresa.seguridad.application.dto.ReportDtos.AuditLogDto;
import com.empresa.seguridad.application.dto.ReportDtos.AuditMetricsDto;
import com.empresa.seguridad.application.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
public class AdminReportController {

    private final AuditService auditService;

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(auditService.getAuditLogs(action, search, pageable));
    }

    @GetMapping("/metrics")
    public ResponseEntity<AuditMetricsDto> getMetrics() {
        return ResponseEntity.ok(auditService.getMetrics());
    }
}
