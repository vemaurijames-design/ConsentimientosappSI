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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RolUsuario rol;

    @Column(nullable = false)
    private boolean activo = true;

    /**
     * Permiso especial otorgado por el Administrador.
     * Permite a AUXILIAR / ENFERMERA / TECNICO crear y editar historia clínica.
     * ADMINISTRADOR y MEDICO no dependen de este flag (se validan por rol).
     */
    @Column(name = "puede_editar_hc", nullable = false)
    private boolean puedeEditarHc = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum RolUsuario {
        MEDICO,
        ADMINISTRADOR,
        AUXILIAR,
        ENFERMERA,
        TECNICO
    }
}