package com.medfis.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "citas")
@Data
@NoArgsConstructor
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "paciente_id", nullable = false)
    private UUID pacienteId;

    @Column(name = "ips_id")
    private UUID ipsId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    /** VALORACION, CONTROL, PROCEDIMIENTO, SEGUIMIENTO, OTRO */
    @Column(name = "tipo_cita", nullable = false, length = 40)
    private String tipoCita;

    /** ESCLEROTERAPIA, LASER, SUEROTERAPIA, PAQUETE, CONSULTA_GENERAL, OTRO */
    @Column(nullable = false, length = 40)
    private String tratamiento;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(length = 500)
    private String observaciones;

    /**
     * PROGRAMADA | CONFIRMADA | CUMPLIDA | CANCELADA | NO_ASISTIO
     */
    @Column(nullable = false, length = 30)
    private String estado = "PROGRAMADA";

    @Column(length = 150)
    private String profesional;

    @Column(name = "creado_por", length = 150)
    private String creadoPor;

    /** Quién cambió el estado por última vez (email o nombre) */
    @Column(name = "actualizado_por", length = 150)
    private String actualizadoPor;

    /** Motivo de cancelación / nota al cambiar estado */
    @Column(name = "observacion_estado", length = 500)
    private String observacionEstado;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}