package com.medfis.entity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 200) private String nombre;
    @Column(nullable = false, unique = true, length = 150) private String email;
    @Column(nullable = false) private String password;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50) private RolUsuario rol;
    @Column(nullable = false) private boolean activo = true;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    public enum RolUsuario { MEDICO, ADMINISTRADOR, AUXILIAR, ENFERMERA, TECNICO }
}
