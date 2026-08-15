package com.medfis.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "historias_clinicas")
@Data
@NoArgsConstructor
public class HistoriaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "paciente_id", nullable = false)
    private UUID pacienteId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "motivo_consulta", columnDefinition = "text")
    private String motivoConsulta;

    @Column(name = "enfermedad_actual", columnDefinition = "text")
    private String enfermedadActual;

    // Signos vitales
    @Column(length = 20) private String tension;
    @Column(length = 20) private String frecuenciaCardiaca;
    @Column(length = 20) private String frecuenciaRespiratoria;
    @Column(length = 20) private String temperatura;
    @Column(length = 20) private String oximetria;
    @Column(length = 20) private String peso;
    @Column(length = 20) private String talla;
    @Column(length = 20) private String imc;

    @Column(name = "examen_fisico", columnDefinition = "text")
    private String examenFisico;

    @Column(columnDefinition = "text")
    private String diagnostico;

    @Column(name = "plan_manejo", columnDefinition = "text")
    private String planManejo;

    @Column(columnDefinition = "text")
    private String observaciones;

    /** Vincula con consentimiento si nació de uno */
    @Column(name = "consentimiento_id")
    private UUID consentimientoId;

    @Column(name = "creado_por", length = 150)
    private String creadoPor;

    @Column(name = "creado_por_rol", length = 50)
    private String creadoPorRol;

    @Column(name = "actualizado_por", length = 150)
    private String actualizadoPor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}