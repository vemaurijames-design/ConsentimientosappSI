package com.medfis.controller;

import com.medfis.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints WhatsApp — el de solicitud-acceso es público (sin JWT)
 * para que el formulario del login pueda llamarlo sin estar autenticado.
 */
@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
public class WhatsAppController {

    private final WhatsAppService whatsAppService;

    /**
     * POST /api/whatsapp/solicitud-acceso  (público — sin autenticación)
     * Body: { "nombre": "...", "contacto": "...", "mensaje": "..." }
     * Envía notificación al administrador cuando alguien solicita acceso desde el login.
     */
    @PostMapping("/solicitud-acceso")
    public ResponseEntity<Map<String, String>> solicitudAcceso(@RequestBody Map<String, String> body) {
        String nombre   = body.getOrDefault("nombre", "Sin nombre");
        String contacto = body.getOrDefault("contacto", "Sin contacto");
        String mensaje  = body.getOrDefault("mensaje", "");
        whatsAppService.notificarSolicitudAcceso(nombre, contacto, mensaje);
        return ResponseEntity.ok(Map.of("status", "ok", "mensaje", "Solicitud enviada al administrador"));
    }

    /**
     * POST /api/whatsapp/enviar  (requiere autenticación)
     * Body: { "numero": "3001234567", "mensaje": "Texto libre" }
     * Para envíos manuales desde el sistema.
     */
    @PostMapping("/enviar")
    public ResponseEntity<Map<String, String>> enviar(@RequestBody Map<String, String> body) {
        String numero  = body.getOrDefault("numero", "");
        String mensaje = body.getOrDefault("mensaje", "");
        if (numero.isBlank() || mensaje.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "numero y mensaje son requeridos"));
        }
        whatsAppService.enviarMensaje(numero, mensaje);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
