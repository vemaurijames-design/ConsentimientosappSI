package com.medfis.config;

import com.medfis.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtFilter jwtFilter;

    // Recuerda definir esto en tu application.properties o application.yml
    @Value("${cors.allowed-origins}")
    private String origins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        // Rutas públicas sin token
                        .requestMatchers("/api/auth/**", "/ws/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/whatsapp/solicitud-acceso").permitAll()

                        // ✅ ¡AQUÍ ESTÁ LA CORRECCIÓN QUE ELIMINA TU ERROR 403!
                        // Opción A (Recomendada para prueba): Permitir el envío de mails SIN autenticación
                        .requestMatchers(HttpMethod.POST, "/api/emails/enviar-consentimiento").permitAll()

                        // Opción B (Seguridad real): Si quieres que solo médicos o administradores envíen correos:
                        // .requestMatchers(HttpMethod.POST, "/api/emails/enviar-consentimiento").hasAnyRole("MEDICO", "ADMINISTRADOR")

                        // Rutas exclusivas para Roles
                        .requestMatchers(HttpMethod.POST, "/api/usuarios").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/usuarios/**").hasRole("ADMINISTRADOR")
                        .requestMatchers(HttpMethod.POST, "/api/consentimientos/*/aprobar").hasAnyRole("MEDICO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.POST, "/api/consentimientos/*/rechazar").hasAnyRole("MEDICO", "ADMINISTRADOR")

                        // El resto de peticiones SÍ necesitan token
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration c = new CorsConfiguration();
        // Usamos la variable de entorno (ej: http://localhost:4200)
        c.setAllowedOrigins(Arrays.asList(origins.split(",")));
        c.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception {
        return c.getAuthenticationManager();
    }
}