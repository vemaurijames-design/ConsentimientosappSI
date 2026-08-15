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
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    private final JavaMailSender mailSender;

    @Value("${medfis.mail.from}")
    private String from;

    @Value("${medfis.mail.copy-to}")
    private String copyTo;

    @PostMapping("/enviar-consentimiento")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'MEDICO', 'AUXILIAR')")
    public ResponseEntity<Map<String, String>> enviarConsentimiento(@RequestBody Map<String, String> body) {
        try {
            String to = body.get("emailPaciente");
            String nombrePaciente = body.get("nombrePaciente");
            String radicado = body.get("radicado");
            String tipo = body.get("tipo");
            String fecha = body.get("fecha");

            if (to == null || to.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El email del paciente es requerido"));
            }

            String subject = "Consentimiento Informado - " + radicado;
            String bodyText = "Estimado/a " + nombrePaciente + ",\n\n" +
                    "Adjunto encontrará su consentimiento informado para el procedimiento de " + tipo + ".\n\n" +
                    "Radicado: " + radicado + "\n" +
                    "Fecha: " + fecha + "\n\n" +
                    "Si tiene alguna duda, comuníquese con la clínica.\n\n" +
                    "Salud Intensa Med y Fis IPS\n" +
                    "Tel: +57 311 404 8112\n" +
                    "Email: saludintensaconsentimientos@gmail.com";

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setCc(copyTo);
            message.setSubject(subject);
            message.setText(bodyText);
            mailSender.send(message);

            return ResponseEntity.ok(Map.of("status", "enviado", "to", to, "radicado", radicado));

        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", e.getMessage()));
        }
    }
}