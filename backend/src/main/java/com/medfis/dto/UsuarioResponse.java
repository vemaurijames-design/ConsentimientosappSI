package com.medfis.dto;
import com.medfis.entity.Usuario;
import java.time.LocalDateTime;
import java.util.UUID;

public record UsuarioResponse(
    UUID id,
    String nombre,
    String email,
    String rol,
    boolean activo,
    LocalDateTime createdAt
) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name(), u.isActivo(), u.getCreatedAt());
    }
}
