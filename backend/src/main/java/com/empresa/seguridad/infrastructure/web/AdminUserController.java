package com.empresa.seguridad.infrastructure.web;

import com.empresa.seguridad.application.dto.AuthDtos.MessageResponse;
import com.empresa.seguridad.application.dto.UserManagementDtos.*;
import com.empresa.seguridad.application.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<Page<UserDetailDto>> getUsers(@PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<UserDetailDto> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_WRITE') or hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<UserDetailDto> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserDetails adminDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        String adminEmail = adminDetails != null ? adminDetails.getUsername() : "ADMIN";

        return ResponseEntity.ok(userService.createUser(request, adminEmail, ip, userAgent));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE') or hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails adminDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        String adminEmail = adminDetails != null ? adminDetails.getUsername() : "ADMIN";

        userService.deleteUser(id, adminEmail, ip, userAgent);
        return ResponseEntity.ok(new MessageResponse("Usuario eliminado exitosamente por el administrador."));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<UserDetailDto> updateUser(
            @PathVariable UUID id,
            @RequestBody UserUpdateDto dto
    ) {
        return ResponseEntity.ok(userService.updateUser(id, dto));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('USER_WRITE') or hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> resetPasswordByAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody AdminResetPasswordRequest request,
            @AuthenticationPrincipal UserDetails adminDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        String adminEmail = adminDetails != null ? adminDetails.getUsername() : "ADMIN";

        userService.resetUserPasswordByAdmin(id, request.newPassword(), adminEmail, ip, userAgent);
        return ResponseEntity.ok(new MessageResponse("Contraseña restablecida exitosamente por el administrador."));
    }

    @PostMapping("/{id}/send-reset-link")
    @PreAuthorize("hasAuthority('USER_WRITE') or hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<MessageResponse> sendResetLinkByAdmin(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails adminDetails,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        String adminEmail = adminDetails != null ? adminDetails.getUsername() : "ADMIN";

        userService.sendResetLinkByAdmin(id, adminEmail, ip, userAgent);
        return ResponseEntity.ok(new MessageResponse("Enlace de restablecimiento enviado exitosamente al correo del usuario."));
    }

    @PostMapping("/batch-status")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<MessageResponse> batchUpdateStatus(@Valid @RequestBody BatchStatusUpdateRequest request) {
        userService.batchUpdateStatus(request);
        return ResponseEntity.ok(new MessageResponse("Estados de usuario actualizados por lote exitosamente."));
    }

    @PostMapping("/batch-roles")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public ResponseEntity<MessageResponse> batchAssignRoles(@Valid @RequestBody BatchRoleAssignmentRequest request) {
        userService.batchAssignRoles(request);
        return ResponseEntity.ok(new MessageResponse("Roles asignados por lote exitosamente."));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAnyAuthority('ROLE_MANAGE', 'USER_READ')")
    public ResponseEntity<List<RoleDto>> getAllRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }
}
