package com.medfis.security;
import com.medfis.entity.Usuario;
import com.medfis.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UsuarioRepository repo;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario u = repo.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("No encontrado: "+email));
        if (!u.isActivo()) throw new UsernameNotFoundException("Inactivo: "+email);
        return new org.springframework.security.core.userdetails.User(
            u.getEmail(), u.getPassword(),
            List.of(new SimpleGrantedAuthority("ROLE_"+u.getRol().name())));
    }
}
