package com.medfis.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailTestController {

    private final JavaMailSender mailSender;

    @Value("${medfis.mail.from}")
    private String from;

    @Value("${medfis.mail.copy-to}")
    private String copyTo;

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, String>> test(
            @RequestBody(required = false) Map<String, String> body) {

        // Destinatario
        String destino = (body != null && body.get("to") != null)
                ? body.get("to") : copyTo;

        // Datos del paciente
        String nombrePaciente    = getValue(body, "nombrePaciente",    "No especificado");
        String identificacion    = getValue(body, "identificacion",    "No especificado");
        String fechaNacimiento   = getValue(body, "fechaNacimiento",   "No especificada");
        String telefono          = getValue(body, "telefono",          "No especificado");
        String numeroConsentimiento = getValue(body, "numeroConsentimiento", "No especificado");
        String tipoConsentimiento   = getValue(body, "tipoConsentimiento",   "No especificado");
        String fechaFirma           = getValue(body, "fechaFirma",           "No especificada");

        // Cuerpo del correo
        String cuerpo = """
                =========================================
                  SALUD INTENSA MED Y FIS IPS
                  Consentimiento Informado
                =========================================

                DATOS DEL PACIENTE:
                  Nombre completo : %s
                  Identificacion  : %s
                  Fecha nacimiento: %s
                  Telefono        : %s

                DATOS DEL CONSENTIMIENTO:
                  Numero          : %s
                  Tipo            : %s
                  Fecha de firma  : %s

                =========================================
                Este correo es generado automaticamente.
                Por favor no responda a este mensaje.
                =========================================
                """.formatted(
                nombrePaciente,
                identificacion,
                fechaNacimiento,
                telefono,
                numeroConsentimiento,
                tipoConsentimiento,
                fechaFirma
        );

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(destino);
            msg.setCc(copyTo);
            msg.setSubject("Consentimiento N° " + numeroConsentimiento + " - " + nombrePaciente);
            msg.setText(cuerpo);
            mailSender.send(msg);

            return ResponseEntity.ok(Map.of(
                    "status",    "ok",
                    "enviadoA",  destino,
                    "desde",     from,
                    "consentimiento", numeroConsentimiento
            ));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "status",  "error",
                    "tipo",    e.getClass().getSimpleName(),
                    "detalle", String.valueOf(e.getMessage())
            ));
        }
    }

    // Helper para evitar NullPointerException
    private String getValue(Map<String, String> body, String key, String defaultValue) {
        if (body == null || body.get(key) == null || body.get(key).isBlank()) {
            return defaultValue;
        }
        return body.get(key);
    }
}