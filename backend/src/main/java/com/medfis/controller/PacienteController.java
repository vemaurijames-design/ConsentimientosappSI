package com.medfis.controller;

import com.medfis.entity.HistoriaClinica;
import com.medfis.entity.Paciente;
import com.medfis.service.HistoriaClinicaService;
import com.medfis.service.PacienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService pacienteService;
    private final HistoriaClinicaService historiaClinicaService;

    /** Listar / buscar — cualquier staff autenticado */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Paciente>> listar(
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(pacienteService.listar(q));
    }

    /** Detalle por id */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Paciente> buscar(@PathVariable UUID id) {
        return ResponseEntity.ok(pacienteService.buscarPorId(id));
    }

    /**
     * Datos básicos por documento (para autofill en consentimientos).
     * No expone historia clínica.
     */
    @GetMapping("/doc/{tipoDoc}/{documento}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> porDocumento(
            @PathVariable String tipoDoc,
            @PathVariable String documento
    ) {
        try {
            return ResponseEntity.ok(
                    pacienteService.buscarBasicoPorDocumento(tipoDoc, documento)
            );
        } catch (RuntimeException ex) {
            if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("mensaje", "Paciente no encontrado"));
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", ex.getMessage()));
        }
    }

    /** Alta — solo ADMINISTRADOR o MÉDICO */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
    public ResponseEntity<?> crear(
            @RequestBody Paciente body,
            Authentication auth
    ) {
        try {
            Paciente creado = pacienteService.crear(body, auth);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", ex.getMessage() != null ? ex.getMessage() : "Error al crear"));
        }
    }

    /** Actualizar ficha */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
    public ResponseEntity<?> actualizar(
            @PathVariable UUID id,
            @RequestBody Paciente body,
            Authentication auth
    ) {
        try {
            return ResponseEntity.ok(pacienteService.actualizar(id, body, auth));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", ex.getMessage() != null ? ex.getMessage() : "Error al actualizar"));
        }
    }

    /** Baja lógica */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
    public ResponseEntity<?> desactivar(
            @PathVariable UUID id,
            Authentication auth
    ) {
        try {
            return ResponseEntity.ok(pacienteService.desactivar(id, auth));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", ex.getMessage() != null ? ex.getMessage() : "Error al desactivar"));
        }
    }

    /** Historias clínicas del paciente */
    @GetMapping("/{id}/historias")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<HistoriaClinica>> historias(@PathVariable UUID id) {
        return ResponseEntity.ok(historiaClinicaService.listarPorPaciente(id));
    }
}