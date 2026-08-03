package com.medfis.service;
import com.medfis.dto.LoginRequest;
import com.medfis.dto.LoginResponse;
import com.medfis.entity.Usuario;
import com.medfis.repository.UsuarioRepository;
import com.medfis.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authManager;
    private final UserDetailsService uds;
    private final UsuarioRepository repo;
    private final JwtUtil jwt;

    public LoginResponse login(LoginRequest req) {
        try { authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())); }
        catch (Exception e) { throw new BadCredentialsException("Credenciales incorrectas"); }
        Usuario u = repo.findByEmail(req.getEmail()).orElseThrow(() -> new BadCredentialsException("No encontrado"));
        if (!u.isActivo()) throw new BadCredentialsException("Usuario inactivo");
        String token = jwt.generateToken(uds.loadUserByUsername(req.getEmail()), u.getRol().name());
        return new LoginResponse(token, u.getId().toString(), u.getNombre(), u.getEmail(), u.getRol().name(), u.isActivo());
    }
}
