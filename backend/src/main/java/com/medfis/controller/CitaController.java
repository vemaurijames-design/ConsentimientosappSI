package com.medfis.controller;

import com.medfis.dto.CitaResponse;
import com.medfis.entity.Cita;
import com.medfis.service.CitaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CitaResponse>> porFecha(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return ResponseEntity.ok(citaService.listarPorFecha(fecha));
    }

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CitaResponse>> porPaciente(@PathVariable UUID pacienteId) {
        return ResponseEntity.ok(citaService.listarPorPaciente(pacienteId));
    }

    @GetMapping("/recordatorios")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CitaResponse>> recordatorios(
            @RequestParam(defaultValue = "1") int dias
    ) {
        return ResponseEntity.ok(
                citaService.listarPorFecha(LocalDate.now().plusDays(dias))
        );
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> crear(@RequestBody Cita body, Authentication auth) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(citaService.crear(body, auth));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','AUXILIAR','ENFERMERA','TECNICO')")
    public ResponseEntity<?> cambiarEstado(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        try {
            String estado = body.get("estado");
            String obs = body.get("observacion");
            if (obs == null) obs = body.get("observacionEstado");
            return ResponseEntity.ok(
                    citaService.cambiarEstado(id, estado, obs, auth)
            );
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", ex.getMessage()));
        }
    }
}