package com.medfis.controller;
import com.medfis.dto.UsuarioRequest;
import com.medfis.entity.Usuario;
import com.medfis.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/usuarios") @RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService svc;
    @GetMapping @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')") public ResponseEntity<List<Usuario>> listar() { return ResponseEntity.ok(svc.listarTodos()); }
    @PostMapping @PreAuthorize("hasRole('ADMINISTRADOR')") public ResponseEntity<Usuario> crear(@Valid @RequestBody UsuarioRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(svc.crear(req)); }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMINISTRADOR')") public ResponseEntity<Usuario> actualizar(@PathVariable UUID id, @Valid @RequestBody UsuarioRequest req) { return ResponseEntity.ok(svc.actualizar(id,req)); }
    @PatchMapping("/{id}/toggle") @PreAuthorize("hasRole('ADMINISTRADOR')") public ResponseEntity<Usuario> toggle(@PathVariable UUID id) { return ResponseEntity.ok(svc.toggleActivo(id)); }
}
