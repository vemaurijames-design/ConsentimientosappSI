package com.medfis.service;

import com.medfis.entity.Consentimiento;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * Servicio de WhatsApp automático via Twilio.
 *
 * CONFIGURACIÓN REQUERIDA (backend/.env):
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_WA_FROM=whatsapp:+14155238886        ← sandbox Twilio (pruebas)
 *   MEDFIS_WA_ADMIN=573114048112                ← número admin sin + ni espacios
 *
 * SANDBOX (pruebas gratuitas):
 *   El paciente/admin debe enviar "join <palabra>" al +1 415 523 8886 por WhatsApp
 *   una sola vez para unirse al sandbox de Twilio.
 *
 * PRODUCCIÓN:
 *   Solicitar número WhatsApp Business en console.twilio.com → Messaging → WhatsApp
 *   Cambiar TWILIO_WA_FROM al número aprobado: whatsapp:+57XXXXXXXXXX
 */
@Slf4j
@Service
public class WhatsAppService {

    @Value("${twilio.account-sid:}") private String accountSid;
    @Value("${twilio.auth-token:}")  private String authToken;
    @Value("${twilio.wa-from:whatsapp:+14155238886}") private String fromNumber;
    @Value("${medfis.wa.admin:}") private String adminNumber;
    @Value("${medfis.nombre-ips:CliniSign}") private String ipsNombre;

    private boolean twilioEnabled = false;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && !accountSid.equals("REEMPLAZAR")) {
            Twilio.init(accountSid, authToken);
            twilioEnabled = true;
            log.info("✅ WhatsApp Twilio habilitado — from: {}", fromNumber);
        } else {
            log.warn("⚠️ WhatsApp Twilio NO configurado — mensajes deshabilitados. Configure TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en backend/.env");
        }
    }

    /** Envía mensaje automático al PACIENTE cuando se crea un consentimiento */
    @Async
    public void notificarConsentimientoCreado(Consentimiento c) {
        if (!twilioEnabled) return;
        String tel = limpiarTel(c.getPacienteTel());
        if (tel.isBlank()) { log.warn("WA: paciente {} sin teléfono", c.getPacienteNombre()); return; }

        String tipoLabel = tipoLabel(c.getTipo().name());
        String msg = String.format("""
            ✅ *%s*

            Estimado/a *%s*,
            Su consentimiento informado ha sido registrado.

            📋 *Procedimiento:* %s
            🔖 *Radicado:* %s
            📅 *Fecha:* %s
            ⏳ *Estado:* Firmado — Pendiente aprobación médica

            Recibirá confirmación cuando el médico apruebe su cita.
            📞 Cualquier duda comuníquese con nuestra clínica.""",
            ipsNombre, c.getPacienteNombre(), tipoLabel,
            c.getRadicado(), c.getFecha().format(FMT));

        enviar("whatsapp:+57" + tel, msg, "creado/" + c.getRadicado());
    }

    /** Envía mensaje al PACIENTE cuando el médico aprueba el consentimiento */
    @Async
    public void notificarAprobado(Consentimiento c) {
        if (!twilioEnabled) return;
        String tel = limpiarTel(c.getPacienteTel());
        if (tel.isBlank()) return;

        String msg = String.format("""
            🎉 *%s — Cita APROBADA*

            Estimado/a *%s*,
            El médico *%s* ha aprobado su consentimiento informado.

            🔖 *Radicado:* %s
            ✅ *Estado:* APROBADO — Puede proceder con su cita

            Le esperamos. Cualquier cambio comuníquese a tiempo.""",
            ipsNombre, c.getPacienteNombre(),
            c.getAprobadoPor() != null ? c.getAprobadoPor() : "responsable médico",
            c.getRadicado());

        enviar("whatsapp:+57" + tel, msg, "aprobado/" + c.getRadicado());
    }

    /** Envía mensaje al PACIENTE cuando el médico rechaza el consentimiento */
    @Async
    public void notificarRechazado(Consentimiento c) {
        if (!twilioEnabled) return;
        String tel = limpiarTel(c.getPacienteTel());
        if (tel.isBlank()) return;

        String motivo = c.getMotivoRechazo() != null ? c.getMotivoRechazo() : "Sin especificar";
        String msg = String.format("""
            ⚠️ *%s — Consentimiento RECHAZADO*

            Estimado/a *%s*,
            Su consentimiento informado ha sido rechazado por el médico.

            🔖 *Radicado:* %s
            ❌ *Motivo:* %s

            Por favor comuníquese con nuestra clínica para más información.""",
            ipsNombre, c.getPacienteNombre(), c.getRadicado(), motivo);

        enviar("whatsapp:+57" + tel, msg, "rechazado/" + c.getRadicado());
    }

    /** Envía solicitud de acceso al ADMINISTRADOR desde el login */
    @Async
    public void notificarSolicitudAcceso(String nombre, String contacto, String mensaje) {
        if (!twilioEnabled || adminNumber == null || adminNumber.isBlank()) {
            log.warn("WA: solicitud de acceso de {} — Twilio no configurado o admin sin número", nombre);
            return;
        }
        String msg = String.format("""
            🔔 *SOLICITUD DE ACCESO — %s*

            👤 *Nombre:* %s
            📱 *Contacto:* %s
            💬 *Mensaje:* %s

            _Enviado desde el login de CliniSign_""",
            ipsNombre, nombre, contacto,
            mensaje != null && !mensaje.isBlank() ? mensaje : "Sin mensaje adicional");

        enviar("whatsapp:+" + limpiarTel(adminNumber), msg, "solicitud-acceso/" + nombre);
    }

    /** Envía un mensaje WhatsApp genérico (uso interno) */
    @Async
    public void enviarMensaje(String numeroDestino, String mensaje) {
        if (!twilioEnabled) return;
        String tel = limpiarTel(numeroDestino);
        if (!tel.isBlank()) enviar("whatsapp:+57" + tel, mensaje, "manual/" + tel);
    }

    // ── privados ──────────────────────────────────────────────────────────────

    private void enviar(String to, String body, String contexto) {
        try {
            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(fromNumber),
                    body
            ).create();
            log.info("WA enviado [{}] → {} | SID: {}", contexto, to, message.getSid());
        } catch (Exception ex) {
            log.error("WA error [{}] → {}: {}", contexto, to, ex.getMessage());
        }
    }

    private String limpiarTel(String tel) {
        if (tel == null) return "";
        String limpio = tel.replaceAll("[^0-9]", "");
        // Si ya empieza con 57 (código Colombia), quitarlo para que el caller ponga +57
        if (limpio.startsWith("57") && limpio.length() == 12) limpio = limpio.substring(2);
        return limpio;
    }

    private String tipoLabel(String tipo) {
        return switch (tipo.toLowerCase()) {
            case "escleroterapia" -> "Escleroterapia (Inyección de Várices)";
            case "sueroterapia"   -> "Sueroterapia Vitamina C y/o Complejo B";
            case "laser"          -> "Terapia Láser para Control de Venas Várices";
            case "paquete"        -> "Paquete Integral";
            default -> tipo;
        };
    }
}
