package com.empresa.seguridad.application.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class SystemConfigDto {

    public record ConfigDto(
            String key,
            String value,
            String description,
            LocalDateTime updatedAt
    ) {}

    public record UpdateConfigRequest(
            @NotBlank(message = "El valor no puede estar vacío")
            String value
    ) {}
}
