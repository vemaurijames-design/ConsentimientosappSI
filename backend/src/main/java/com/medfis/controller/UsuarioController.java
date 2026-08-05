package com.medfis.controller;
import com.medfis.dto.UsuarioRequest;
import com.medfis.dto.UsuarioResponse;
import com.medfis.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/api/usuarios") @RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService svc;

    @GetMapping @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
    public ResponseEntity<List<UsuarioResponse>> listar() {
        return ResponseEntity.ok(svc.listarTodos().stream().map(UsuarioResponse::from).toList());
    }

    @PostMapping @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.from(svc.crear(req)));
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> actualizar(@PathVariable UUID id, @Valid @RequestBody UsuarioRequest req) {
        return ResponseEntity.ok(UsuarioResponse.from(svc.actualizar(id, req)));
    }

    @PatchMapping("/{id}/toggle") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponse> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(UsuarioResponse.from(svc.toggleActivo(id)));
    }

    @PatchMapping("/{id}/password") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> cambiarPassword(@PathVariable UUID id, @RequestBody Map<String,String> body) {
        svc.cambiarPassword(id, body.get("password"));
        return ResponseEntity.ok().build();
    }
}
