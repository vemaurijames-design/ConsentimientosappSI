package com.medfis.config;

import com.medfis.entity.Usuario;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea el usuario administrador inicial si no existe.
 * Reemplaza data.sql — usa PasswordEncoder en runtime para BCrypt correcto.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder  passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        crearAdminSiNoExiste();
    }

    private void crearAdminSiNoExiste() {
        final String adminEmail = "vemaurijames@gmail.com";

        if (usuarioRepo.findByEmail(adminEmail).isPresent()) {
            log.info("✅ Usuario administrador ya existe — omitiendo inicialización");
            return;
        }

        Usuario admin = new Usuario();
        admin.setNombre("Administrador CliniSign");
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode("admin123456"));
        admin.setRol(Usuario.RolUsuario.ADMINISTRADOR);
        admin.setActivo(true);

        usuarioRepo.save(admin);
        log.info("✅ Usuario administrador creado: {}", adminEmail);
    }
}
