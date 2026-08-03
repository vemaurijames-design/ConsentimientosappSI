package com.medfis.controller;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BadCredentialsException.class) public ResponseEntity<Map<String,Object>> bad(BadCredentialsException e) { return err(HttpStatus.UNAUTHORIZED, e.getMessage()); }
    @ExceptionHandler(AccessDeniedException.class) public ResponseEntity<Map<String,Object>> denied(AccessDeniedException e) { return err(HttpStatus.FORBIDDEN, "Sin permisos"); }
    @ExceptionHandler(RuntimeException.class) public ResponseEntity<Map<String,Object>> rt(RuntimeException e) { return err(HttpStatus.BAD_REQUEST, e.getMessage()); }
    private ResponseEntity<Map<String,Object>> err(HttpStatus s, String msg) {
        return ResponseEntity.status(s).body(Map.of("timestamp",LocalDateTime.now().toString(),"status",s.value(),"message",msg));
    }
}
