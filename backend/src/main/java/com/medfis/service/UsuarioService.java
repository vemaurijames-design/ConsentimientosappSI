package com.medfis.service;
import com.medfis.dto.UsuarioRequest;
import com.medfis.entity.Usuario;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository repo;
    private final PasswordEncoder enc;

    public List<Usuario> listarTodos() { return repo.findAllByOrderByCreatedAtDesc(); }

    @Transactional
    public Usuario crear(UsuarioRequest req) {
        if (repo.existsByEmail(req.getEmail())) throw new RuntimeException("Email ya existe: "+req.getEmail());
        Usuario u = new Usuario();
        u.setNombre(req.getNombre()); u.setEmail(req.getEmail().toLowerCase());
        u.setPassword(enc.encode(req.getPassword())); u.setRol(Usuario.RolUsuario.valueOf(req.getRol())); u.setActivo(true);
        return repo.save(u);
    }

    @Transactional
    public Usuario actualizar(UUID id, UsuarioRequest req) {
        Usuario u = repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrado"));
        u.setNombre(req.getNombre()); u.setRol(Usuario.RolUsuario.valueOf(req.getRol()));
        if (req.getPassword() != null && !req.getPassword().isBlank()) u.setPassword(enc.encode(req.getPassword()));
        return repo.save(u);
    }

    @Transactional
    public Usuario toggleActivo(UUID id) {
        Usuario u = repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrado"));
        if (u.getRol() == Usuario.RolUsuario.ADMINISTRADOR) throw new RuntimeException("No se puede desactivar al Administrador");
        u.setActivo(!u.isActivo()); return repo.save(u);
    }

    @Transactional
    public void cambiarPassword(UUID id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) throw new RuntimeException("Contraseña debe tener al menos 6 caracteres");
        Usuario u = repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrado"));
        u.setPassword(enc.encode(newPassword));
        repo.save(u);
    }
}
