package com.medfis.controller;
import com.medfis.dto.ConsentimientoRequest;
import com.medfis.dto.EnviarNotificacionRequest;
import com.medfis.entity.Consentimiento;
import com.medfis.service.ConsentimientoService;
import com.medfis.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api/consentimientos") @RequiredArgsConstructor
public class ConsentimientoController {
    private final ConsentimientoService svc;
    private final EmailService emailService;

    @GetMapping public ResponseEntity<List<Consentimiento>> listar(@RequestParam(required=false) String q) { return ResponseEntity.ok(svc.buscar(q)); }
    @GetMapping("/pendientes") @PreAuthorize("hasAnyRole('MEDICO','ADMINISTRADOR')") public ResponseEntity<List<Consentimiento>> pendientes() { return ResponseEntity.ok(svc.pendientesMedico()); }
    @GetMapping("/{id}") public ResponseEntity<Consentimiento> buscar(@PathVariable UUID id) { return ResponseEntity.ok(svc.buscar(id)); }
    @PostMapping public ResponseEntity<Consentimiento> crear(@Valid @RequestBody ConsentimientoRequest req, Authentication auth) { return ResponseEntity.status(HttpStatus.CREATED).body(svc.crear(req, auth.getName())); }
    @PostMapping("/{id}/aprobar") @PreAuthorize("hasRole('MEDICO')") public ResponseEntity<Consentimiento> aprobar(@PathVariable UUID id, Authentication auth) { return ResponseEntity.ok(svc.aprobar(id, auth.getName())); }
    @PostMapping("/{id}/rechazar") @PreAuthorize("hasRole('MEDICO')") public ResponseEntity<Consentimiento> rechazar(@PathVariable UUID id, @RequestBody Map<String,String> b, Authentication auth) { return ResponseEntity.ok(svc.rechazar(id, b.getOrDefault("motivo","Sin motivo"), auth.getName())); }
    @PatchMapping("/{id}/anular") @PreAuthorize("hasAnyRole('MEDICO','ADMINISTRADOR')") public ResponseEntity<Consentimiento> anular(@PathVariable UUID id) { return ResponseEntity.ok(svc.anular(id)); }
    @GetMapping("/estadisticas") public ResponseEntity<Map<String,Long>> stats() { return ResponseEntity.ok(Map.of("total",svc.countTotal(),"firmados",svc.countFirmados(),"aprobados",svc.countAprobados(),"hoy",svc.countHoy())); }

    /** Envía email con PDF adjunto al paciente y copia a la clínica. */
    @PostMapping("/{id}/enviar-notificacion")
    public ResponseEntity<Map<String,String>> enviarNotificacion(
            @PathVariable UUID id,
            @RequestBody EnviarNotificacionRequest req) {
        Consentimiento c = svc.buscar(id);
        svc.marcarEmailEnviado(id, req.getEmailPaciente());
        emailService.enviarConsentimientoFirmado(c, req.getEmailPaciente(), req.getPdfBase64());
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "mensaje", "Notificación enviada a " + (req.getEmailPaciente() != null ? req.getEmailPaciente() : "clínica")
        ));
    }
}
