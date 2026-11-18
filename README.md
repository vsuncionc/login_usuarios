# MÓDULO EMPRESARIAL DE AUTENTICACIÓN Y AUTORIZACIÓN (IAM)
### Arquitectura Clean / RUP con Spring Boot 3.3, Base de Datos H2 y Angular 18+ Material

---

## 🚀 1. Estructura del Proyecto

El proyecto está organizado en dos componentes desacoplados listos para ejecución y desarrollo:

```
d:/MI_ESPACIO_IA/08/
├── backend/                       # API REST Spring Boot 3.3.5 (Java 17, Spring Security 6, JPA, H2)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/empresa/seguridad/
│       │   ├── domain/model/      # Entidades JPA (User, Role, Permission, RefreshToken, ResetToken, etc.)
│       │   ├── domain/repository/ # Repositorios Spring Data JPA con consultas JOIN FETCH sin N+1
│       │   ├── application/dto/   # DTOs inmutables (Java Records) y Bean Validation
│       │   ├── application/service/# Lógica de negocio (AuthService, UserService, RefreshTokenService)
│       │   ├── infrastructure/
│       │   │   ├── config/        # SecurityConfig (Lambda DSL), CacheConfig (Caffeine), DataInitializer
│       │   │   ├── security/      # JwtService, JwtAuthenticationFilter, CustomUserDetailsService
│       │   │   └── web/           # Controladores REST (/api/v1/auth, /profile, /admin)
│       └── main/resources/
│           └── application.yml    # Configuración de H2 en memoria, JWT, Cors y Rate Limiting
│
├── frontend/                      # Cliente SPA Angular 18+ Standalone con Angular Material
│   ├── package.json
│   └── src/app/
│       ├── core/
│       │   ├── guards/            # authGuard, roleGuard
│       │   ├── interceptors/      # authInterceptor (Bearer Token + Silent Refresh mutex)
│       │   ├── models/            # Interfaces TypeScript
│       │   └── services/          # AuthService (Signals reactivos, state management)
│       └── features/
│           ├── auth/              # Login, Register, Forgot & Reset Password
│           ├── dashboard/         # Panel Principal con KPIs y accesos recientes
│           ├── users/             # Gestión de Usuarios y Registro Administrativo
│           ├── roles/             # Módulo de Roles y Permisos (RBAC y matriz de privilegios)
│           ├── config/            # Módulo de Configuración Global y Políticas de Seguridad
│           └── profile/           # Mi Perfil (detalles de usuario y cambio seguro de clave)
│
├── run-backend.bat                # Script de inicio directo del Backend en Windows
├── run-frontend.bat               # Script de inicio directo del Frontend en Windows
├── DOCUMENTACION_ARQUITECTURA_RUP.md # Documento de Arquitectura de Software y Prompts RUP
└── MODELO_DE_DATOS_RUP.md         # Modelo Conceptual, Lógico, Físico y DDL RUP
```

---

## ⚙️ 2. Cómo Ejecutar el Proyecto

### 2.1. Iniciar el Backend (Spring Boot + Base de Datos H2)
Haz doble clic en `run-backend.bat` o ejecuta desde PowerShell/CMD:
```powershell
cd d:\MI_ESPACIO_IA\08\backend
$env:JAVA_HOME="C:\Program Files\Amazon Corretto\jdk17.0.11_9"
mvn spring-boot:run
```
El servidor backend iniciará en el puerto **8080**.

#### Acceso a la Consola H2 en Memoria:
- **URL:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- **JDBC URL:** `jdbc:h2:mem:seguridad_db`
- **User Name:** `sa`
- **Password:** *(dejar en blanco)*

---

### 2.2. Iniciar el Frontend (Angular Material)
Haz doble clic en `run-frontend.bat` o ejecuta desde PowerShell/CMD:
```powershell
cd d:\MI_ESPACIO_IA\08\frontend
npm start
```
Abre tu navegador en: [http://localhost:4200](http://localhost:4200)

---

## 🔑 3. Cuentas de Acceso Preconfiguradas (Seed Data)

El sistema precarga automáticamente dos usuarios de prueba en la base de datos H2 mediante `DataInitializer`:

| Rol | Correo Electrónico | Contraseña | Privilegios |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@empresa.com` | `Admin$Tr0ng_2026!` | Acceso irrestricto, Panel de Administración, Operaciones Batch, Modificación de configuraciones de registro y auditoría. |
| **Usuario Estándar** | `usuario@empresa.com` | `User$Pass_2026!` | Acceso a portal personal, consulta de perfil y cambio seguro de contraseña. |

---

## 🛡️ 4. Características de Seguridad Implementadas

1. **Spring Security 6 con Lambda DSL:**
   - Exclusivamente expresiones funcionales (`csrf`, `cors`, `sessionManagement`, `authorizeHttpRequests`).
   - Sin clases obsoletas ni adaptadores heredados.
2. **Dual-Token & HttpOnly Cookies:**
   - **Access Token:** De corta duración (15 minutos), almacenado en memoria mediante Signals.
   - **Refresh Token:** Rotativo (7 días), almacenado en cookie `HttpOnly; SameSite=Strict`. Detecta reutilización de tokens y revoca sesiones automáticamente si detecta un posible robo.
3. **Protección Anti-Enumeración (Timing-Safe):**
   - El endpoint de recuperación de contraseñas responde con mensaje uniforme constante e iguala el tiempo de cómputo para correos existentes o inexistentes.
4. **Rate Limiting & Bloqueo por Fuerza Bruta:**
   - Algoritmo Token Bucket que limita los intentos de login/registro a 10 peticiones/minuto por IP.
   - Bloqueo automático de cuenta por 15 minutos tras 5 intentos fallidos consecutivos.
5. **Registro Configurable por Administrador:**
   - El interruptor en el Panel Administrativo activa o desactiva en caliente el autorregistro público (`ALLOW_PUBLIC_REGISTRATION`).
6. **Optimización de Consultas JPA y Caching:**
   - Consultas con `JOIN FETCH` y `@EntityGraph` que eliminan el problema $N+1$.
   - Soporte de operaciones por lotes (*Batching*) para habilitación/deshabilitación masiva de usuarios.
   - Caché L2 con **Caffeine** para permisos de roles.
7. **Reseteo Administrativo de Contraseñas (RF-13):**
   - El Administrador (`ROLE_ADMIN` / `ROLE_SUPER_ADMIN`) puede resetear directamente la contraseña de cualquier usuario o enviarle un enlace de recuperación de 15 min.
   - Cuenta con generador aleatorio de claves fuertes, encriptación en BCrypt (coste 12), desbloqueo inmediato de cuenta y revocación forzada de sesiones activas concurrentes para máxima seguridad.
