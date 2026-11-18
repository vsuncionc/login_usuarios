package com.empresa.seguridad.infrastructure.web;

import com.empresa.seguridad.application.dto.AuthDtos.MessageResponse;
import com.empresa.seguridad.application.dto.SystemConfigDto.ConfigDto;
import com.empresa.seguridad.application.dto.SystemConfigDto.UpdateConfigRequest;
import com.empresa.seguridad.application.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/config")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('CONFIG_MANAGE')")
public class AdminConfigController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<ConfigDto>> getConfigs() {
        return ResponseEntity.ok(userService.getAllConfigs());
    }

    @PutMapping("/{key}")
    public ResponseEntity<MessageResponse> updateConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateConfigRequest request
    ) {
        userService.updateConfig(key, request.value(), null);
        return ResponseEntity.ok(new MessageResponse("Parámetro de configuración actualizado correctamente."));
    }
}
