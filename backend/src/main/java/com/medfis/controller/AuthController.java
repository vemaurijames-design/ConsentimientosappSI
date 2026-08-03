package com.medfis.controller;
import com.medfis.dto.LoginRequest;
import com.medfis.dto.LoginResponse;
import com.medfis.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/login") public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) { return ResponseEntity.ok(authService.login(req)); }
    @PostMapping("/logout") public ResponseEntity<Map<String,String>> logout() { return ResponseEntity.ok(Map.of("message","Sesion cerrada")); }
    @GetMapping("/me") public ResponseEntity<Map<String,Object>> me(Authentication auth) { return ResponseEntity.ok(Map.of("email",auth.getName(),"authorities",auth.getAuthorities().toString())); }
}
