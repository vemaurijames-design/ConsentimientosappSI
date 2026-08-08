package com.medfis.config;

import com.medfis.entity.Usuario;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Garantiza que exista UN administrador con acceso total.
 * El correo y la clave se leen de application.properties / variables de entorno.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder  passwordEncoder;

    @Value("${medfis.admin.email}")                              private String adminEmail;
    @Value("${medfis.admin.password}")                           private String adminPassword;
    @Value("${medfis.admin.nombre:Administrador Salud Intensa}") private String adminNombre;
    @Value("${medfis.admin.reset-password:true}")                private boolean resetPassword;

    @Override
    public void run(ApplicationArguments args) {
        String email = adminEmail.trim().toLowerCase();

        Usuario admin = usuarioRepo.findByEmail(email).orElseGet(Usuario::new);
        boolean esNuevo = (admin.getId() == null);

        admin.setNombre(adminNombre);
        admin.setEmail(email);
        admin.setRol(Usuario.RolUsuario.ADMINISTRADOR);
        admin.setActivo(true);

        if (esNuevo || resetPassword) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
        }

        usuarioRepo.save(admin);

        if (esNuevo) log.info("Administrador CREADO: {}", email);
        else         log.info("Administrador verificado y normalizado: {}", email);
    }
}