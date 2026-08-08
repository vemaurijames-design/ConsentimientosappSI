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
    @PostMapping("/{id}/aprobar") @PreAuthorize("hasAnyRole('MEDICO','ADMINISTRADOR')") public ResponseEntity<Consentimiento> aprobar(@PathVariable UUID id, Authentication auth) { return ResponseEntity.ok(svc.aprobar(id, auth.getName())); }
    @PostMapping("/{id}/rechazar") @PreAuthorize("hasAnyRole('MEDICO','ADMINISTRADOR')") public ResponseEntity<Consentimiento> rechazar(@PathVariable UUID id, @RequestBody Map<String,String> b, Authentication auth) { return ResponseEntity.ok(svc.rechazar(id, b.getOrDefault("motivo","Sin motivo"), auth.getName())); }
    @PatchMapping("/{id}/anular") @PreAuthorize("hasAnyRole('MEDICO','ADMINISTRADOR')") public ResponseEntity<Consentimiento> anular(@PathVariable UUID id) { return ResponseEntity.ok(svc.anular(id)); }
    @PatchMapping("/{id}/pdfurl") public ResponseEntity<Void> pdfUrl(@PathVariable UUID id, @RequestBody Map<String,String> body) { svc.actualizarPdfUrl(id, body.get("pdfUrl")); return ResponseEntity.ok().build(); }
    @GetMapping("/estadisticas") public ResponseEntity<Map<String,Long>> stats() { return ResponseEntity.ok(Map.of("total",svc.countTotal(),"firmados",svc.countFirmados(),"aprobados",svc.countAprobados(),"hoy",svc.countHoy())); }

    /** Guarda el PDF, envía el correo y solo marca enviado si el SMTP respondió OK. */
    @PostMapping("/{id}/enviar-notificacion")
    public ResponseEntity<Map<String, String>> enviarNotificacion(
            @PathVariable UUID id,
            @RequestBody EnviarNotificacionRequest req) {

        // 1) El PDF queda almacenado pase lo que pase con el correo
        Consentimiento c = svc.guardarPdf(id, req.getPdfBase64());

        try {
            // 2) Envío sincrónico: si falla, lanza excepción
            emailService.enviarConsentimientoFirmadoSync(c, req.getEmailPaciente(), req.getPdfBase64());

            // 3) Recién ahora se marca como enviado
            svc.marcarEmailEnviado(id, req.getEmailPaciente());

            return ResponseEntity.ok(Map.of(
                    "status",      "ok",
                    "mensaje",     "Notificacion enviada a " +
                            (req.getEmailPaciente() != null ? req.getEmailPaciente() : "clinica"),
                    "pdfGuardado", "true"
            ));
        } catch (Exception e) {
            svc.marcarEmailError(id, e.getMessage());
            return ResponseEntity.status(502).body(Map.of(
                    "status",      "error",
                    "mensaje",     "El consentimiento y su PDF quedaron guardados, pero el correo no salio",
                    "pdfGuardado", "true",
                    "detalle",     String.valueOf(e.getMessage())
            ));
        }
    }
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable UUID id) {
        Consentimiento c = svc.buscar(id);
        if (c.getPdfBase64() == null || c.getPdfBase64().isBlank()) {
            return ResponseEntity.notFound().build();
        }
        byte[] pdf = java.util.Base64.getDecoder().decode(c.getPdfBase64());
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition",
                        "inline; filename=\"Consentimiento_" + c.getRadicado() + ".pdf\"")
                .body(pdf);
    }
}
