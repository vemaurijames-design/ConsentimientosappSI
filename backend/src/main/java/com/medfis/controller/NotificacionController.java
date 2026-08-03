package com.medfis.controller;
import com.medfis.entity.Notificacion;
import com.medfis.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api/notificaciones") @RequiredArgsConstructor
public class NotificacionController {
    private final NotificacionService svc;
    @GetMapping public ResponseEntity<List<Notificacion>> listar(Authentication auth) { return ResponseEntity.ok(svc.getParaUsuario(auth.getName())); }
    @GetMapping("/count") public ResponseEntity<Map<String,Long>> count(Authentication auth) { return ResponseEntity.ok(Map.of("noLeidas", svc.countNoLeidas(auth.getName()))); }
    @PatchMapping("/{id}/leer") public ResponseEntity<Notificacion> leer(@PathVariable UUID id) { return ResponseEntity.ok(svc.marcarLeida(id)); }
    @PatchMapping("/leer-todas") public ResponseEntity<Map<String,Integer>> leerTodas(Authentication auth) { return ResponseEntity.ok(Map.of("marcadas", svc.marcarTodasLeidas(auth.getName()))); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> eliminar(@PathVariable UUID id) { svc.eliminar(id); return ResponseEntity.noContent().build(); }
}
