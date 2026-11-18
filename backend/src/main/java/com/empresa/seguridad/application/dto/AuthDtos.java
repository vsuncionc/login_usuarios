package com.empresa.seguridad.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;
import java.util.UUID;

public class AuthDtos {

    public record LoginRequest(
            @NotBlank(message = "El correo electrónico es requerido")
            @Email(message = "El formato de correo es inválido")
            String email,

            @NotBlank(message = "La contraseña es requerida")
            String password
    ) {}

    public record LoginResponse(
            String accessToken,
            UserSummaryDto user
    ) {}

    public record RegisterRequest(
            @NotBlank(message = "El nombre completo es requerido")
            @Size(min = 3, max = 120, message = "El nombre debe tener entre 3 y 120 caracteres")
            String fullName,

            @NotBlank(message = "El correo electrónico es requerido")
            @Email(message = "El formato de correo es inválido")
            String email,

            @NotBlank(message = "La contraseña es requerida")
            @Size(min = 8, max = 64, message = "La contraseña debe tener entre 8 y 64 caracteres")
            @Pattern(
                    regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).*$",
                    message = "La contraseña debe contener al menos un dígito, una minúscula, una mayúscula y un carácter especial"
            )
            String password
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "El correo electrónico es requerido")
            @Email(message = "El formato de correo es inválido")
            String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "El token de recuperación es requerido")
            String token,

            @NotBlank(message = "La nueva contraseña es requerida")
            @Size(min = 8, max = 64, message = "La contraseña debe tener entre 8 y 64 caracteres")
            @Pattern(
                    regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).*$",
                    message = "La contraseña debe contener al menos un dígito, una minúscula, una mayúscula y un carácter especial"
            )
            String newPassword
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "La contraseña actual es requerida")
            String currentPassword,

            @NotBlank(message = "La nueva contraseña es requerida")
            @Size(min = 8, max = 64, message = "La nueva contraseña debe tener entre 8 y 64 caracteres")
            @Pattern(
                    regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._-]).*$",
                    message = "La nueva contraseña debe contener al menos un dígito, una minúscula, una mayúscula y un carácter especial"
            )
            String newPassword
    ) {}

    public record UserSummaryDto(
            UUID id,
            String email,
            String fullName,
            Set<String> roles,
            Set<String> permissions
    ) {}

    public record MessageResponse(
            String message
    ) {}

    public record RegistrationStatusResponse(
            boolean registrationEnabled
    ) {}
}
