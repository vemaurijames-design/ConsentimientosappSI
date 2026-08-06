package com.medfis.service;

import com.medfis.entity.Consentimiento;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${medfis.mail.from}") private String from;
    @Value("${medfis.mail.from-name}") private String fromName;
    @Value("${medfis.mail.copy-to}") private String copyTo;
    @Value("${medfis.nombre-ips:CliniSign}") private String ipsNombre;
    @Value("${medfis.wa.admin:573114048112}") private String waAdmin;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Async
    public void enviarConsentimientoFirmado(Consentimiento c, String emailPaciente, String pdfBase64) {
        try {
            String tipoLabel = switch (c.getTipo()) {
                case escleroterapia -> "Escleroterapia (Inyección de Várices)";
                case sueroterapia   -> "Sueroterapia Vitamina C y/o Complejo B";
                case laser          -> "Terapia Láser para Control de Venas Várices";
                case paquete        -> "Paquete Integral";
            };

            String asunto = "✅ Consentimiento Informado Firmado — " + c.getRadicado() + " | " + ipsNombre;
            String html   = buildHtml(c, tipoLabel);

            // ── Enviar al paciente ──────────────────────────────────────────
            if (emailPaciente != null && !emailPaciente.isBlank()) {
                send(emailPaciente, asunto, html, pdfBase64, c.getRadicado());
                log.info("Email enviado al paciente {} → {}", c.getPacienteNombre(), emailPaciente);
            }

            // ── Copia a la clínica ──────────────────────────────────────────
            String asuntoClinica = "[COPIA CLÍNICA] " + asunto;
            send(copyTo, asuntoClinica, html, pdfBase64, c.getRadicado());
            log.info("Copia enviada a clínica → {}", copyTo);

        } catch (Exception ex) {
            log.error("Error enviando email para consentimiento {}: {}", c.getId(), ex.getMessage(), ex);
        }
    }

    private void send(String to, String subject, String html, String pdfBase64, String radicado)
            throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(new jakarta.mail.internet.InternetAddress(from, fromName, "UTF-8"));
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);

        // Adjuntar PDF si viene del frontend (base64)
        if (pdfBase64 != null && !pdfBase64.isBlank()) {
            try {
                String base64 = pdfBase64.contains(",") ? pdfBase64.split(",")[1] : pdfBase64;
                byte[] pdfBytes = Base64.getDecoder().decode(base64);
                helper.addAttachment("Consentimiento_" + radicado + ".pdf",
                        new org.springframework.core.io.ByteArrayResource(pdfBytes),
                        "application/pdf");
            } catch (Exception e) {
                log.warn("No se pudo adjuntar el PDF: {}", e.getMessage());
            }
        }

        mailSender.send(msg);
    }

    private String buildHtml(Consentimiento c, String tipoLabel) {
        String fecha = c.getFecha() != null ? c.getFecha().format(FMT) : "—";
        String estado = switch (c.getEstado()) {
            case FIRMADO   -> "<span style='color:#D97706;font-weight:bold'>⏳ FIRMADO — Pendiente Aprobación Médica</span>";
            case APROBADO  -> "<span style='color:#059669;font-weight:bold'>✅ APROBADO</span>";
            case RECHAZADO -> "<span style='color:#DC2626;font-weight:bold'>❌ RECHAZADO</span>";
            default        -> c.getEstado().name();
        };

        return """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Consentimiento Informado — %s</title></head>
            <body style="margin:0;padding:0;background:#EFF3FB;font-family:Arial,sans-serif;">
            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#EFF3FB;padding:30px 0;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                  <!-- CABECERA -->
                  <tr><td style="background:#031CA6;border-radius:12px 12px 0 0;padding:28px 32px;">
                    <table width="100%%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">%s</p>
                          <p style="margin:4px 0 0;font-size:11px;color:#C5D5F0;">Sistema de Consentimientos Informados</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;color:#7A94C5;">Colombia</p>
                          <p style="margin:2px 0 0;font-size:10px;color:#5571A0;">%s</p>
                        </td>
                      </tr>
                    </table>
                  </td></tr>

                  <!-- BANNER VERDE -->
                  <tr><td style="background:#0D51D9;padding:12px 32px;">
                    <p style="margin:0;font-size:13px;color:#fff;font-weight:600;">
                      ✅ Consentimiento Informado Registrado Exitosamente
                    </p>
                  </td></tr>

                  <!-- CUERPO -->
                  <tr><td style="background:#fff;padding:32px;">

                    <p style="margin:0 0 20px;font-size:14px;color:#374151;">
                      Estimado/a <strong style="color:#031CA6;">%s</strong>,<br><br>
                      Le informamos que su consentimiento informado ha sido registrado en el sistema de
                      <strong>%s</strong>. A continuación encontrará el resumen del documento.
                      El PDF completo está adjunto a este correo para su archivo personal.
                    </p>

                    <!-- DATOS DEL CONSENTIMIENTO -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                           style="background:#EFF3FB;border-radius:10px;padding:20px;margin-bottom:20px;">
                      <tr>
                        <td style="padding:6px 0;">
                          <p style="margin:0;font-size:10px;color:#5571A0;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Radicado</p>
                          <p style="margin:2px 0 0;font-size:16px;font-weight:900;color:#031CA6;font-family:monospace;">%s</p>
                        </td>
                        <td align="right" style="padding:6px 0;">
                          <p style="margin:0;font-size:10px;color:#5571A0;text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Fecha</p>
                          <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#374151;">%s</p>
                        </td>
                      </tr>
                    </table>

                    <!-- TABLA DE DETALLES -->
                    <table width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                      %s
                    </table>

                    <!-- ESTADO -->
                    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                      <p style="margin:0;font-size:12px;color:#374151;">Estado del consentimiento: %s</p>
                      <p style="margin:6px 0 0;font-size:11px;color:#6B7280;">
                        El médico responsable revisará y aprobará el consentimiento antes de proceder con la cita.
                        Recibirá una notificación cuando sea aprobado.
                      </p>
                    </div>

                    <!-- NOTA LEGAL -->
                    <div style="border-left:4px solid #0D51D9;padding:12px 16px;background:#F8FAFF;border-radius:0 8px 8px 0;margin-bottom:24px;">
                      <p style="margin:0;font-size:11px;color:#374151;line-height:1.6;">
                        <strong>Nota legal:</strong> Este correo electrónico y el documento PDF adjunto
                        constituyen un registro digital oficial de su consentimiento informado.
                        Consérvelo para cualquier referencia futura. La IPS Med&amp;Fis almacena
                        este registro de forma segura en su sistema.
                      </p>
                    </div>

                    <p style="margin:0;font-size:12px;color:#6B7280;">
                      Si tiene alguna duda, comuníquese con nosotros por WhatsApp:<br>
                      <strong style="color:#031CA6;">+%s</strong><br>
                      <strong>%s</strong> · Colombia
                    </p>

                  </td></tr>

                  <!-- PIE -->
                  <tr><td style="background:#031CA6;border-radius:0 0 12px 12px;padding:18px 32px;">
                    <table width="100%%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td><p style="margin:0;font-size:10px;color:#7A94C5;">
                          © %d %s · Todos los derechos reservados<br>
                          Desarrollado por JM Ingeniero
                        </p></td>
                        <td align="right"><p style="margin:0;font-size:10px;color:#5571A0;">CliniSign</p></td>
                      </tr>
                    </table>
                  </td></tr>

                </table>
              </td></tr>
            </table>
            </body></html>
            """.formatted(
                ipsNombre,          // <title>
                ipsNombre,          // cabecera nombre IPS
                from,               // cabecera email IPS
                c.getPacienteNombre(),
                ipsNombre,          // "registrado en el sistema de X"
                c.getRadicado(),
                fecha,
                buildDetallesRows(c, tipoLabel),
                estado,
                waAdmin,            // número WA contacto
                ipsNombre,          // nombre IPS en firma
                java.time.LocalDate.now().getYear(),
                ipsNombre           // pie de página
        );
    }

    private String buildDetallesRows(Consentimiento c, String tipoLabel) {
        return fila("Procedimiento", tipoLabel, "#0D51D9") +
               fila("Paciente", c.getPacienteNombre(), null) +
               fila("Documento", c.getPacienteDoc(), null) +
               fila("Teléfono", c.getPacienteTel() != null ? c.getPacienteTel() : "—", null) +
               fila("Registrado por", c.getCreadoPor() != null ? c.getCreadoPor() : "Sistema", null);
    }

    private String fila(String label, String valor, String colorValor) {
        String valStyle = colorValor != null
                ? "color:" + colorValor + ";font-weight:700;"
                : "color:#111827;";
        return """
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;width:40%%;">%s</td>
              <td style="padding:9px 0;border-bottom:1px solid #E5E7EB;font-size:12px;%s">%s</td>
            </tr>
            """.formatted(label, valStyle, valor);
    }
}
