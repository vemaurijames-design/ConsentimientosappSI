package com.medfis.service;

import com.medfis.dto.LoginRequest;
import com.medfis.dto.LoginResponse;
import com.medfis.entity.Usuario;
import com.medfis.repository.UsuarioRepository;
import com.medfis.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public LoginResponse login(LoginRequest req) {
        // 1. Buscar usuario por email
        Usuario usuario = usuarioRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Credenciales incorrectas"));

        // 2. Verificar contraseña manualmente
        if (!passwordEncoder.matches(req.getPassword(), usuario.getPassword())) {
            throw new BadCredentialsException("Credenciales incorrectas");
        }

        // 3. Verificar si el usuario está activo
        if (!usuario.isActivo()) {
            throw new BadCredentialsException("Usuario inactivo");
        }

        // 4. Generar token JWT
        String token = jwtUtil.generateToken(
                userDetailsService.loadUserByUsername(req.getEmail()),
                usuario.getRol().name()
        );

        // 5. Devolver respuesta
        return new LoginResponse(
                token,
                usuario.getId().toString(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol().name(),
                usuario.isActivo()
        );
    }
}