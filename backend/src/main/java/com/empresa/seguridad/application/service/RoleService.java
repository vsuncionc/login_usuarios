package com.empresa.seguridad.application.service;

import com.empresa.seguridad.application.dto.UserManagementDtos.*;
import com.empresa.seguridad.domain.model.Permission;
import com.empresa.seguridad.domain.model.Role;
import com.empresa.seguridad.domain.repository.PermissionRepository;
import com.empresa.seguridad.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAllWithPermissions().stream()
                .map(this::mapToRoleDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(p -> new PermissionDto(p.getId(), p.getCode(), p.getResource(), p.getAction(), p.getDescription()))
                .sorted(Comparator.comparing(PermissionDto::resource).thenComparing(PermissionDto::action))
                .toList();
    }

    @Transactional
    @CacheEvict(value = "user_authorities", allEntries = true)
    public RoleDto createRole(CreateRoleRequest request) {
        String code = request.code().toUpperCase().trim();
        if (roleRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("Ya existe un rol registrado con el código: " + code);
        }

        Set<Permission> perms = new HashSet<>();
        if (request.permissions() != null && !request.permissions().isEmpty()) {
            perms = permissionRepository.findByCodeIn(request.permissions());
        }

        Role newRole = Role.builder()
                .code(code)
                .name(request.name().trim())
                .description(request.description() != null ? request.description().trim() : "")
                .isSystemRole(false)
                .permissions(perms)
                .build();

        Role saved = roleRepository.save(newRole);
        return mapToRoleDto(saved);
    }

    @Transactional
    @CacheEvict(value = "user_authorities", allEntries = true)
    public RoleDto updateRole(UUID id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));

        role.setName(request.name().trim());
        if (request.description() != null) {
            role.setDescription(request.description().trim());
        }

        if (request.permissions() != null) {
            Set<Permission> perms = permissionRepository.findByCodeIn(request.permissions());
            role.setPermissions(perms);
        }

        Role updated = roleRepository.save(role);
        return mapToRoleDto(updated);
    }

    @Transactional
    @CacheEvict(value = "user_authorities", allEntries = true)
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));

        if (role.isSystemRole()) {
            throw new IllegalStateException("No se puede eliminar el rol del sistema '" + role.getName() + "' por políticas de integridad.");
        }

        roleRepository.delete(role);
    }

    private RoleDto mapToRoleDto(Role role) {
        Set<String> perms = role.getPermissions() != null
                ? role.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet())
                : Collections.emptySet();

        return new RoleDto(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.isSystemRole(),
                perms
        );
    }
}
