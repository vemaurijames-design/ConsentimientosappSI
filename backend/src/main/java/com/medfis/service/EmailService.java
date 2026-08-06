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

    @Value("${medfis.mail.from}")               private String from;
    @Value("${medfis.mail.from-name}")           private String fromName;
    @Value("${medfis.mail.copy-to}")             private String copyTo;
    @Value("${medfis.nombre-ips:Salud Intensa Med y Fis IPS}") private String ipsNombre;
    @Value("${medfis.wa.admin:573114048112}")    private String waAdmin;

    private static final DateTimeFormatter FMT     = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_DIA = DateTimeFormatter.ofPattern("EEEE dd 'de' MMMM 'de' yyyy",
                                                          new java.util.Locale("es", "CO"));

    // ══════════════════════════════════════════════════════════════════════════
    // MÉTODO PRINCIPAL — envía al paciente + copia a la clínica
    // ══════════════════════════════════════════════════════════════════════════
    @Async
    public void enviarConsentimientoFirmado(Consentimiento c, String emailPaciente, String pdfBase64) {
        try {
            String tipoLabel = tipoLabel(c.getTipo().name());
            String asunto    = "📋 Consentimiento Informado — " + tipoLabel + " · " + c.getRadicado();

            String htmlPaciente = buildHtmlPaciente(c, tipoLabel);
            String htmlClinica  = buildHtmlClinica(c, tipoLabel);

            // ── Al paciente (con saludo personalizado) ────────────────────────
            if (emailPaciente != null && !emailPaciente.isBlank()) {
                send(emailPaciente, asunto, htmlPaciente, pdfBase64, c.getRadicado());
                log.info("✅ Email enviado al paciente {} → {}", c.getPacienteNombre(), emailPaciente);
            }

            // ── Copia interna a la clínica (con datos completos de gestión) ──
            String asuntoClinica = "[REGISTRO CLÍNICA] " + asunto + " · " + c.getPacienteNombre();
            send(copyTo, asuntoClinica, htmlClinica, pdfBase64, c.getRadicado());
            log.info("✅ Copia clínica enviada → {}", copyTo);

        } catch (Exception ex) {
            log.error("❌ Error enviando email consentimiento {}: {}", c.getId(), ex.getMessage(), ex);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // EMAIL AL PACIENTE — diseño profesional y cálido
    // ══════════════════════════════════════════════════════════════════════════
    private String buildHtmlPaciente(Consentimiento c, String tipoLabel) {
        String fecha   = c.getFecha() != null ? c.getFecha().format(FMT)     : "—";
        String fechaLg = c.getFecha() != null ? c.getFecha().format(FMT_DIA) : "—";
        String estadoHtml = estadoBadge(c);
        int anio = java.time.LocalDate.now().getYear();

        return """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Consentimiento Informado — %s</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(3,28,166,0.12);">

  <!-- ══ CABECERA AZUL ══ -->
  <tr><td style="background:linear-gradient(135deg,#031CA6 0%%,#0D51D9 100%%);padding:36px 40px 28px;">
    <table width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:11px;color:#C5D5F0;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Sistema de Consentimientos Informados</p>
          <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">%s</p>
        </td>
        <td align="right" valign="top">
          <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;text-align:center;">
            <p style="margin:0;font-size:9px;color:#C5D5F0;text-transform:uppercase;letter-spacing:1px;">Radicado</p>
            <p style="margin:4px 0 0;font-size:17px;font-weight:900;color:#fff;font-family:monospace;">%s</p>
          </div>
        </td>
      </tr>
    </table>
    <div style="margin-top:20px;background:rgba(255,255,255,0.1);border-radius:8px;padding:10px 16px;">
      <p style="margin:0;font-size:12px;color:#E0E8FF;">
        📅 <strong>%s</strong> &nbsp;·&nbsp; 📋 %s
      </p>
    </div>
  </td></tr>

  <!-- ══ SALUDO ══ -->
  <tr><td style="background:#ffffff;padding:36px 40px 0;">
    <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#031CA6;">Estimado/a %s,</p>
    <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.7;">
      Su consentimiento informado ha sido <strong style="color:#059669;">registrado exitosamente</strong> en nuestro sistema.
      Le enviamos este correo como constancia oficial del procedimiento, junto con el documento PDF adjunto
      para su archivo personal.
    </p>
  </td></tr>

  <!-- ══ TARJETA ESTADO ══ -->
  <tr><td style="background:#ffffff;padding:24px 40px 0;">
    <div style="background:#F0FDF4;border:2px solid #86EFAC;border-radius:12px;padding:20px 24px;">
      <table width="100%%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:10px;color:#166534;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Estado actual</p>
            <p style="margin:0;font-size:15px;font-weight:700;">%s</p>
          </td>
          <td align="right">
            <p style="margin:0;font-size:10px;color:#6B7280;">Registrado por</p>
            <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#374151;">%s</p>
          </td>
        </tr>
      </table>
    </div>
  </td></tr>

  <!-- ══ DATOS DEL PROCEDIMIENTO ══ -->
  <tr><td style="background:#ffffff;padding:24px 40px 0;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#031CA6;text-transform:uppercase;letter-spacing:1.2px;border-bottom:2px solid #E0E8FF;padding-bottom:8px;">
      📋 Datos del Procedimiento
    </p>
    <table width="100%%" cellpadding="0" cellspacing="0">
      %s
    </table>
  </td></tr>

  <!-- ══ INFORMACIÓN IMPORTANTE ══ -->
  <tr><td style="background:#ffffff;padding:24px 40px 0;">
    <div style="background:#FFF7ED;border-left:4px solid #F97316;border-radius:0 10px 10px 0;padding:16px 20px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9A3412;">⏳ Próximo paso</p>
      <p style="margin:0;font-size:12px;color:#7C2D12;line-height:1.6;">
        El médico responsable revisará su consentimiento y otorgará el <strong>Visto Bueno</strong>
        antes de proceder con su cita. Recibirá una notificación cuando sea aprobado.
      </p>
    </div>
  </td></tr>

  <!-- ══ PDF ADJUNTO ══ -->
  <tr><td style="background:#ffffff;padding:24px 40px 0;">
    <div style="background:#EFF3FB;border:2px dashed #93C5FD;border-radius:12px;padding:20px 24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:28px;">📄</p>
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#031CA6;">Documento PDF adjunto</p>
      <p style="margin:0;font-size:11px;color:#6B7280;">
        El consentimiento informado completo está adjunto a este correo.<br>
        Consérvelo como registro oficial de su procedimiento médico.
      </p>
    </div>
  </td></tr>

  <!-- ══ NOTA LEGAL ══ -->
  <tr><td style="background:#ffffff;padding:24px 40px 0;">
    <div style="border-left:4px solid #6366F1;background:#F5F3FF;border-radius:0 10px 10px 0;padding:16px 20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#4338CA;">⚖️ Nota Legal</p>
      <p style="margin:0;font-size:11px;color:#4C1D95;line-height:1.7;">
        Este correo y el documento adjunto constituyen un <strong>registro digital oficial</strong>
        de su consentimiento informado. <strong>%s</strong> almacena este registro de forma segura
        y confidencial conforme a la normatividad colombiana de habeas data y registros clínicos.
      </p>
    </div>
  </td></tr>

  <!-- ══ CONTACTO ══ -->
  <tr><td style="background:#ffffff;padding:24px 40px 32px;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#031CA6;text-transform:uppercase;letter-spacing:1.2px;border-bottom:2px solid #E0E8FF;padding-bottom:8px;">
      📞 ¿Necesita ayuda?
    </p>
    <table width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:12px;color:#6B7280;">WhatsApp clínica</p>
          <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#031CA6;">+%s</p>
        </td>
        <td align="right" style="padding:6px 0;">
          <p style="margin:0;font-size:12px;color:#6B7280;">Correo electrónico</p>
          <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#0D51D9;">%s</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ══ PIE ══ -->
  <tr><td style="background:linear-gradient(135deg,#031CA6 0%%,#0D51D9 100%%);padding:24px 40px;border-radius:0 0 16px 16px;">
    <table width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0;font-size:13px;font-weight:800;color:#ffffff;">%s</p>
          <p style="margin:4px 0 0;font-size:10px;color:#93C5FD;">Medellín, Colombia · NIT 901102930</p>
          <p style="margin:8px 0 0;font-size:9px;color:#6B8FCA;">© %d · Todos los derechos reservados · Desarrollado por JM Ingeniero</p>
        </td>
        <td align="right">
          <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 14px;text-align:center;">
            <p style="margin:0;font-size:9px;color:#C5D5F0;text-transform:uppercase;letter-spacing:1px;">Sistema</p>
            <p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#fff;">CliniSign</p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
            """.formatted(
                ipsNombre,              // title
                ipsNombre,              // cabecera nombre
                c.getRadicado(),        // radicado badge
                fechaLg,                // fecha larga
                tipoLabel,              // tipo procedimiento
                c.getPacienteNombre(),  // saludo
                estadoHtml,             // estado badge
                c.getCreadoPor() != null ? c.getCreadoPor() : "Sistema",
                filasDetallePaciente(c, tipoLabel),
                ipsNombre,              // nota legal IPS
                waAdmin,                // WA número
                from,                   // email contacto
                ipsNombre,              // pie nombre IPS
                anio
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // EMAIL INTERNO A LA CLÍNICA — datos completos para gestión de calidad
    // ══════════════════════════════════════════════════════════════════════════
    private String buildHtmlClinica(Consentimiento c, String tipoLabel) {
        String fecha   = c.getFecha() != null ? c.getFecha().format(FMT) : "—";
        String estadoHtml = estadoBadge(c);
        int anio = java.time.LocalDate.now().getYear();

        return """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>[REGISTRO CLÍNICA] %s — %s</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;padding:40px 16px;">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(3,28,166,0.12);">

  <!-- ══ CABECERA ══ -->
  <tr><td style="background:linear-gradient(135deg,#031CA6 0%%,#1e40af 100%%);padding:28px 36px;">
    <table width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0 0 2px;font-size:10px;color:#93C5FD;text-transform:uppercase;letter-spacing:1.5px;">REGISTRO INTERNO — CONTROL DE CALIDAD</p>
          <p style="margin:0;font-size:22px;font-weight:900;color:#fff;">%s</p>
          <p style="margin:4px 0 0;font-size:11px;color:#C5D5F0;">Consentimientos Informados · Gestión Clínica</p>
        </td>
        <td align="right">
          <div style="background:rgba(255,255,255,0.2);border-radius:10px;padding:12px 18px;text-align:center;">
            <p style="margin:0;font-size:9px;color:#C5D5F0;text-transform:uppercase;letter-spacing:1px;">Radicado</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#fff;font-family:monospace;">%s</p>
            <p style="margin:4px 0 0;font-size:10px;color:#93C5FD;">%s</p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ══ ESTADO ══ -->
  <tr><td style="background:#1e3a8a;padding:10px 36px;">
    <table width="100%%" cellpadding="0" cellspacing="0"><tr>
      <td><p style="margin:0;font-size:12px;color:#fff;">Estado: %s</p></td>
      <td align="right"><p style="margin:0;font-size:11px;color:#93C5FD;">Registrado: %s · Por: %s</p></td>
    </tr></table>
  </td></tr>

  <!-- ══ DATOS DEL PACIENTE ══ -->
  <tr><td style="background:#ffffff;padding:28px 36px 0;">
    <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#031CA6;text-transform:uppercase;letter-spacing:1.2px;border-bottom:2px solid #E0E8FF;padding-bottom:10px;">
      👤 Datos del Paciente
    </p>
    <table width="100%%" cellpadding="0" cellspacing="0">
      %s
    </table>
  </td></tr>

  <!-- ══ DATOS DEL PROCEDIMIENTO ══ -->
  <tr><td style="background:#ffffff;padding:24px 36px 0;">
    <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#031CA6;text-transform:uppercase;letter-spacing:1.2px;border-bottom:2px solid #E0E8FF;padding-bottom:10px;">
      🏥 Datos del Procedimiento
    </p>
    <table width="100%%" cellpadding="0" cellspacing="0">
      %s
    </table>
  </td></tr>

  <!-- ══ AVISO PDF ══ -->
  <tr><td style="background:#ffffff;padding:24px 36px 32px;">
    <div style="background:#F0FDF4;border:2px solid #86EFAC;border-radius:12px;padding:18px 24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#166534;">📎 Documento adjunto</p>
      <p style="margin:0;font-size:12px;color:#166534;line-height:1.6;">
        El PDF del consentimiento informado firmado está adjunto a este correo.
        Consérvelo en el expediente del paciente como parte del registro clínico oficial.
      </p>
    </div>
  </td></tr>

  <!-- ══ PIE ══ -->
  <tr><td style="background:linear-gradient(135deg,#031CA6 0%%,#0D51D9 100%%);padding:20px 36px;border-radius:0 0 16px 16px;">
    <table width="100%%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <p style="margin:0;font-size:12px;font-weight:700;color:#fff;">%s</p>
        <p style="margin:4px 0 0;font-size:9px;color:#93C5FD;">© %d · Registro Interno · CliniSign by JM Ingeniero</p>
      </td>
      <td align="right">
        <p style="margin:0;font-size:10px;color:#C5D5F0;">NIT 901102930</p>
        <p style="margin:2px 0 0;font-size:10px;color:#C5D5F0;">Medellín, Colombia</p>
      </td>
    </tr></table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
            """.formatted(
                c.getPacienteNombre(), c.getRadicado(),   // title
                ipsNombre,                                 // cabecera nombre
                c.getRadicado(),                          // radicado badge
                fecha,                                    // fecha en badge
                estadoHtml,                               // estado
                fecha,                                    // registrado fecha
                c.getCreadoPor() != null ? c.getCreadoPor() : "Sistema",
                filasDetallePacienteClinica(c),           // sección paciente
                filasDetalleProcedimiento(c, tipoLabel),  // sección procedimiento
                ipsNombre,                                // pie
                anio
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private String filasDetallePaciente(Consentimiento c, String tipoLabel) {
        return fila("Procedimiento", tipoLabel, "#031CA6", true) +
               fila("Documento",    c.getPacienteDoc(), null, false) +
               fila("Teléfono",     c.getPacienteTel() != null ? c.getPacienteTel() : "—", null, false) +
               fila("Fecha",        c.getFecha() != null ? c.getFecha().format(FMT) : "—", null, false);
    }

    private String filasDetallePacienteClinica(Consentimiento c) {
        return fila("Nombre completo", c.getPacienteNombre(), "#031CA6", true) +
               fila("Documento",      c.getPacienteDoc(), null, false) +
               fila("Teléfono",       c.getPacienteTel() != null ? c.getPacienteTel() : "—", null, false) +
               fila("Email paciente", c.getEmailPaciente() != null ? c.getEmailPaciente() : "—", null, false);
    }

    private String filasDetalleProcedimiento(Consentimiento c, String tipoLabel) {
        return fila("Procedimiento", tipoLabel, "#0D51D9", true) +
               fila("Fecha",        c.getFecha() != null ? c.getFecha().format(FMT) : "—", null, false) +
               fila("Radicado",     c.getRadicado(), null, false) +
               fila("Registrado por", c.getCreadoPor() != null ? c.getCreadoPor() : "Sistema", null, false) +
               fila("Estado",       c.getEstado().name(), null, false);
    }

    private String estadoBadge(Consentimiento c) {
        return switch (c.getEstado()) {
            case FIRMADO   -> "<span style='background:#FEF3C7;color:#92400E;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;'>⏳ FIRMADO — Pendiente aprobación</span>";
            case APROBADO  -> "<span style='background:#D1FAE5;color:#065F46;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;'>✅ APROBADO</span>";
            case RECHAZADO -> "<span style='background:#FEE2E2;color:#991B1B;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;'>❌ RECHAZADO</span>";
            default        -> "<span style='color:#6B7280;font-size:12px;'>" + c.getEstado().name() + "</span>";
        };
    }

    private String fila(String label, String valor, String colorValor, boolean bold) {
        String valStyle = "font-size:13px;" +
                (colorValor != null ? "color:" + colorValor + ";" : "color:#111827;") +
                (bold ? "font-weight:700;" : "font-weight:500;");
        return """
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:11px;color:#9CA3AF;width:38%%;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">%s</td>
              <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;%s">%s</td>
            </tr>
            """.formatted(label, valStyle, valor != null ? valor : "—");
    }

    private void send(String to, String subject, String html, String pdfBase64, String radicado)
            throws MessagingException, java.io.UnsupportedEncodingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
        helper.setFrom(new jakarta.mail.internet.InternetAddress(from, fromName, "UTF-8"));
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);

        if (pdfBase64 != null && !pdfBase64.isBlank()) {
            try {
                String base64  = pdfBase64.contains(",") ? pdfBase64.split(",")[1] : pdfBase64;
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

    private String tipoLabel(String tipo) {
        return switch (tipo.toLowerCase()) {
            case "escleroterapia" -> "Escleroterapia (Inyección de Várices)";
            case "sueroterapia"   -> "Sueroterapia Vitamina C y/o Complejo B";
            case "laser"          -> "Terapia Láser — Control de Venas Várices";
            case "paquete"        -> "Paquete Integral Salud Intensa";
            default               -> tipo;
        };
    }
}
