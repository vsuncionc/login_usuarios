package com.empresa.seguridad.infrastructure.config;

import com.empresa.seguridad.domain.model.AuditLog;
import com.empresa.seguridad.domain.model.Permission;
import com.empresa.seguridad.domain.model.Role;
import com.empresa.seguridad.domain.model.SystemConfiguration;
import com.empresa.seguridad.domain.model.User;
import com.empresa.seguridad.domain.repository.AuditLogRepository;
import com.empresa.seguridad.domain.repository.PermissionRepository;
import com.empresa.seguridad.domain.repository.RoleRepository;
import com.empresa.seguridad.domain.repository.SystemConfigurationRepository;
import com.empresa.seguridad.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final SystemConfigurationRepository configRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            log.info("Base de datos ya inicializada.");
            return;
        }

        log.info("Iniciando carga de datos semilla para H2 Database...");

        // 1. Configuraciones de Sistema
        initConfigurations();

        // 2. Permisos Atómicos
        Map<String, Permission> permissions = initPermissions();

        // 3. Roles del Sistema
        Map<String, Role> roles = initRoles(permissions);

        // 4. Usuarios Iniciales
        Map<String, User> users = initUsers(roles);

        // 5. Auditorías Iniciales para Reportes
        initAuditLogs(users);

        log.info("✅ Inicialización de datos semilla completada con éxito en H2.");
    }

    private void initConfigurations() {
        createConfigIfAbsent("ALLOW_PUBLIC_REGISTRATION", "true", "Habilita o deshabilita el autorregistro público de usuarios.");
        createConfigIfAbsent("MAX_FAILED_LOGIN_ATTEMPTS", "5", "Máximo de intentos fallidos antes de bloquear la cuenta.");
        createConfigIfAbsent("ACCOUNT_LOCK_DURATION_MINUTES", "15", "Duración en minutos del bloqueo por intentos fallidos.");
    }

    private void createConfigIfAbsent(String key, String value, String description) {
        if (configRepository.findByConfigKey(key).isEmpty()) {
            configRepository.save(SystemConfiguration.builder()
                    .configKey(key)
                    .configValue(value)
                    .description(description)
                    .build());
        }
    }

    private Map<String, Permission> initPermissions() {
        Map<String, Permission> map = new HashMap<>();
        List<Permission> list = List.of(
                Permission.builder().code("USER_READ").resource("USER").action("READ").description("Consultar información de usuarios").build(),
                Permission.builder().code("USER_WRITE").resource("USER").action("WRITE").description("Crear y actualizar usuarios").build(),
                Permission.builder().code("USER_DELETE").resource("USER").action("DELETE").description("Eliminar o desactivar usuarios").build(),
                Permission.builder().code("ROLE_MANAGE").resource("ROLE").action("WRITE").description("Administrar roles y privilegios").build(),
                Permission.builder().code("CONFIG_MANAGE").resource("SYSTEM_CONFIG").action("WRITE").description("Modificar configuraciones globales").build(),
                Permission.builder().code("AUDIT_VIEW").resource("AUDIT").action("READ").description("Visualizar auditorías del sistema").build()
        );
        for (Permission p : list) {
            map.put(p.getCode(), permissionRepository.save(p));
        }
        return map;
    }

    private Map<String, Role> initRoles(Map<String, Permission> permissions) {
        Map<String, Role> map = new HashMap<>();

        // SUPER ADMIN con todos los permisos
        Role superAdmin = Role.builder()
                .code("ROLE_SUPER_ADMIN")
                .name("Super Administrador")
                .description("Control total sobre el sistema y configuración")
                .isSystemRole(true)
                .permissions(new HashSet<>(permissions.values()))
                .build();
        map.put(superAdmin.getCode(), roleRepository.save(superAdmin));

        // ADMIN con permisos operativos
        Set<Permission> adminPerms = new HashSet<>();
        adminPerms.add(permissions.get("USER_READ"));
        adminPerms.add(permissions.get("USER_WRITE"));
        adminPerms.add(permissions.get("AUDIT_VIEW"));

        Role admin = Role.builder()
                .code("ROLE_ADMIN")
                .name("Administrador")
                .description("Gestión de cuentas de usuarios y consulta de auditoría")
                .isSystemRole(true)
                .permissions(adminPerms)
                .build();
        map.put(admin.getCode(), roleRepository.save(admin));

        // USER: Usuario (acceso a Mi Perfil)
        Role userRole = Role.builder()
                .code("ROLE_USER")
                .name("Usuario")
                .description("Acceso a perfil personal y cambio de contraseña")
                .isSystemRole(true)
                .permissions(new HashSet<>())
                .build();
        map.put(userRole.getCode(), roleRepository.save(userRole));

        // STANDARD: Usuario Estándar (ningún acceso a opciones del menú)
        Role standardRole = Role.builder()
                .code("ROLE_STANDARD")
                .name("Usuario Estándar")
                .description("Usuario básico sin acceso a opciones del menú")
                .isSystemRole(true)
                .permissions(new HashSet<>())
                .build();
        map.put(standardRole.getCode(), roleRepository.save(standardRole));

        // EDITOR (Diseño 4)
        Role editor = Role.builder()
                .code("ROLE_EDITOR")
                .name("Editor")
                .description("Edición y gestión de contenidos")
                .isSystemRole(false)
                .permissions(Set.of(permissions.get("USER_READ"), permissions.get("USER_WRITE")))
                .build();
        map.put(editor.getCode(), roleRepository.save(editor));

        // VISUALIZADOR (Diseño 4)
        Role visualizer = Role.builder()
                .code("ROLE_VISUALIZADOR")
                .name("Visualizador")
                .description("Consulta y visualización de reportes")
                .isSystemRole(false)
                .permissions(Set.of(permissions.get("USER_READ")))
                .build();
        map.put(visualizer.getCode(), roleRepository.save(visualizer));

        // ANALISTA (Diseño 3)
        Role analista = Role.builder()
                .code("ROLE_ANALISTA")
                .name("Analista")
                .description("Análisis de datos, métricas y auditoría")
                .isSystemRole(false)
                .permissions(Set.of(permissions.get("USER_READ"), permissions.get("AUDIT_VIEW")))
                .build();
        map.put(analista.getCode(), roleRepository.save(analista));

        return map;
    }

    private Map<String, User> initUsers(Map<String, Role> roles) {
        Map<String, User> map = new HashMap<>();

        // 1. Super Administrador Empresarial
        User superAdmin = User.builder()
                .email("admin@empresa.com")
                .fullName("Super Administrador")
                .passwordHash(passwordEncoder.encode("Admin$Tr0ng_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_SUPER_ADMIN"), roles.get("ROLE_ADMIN")))
                .build();
        map.put("admin", userRepository.save(superAdmin));

        // 2. Juan Pérez (Diseño 4)
        User juan = User.builder()
                .email("juan@empresa.com")
                .fullName("Juan Pérez")
                .passwordHash(passwordEncoder.encode("Juan$Perez_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_ADMIN")))
                .build();
        map.put("juan", userRepository.save(juan));

        // 3. María López (Diseño 4)
        User maria = User.builder()
                .email("maria@empresa.com")
                .fullName("María López")
                .passwordHash(passwordEncoder.encode("Maria$Lopez_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_EDITOR")))
                .build();
        map.put("maria", userRepository.save(maria));

        // 4. Carlos Ruiz (Diseño 4)
        User carlos = User.builder()
                .email("carlos@empresa.com")
                .fullName("Carlos Ruiz")
                .passwordHash(passwordEncoder.encode("Carlos$Ruiz_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_VISUALIZADOR")))
                .build();
        map.put("carlos", userRepository.save(carlos));

        // 5. Ana García López (Diseño 3)
        User ana = User.builder()
                .email("nuevo@empresa.com")
                .fullName("Ana García López")
                .passwordHash(passwordEncoder.encode("Ana$Garcia_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_ANALISTA")))
                .build();
        map.put("ana", userRepository.save(ana));

        // 6. Usuario (Rol: Usuario - Acceso exclusivo a Mi Perfil)
        User regularUser = User.builder()
                .email("usuario@empresa.com")
                .fullName("Usuario Regular")
                .passwordHash(passwordEncoder.encode("User$Pass_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_USER")))
                .build();
        map.put("regular", userRepository.save(regularUser));

        // 7. Usuario Estándar (Rol: Usuario Estándar - Ningún acceso a opciones del menú)
        User standardUser = User.builder()
                .email("estandar@empresa.com")
                .fullName("Usuario Estándar")
                .passwordHash(passwordEncoder.encode("Estandar$Pass_2026!"))
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(roles.get("ROLE_STANDARD")))
                .build();
        map.put("standard", userRepository.save(standardUser));

        log.info("✅ Usuarios iniciales creados exitosamente en H2.");
        return map;
    }

    private void initAuditLogs(Map<String, User> users) {
        LocalDateTime now = LocalDateTime.now();

        List<AuditLog> initialLogs = List.of(
                AuditLog.builder()
                        .user(users.get("admin"))
                        .action("LOGIN_SUCCESS")
                        .ipAddress("192.168.1.10")
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0")
                        .details("Inicio de sesión corporativo exitoso con token Bearer")
                        .createdAt(now.minusHours(4))
                        .build(),
                AuditLog.builder()
                        .user(users.get("juan"))
                        .action("LOGIN_SUCCESS")
                        .ipAddress("192.168.1.15")
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0")
                        .details("Acceso administrativo de Juan Pérez al portal")
                        .createdAt(now.minusHours(3).minusMinutes(25))
                        .build(),
                AuditLog.builder()
                        .user(users.get("admin"))
                        .action("ADMIN_USER_CREATED")
                        .ipAddress("192.168.1.10")
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .details("Alta administrativa de usuario 'Ana García López' con rol ROLE_ANALISTA")
                        .createdAt(now.minusHours(2).minusMinutes(45))
                        .build(),
                AuditLog.builder()
                        .user(users.get("juan"))
                        .action("ADMIN_PASSWORD_RESET")
                        .ipAddress("192.168.1.15")
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .details("Restablecimiento directo de contraseña para usuario 'maria@empresa.com'")
                        .createdAt(now.minusHours(1).minusMinutes(50))
                        .build(),
                AuditLog.builder()
                        .user(null)
                        .action("LOGIN_FAILED")
                        .ipAddress("203.0.113.45")
                        .userAgent("Mozilla/5.0 (X11; Linux x86_64)")
                        .details("Intento fallido con credenciales erróneas para 'desconocido@empresa.com'")
                        .createdAt(now.minusMinutes(40))
                        .build(),
                AuditLog.builder()
                        .user(null)
                        .action("LOGIN_BLOCKED")
                        .ipAddress("198.51.100.89")
                        .userAgent("Python-urllib/3.10")
                        .details("Bloqueo de seguridad: excedido umbral de 5 intentos fallidos consecutivos")
                        .createdAt(now.minusMinutes(30))
                        .build(),
                AuditLog.builder()
                        .user(users.get("admin"))
                        .action("CONFIG_UPDATED")
                        .ipAddress("192.168.1.10")
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .details("Actualización de políticas de seguridad: habilitado autorregistro y bloqueo 15 min")
                        .createdAt(now.minusMinutes(15))
                        .build(),
                AuditLog.builder()
                        .user(users.get("carlos"))
                        .action("LOGIN_SUCCESS")
                        .ipAddress("192.168.1.28")
                        .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
                        .details("Inicio de sesión de Carlos Ruiz para consulta de métricas")
                        .createdAt(now.minusMinutes(5))
                        .build()
        );

        auditLogRepository.saveAll(initialLogs);
        log.info("✅ Eventos de auditoría semilla cargados exitosamente.");
    }
}
