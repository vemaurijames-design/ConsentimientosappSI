package com.medfis.controller;

import com.medfis.entity.HistoriaClinica;
import com.medfis.service.HistoriaClinicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/historias")
@RequiredArgsConstructor
public class HistoriaClinicaController {

    private final HistoriaClinicaService historiaClinicaService;

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HistoriaClinica> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(historiaClinicaService.buscarPorId(id));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> crear(
            @RequestBody HistoriaClinica body,
            Authentication auth
    ) {
        try {
            HistoriaClinica creada = historiaClinicaService.crear(body, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (RuntimeException ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "Error al crear evolución";
            if (msg.toLowerCase().contains("permiso")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("mensaje", msg));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", msg));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> actualizar(
            @PathVariable UUID id,
            @RequestBody HistoriaClinica body,
            Authentication auth
    ) {
        try {
            return ResponseEntity.ok(historiaClinicaService.actualizar(id, body, auth));
        } catch (RuntimeException ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "Error al actualizar";
            if (msg.toLowerCase().contains("permiso")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("mensaje", msg));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", msg));
        }
    }
}